import { resolve, basename, join } from "path";
import * as fs from "fs";
import { Worker } from "worker_threads";
import * as chokidar from 'chokidar';
import {  SlippiGame } from "@slippi/slippi-js";
import type {  StatsType } from "@slippi/slippi-js";
import { asyncTimeout, hasValidRank, intersectArrayIgnoreCase, insertOrderedByProp, gameToPlayerResults, jsonCopy, unique, defaultTrackerOptions } from '@slippiops/utils';
import { readFiles, getResultFromSlippi, readFoldersRecursively } from '@slippiops/node-utils';

import { checkFilesNotExist } from './db/queries';
import { queryRowsBatch } from "@slippiops/sqllite";
import { MatchTrackerDAL } from "./MatchTrackerDAL";
import { MatchTrackerOptions, GameResults, PlayerRank, PlayerGameResults, MatchMakerInitialLoadPayload } from "@slippiops/types";
import { columnDefs } from "./db/columnDefs";
import { TRACKER_EVENTS } from '@slippiops/types';

export class MatchTracker extends MatchTrackerDAL {
  private parsingFiles = false;
  private initialized = false;
  private cancelledFileParsing = false;
  private fileWatcher: any;
  private directoryWatcher : any;
  readonly detectedYourPlayersCodeToUserId: {[playerCode: string]: string } = {};
  private endingGamePath: string | null = null;
  readonly allWorkers : Worker[] = [];
  readonly availableWorkers : Worker[] = [];
  public currentlyTrackedGame: SlippiGame | null = null; 
  private currentlyTrackedGamePath: string | null = null;
  private initializedCurrentGameResults = false;
  private currentOpponentsRanks: PlayerRank[] | null = null;
  private currentOpponentPlayerIndex : number | null = null;

  private currentGamePendingCodes : { player1Code: string, player1UserId: string, player2UserId: string, player2Code: string, startAt: string } | null = null;
  private endingGameResult: GameResults | null = null;

  private skipPercentCheckForGame = false;

  readonly lastProcessedResult : {index: number, result?: GameResults | null } = { index: -1, result: null };
  readonly queuedProcessedResults : Array<{index: number, result?: GameResults | null }> = [];
  readonly foundRepeatingCodes : Array<string> = [];

  private curGameCheckIteration = 0;
  private gameCheckInterval : NodeJS.Timeout | null = null;


  public constructor() {
    super();
  }

  public close() {
    this.fileWatcher?.close();
    delete this.fileWatcher;
    this.directoryWatcher.close();
    delete this.directoryWatcher;
  }

  private resetState() {
    for(const key in this.detectedYourPlayersCodeToUserId) {
      delete this.detectedYourPlayersCodeToUserId[key];
    }
    this.initialized = false;
    this.currentGamePendingCodes = null;
    this.currentOpponentsRanks = null;
    this.currentOpponentPlayerIndex = null;
    this.endingGameResult = null;
    this.initializedCurrentGameResults = false;
    this.currentlyTrackedGame = null;
    this.currentlyTrackedGamePath = null;
    this.curGameCheckIteration = 0;
    this.parsingFiles = false;
    this.lastProcessedResult.index = -1;
    this.lastProcessedResult.result = null;
    this.queuedProcessedResults.length = 0;
    this.foundRepeatingCodes.length = 0;
    this.cancelledFileParsing = true;
  }

  public async hardResetApplication() {
    this.cancelledFileParsing = true;
    this.clearIntervals();
    this.close();
    this.resetState();
    this.opts = defaultTrackerOptions();
    this.hardReset = true;
    await this.deleteDatafiles();
    this.cancelledFileParsing = false;
  }

  public cancelFileParsing() {
    this.cancelledFileParsing = true;
  }

  private validateGame(game: SlippiGame): boolean {
    const settings = game.getSettings();
    if (!settings?.players) {
      return false;
    }

    const playersArray = Object.values(settings.players);
    if (playersArray.length !== 2) {
      return false;
  }

    if(!playersArray.every(a => !!a.connectCode)) {
      console.error("Some players in array:", playersArray, "did not have a code");
      return false;
    }
    return true;
  }

  private validateEndedGame(game: SlippiGame): boolean {
    if (!this.validateGame(game)) {
      return false;
    }

    const end = game.getGameEnd();
    if (!end) {
      return false;
    }
    return true;
  }

  public disablePercentCheckForCurrentGame() {
    this.skipPercentCheckForGame = true;
  }

  public addGameSlippi(game: SlippiGame, filePath: string) : { result: GameResults, stats: StatsType | null } | null {
    if (!this.validateEndedGame(game)) {
      return null;
    }
    const result = getResultFromSlippi(filePath, game);
    if(!('error' in result) && result.data) {
      return result.data as { result: GameResults, stats: StatsType | null };
    }
  
    return null;
  }

  private initWorker() {
    const createdWorker = new Worker(resolve(__dirname, 'processSlippiFile.worker.js'), {
      workerData: { currentCodes: this.opts.currentCodes }
    });

    const onExit = () => {
      this.logger.info('created worker on exit')
        const idx = this.allWorkers.indexOf(createdWorker);
        if(idx >= 0) {
            this.allWorkers.splice(idx, 1);
            const availIdx = this.availableWorkers.indexOf(createdWorker);
            if(availIdx > -1) {
              this.availableWorkers.splice(availIdx, 1);
            }         
        }
    }

    createdWorker.once('error', (e) => {
      this.logger.error('created worker error', e);
      createdWorker.terminate();
      onExit();
    });
    createdWorker.once('exit', onExit);
    this.allWorkers.push(createdWorker)
    return createdWorker;
  }

  private async resolveAsync(filePath: string) : Promise<{ data?: any, error: string } | { data: { result: GameResults, stats?: StatsType | null } }> {
    const worker = this.availableWorkers.pop() || this.initWorker();
  //  this.logger.info("posting message...");
    worker.postMessage(filePath);

    return new Promise((resolve)=> {
      worker.once('message', (result) => {
       // this.logger.info("got message back");
        if(this.availableWorkers.length < this.opts.useCpus) {
          this.availableWorkers.push(worker);
          this.emit(TRACKER_EVENTS.FREED_WORKER);
        } else {
          try {
            worker.terminate();
          } catch (e) {
            this.logger.error('Error terminating worker', e);
          }
          const idx = this.allWorkers.indexOf(worker);
          if(idx >= 0) {
            this.allWorkers.splice(idx, 1);
          }
        }
        return resolve(result);
      });
    })
  }

  public async getUniqueCodes() {
    if(this.lastProcessedResult.result !== null) {
      throw new Error(`Should not call refresh codes while processing results`);
    }
    await queryRowsBatch(this.db!, columnDefs, "results", {
      select: ['player1Code', 'player2Code', 'startAt'],
      sort: {
        sortBy: 'startAt',
        sortDirection: 'asc',
      },
      batchSize: 500,
      recordCallback: (record, index) => {
        this.checkForRepeatingPlayer(index, record);
      }
    }); 
    const codes = [...this.foundRepeatingCodes];
    this.resetRecentTrackedResults();
    return codes;
  }

  private async awaitTillFree() {
    return new Promise((resolve) => {
      this.once(TRACKER_EVENTS.FREED_WORKER, () => {
        return resolve(true);
      })
    })
  }

  private addDetectedCode(code: string, userId: string) {
    if(!(code in this.detectedYourPlayersCodeToUserId)) {
      this.detectedYourPlayersCodeToUserId[code] = userId;
      const m = this.getMeta();
      m.detectedUserCodes = {
        ...m.detectedUserCodes,
        ...this.detectedYourPlayersCodeToUserId,
      }
      m.lastUsedCode = code;
      m.lastUsedUserId = userId
      this.saveMeta(m);
    }
    if(!this.opts.currentCodes.includes(code)) {
      this.opts.currentCodes.push(code);
    }
  }
  private getRepeatingPlayerCode (result: GameResults, result2: GameResults) : string | null  {
    const repeated = intersectArrayIgnoreCase([result.player1Code, result.player2Code], [result2.player1Code, result2.player2Code]);
    if(repeated.length === 1) {
      const code = repeated[0];
      if(!this.foundRepeatingCodes.includes(code)) {
        this.foundRepeatingCodes.push(code);
        const userId = code === result.player1Code ? result.player1UserId : result.player2UserId;
        this.addDetectedCode(code, userId);
      }
      return code;
    }
    return null;
  }

  private checkForRepeatingPlayer (index: number, result?: GameResults | null){
    if(index !== this.lastProcessedResult.index+1) {
      insertOrderedByProp(this.queuedProcessedResults, { result, index }, 'index');
      return;
    }
    if(this.lastProcessedResult.result && result) {
      this.getRepeatingPlayerCode(this.lastProcessedResult.result, result);
    }
    this.lastProcessedResult.result = result;
    this.lastProcessedResult.index = index;
    if(this.queuedProcessedResults[0]?.index === index+1) {
      const next = this.queuedProcessedResults.shift();
      this.checkForRepeatingPlayer(next!.index, next!.result);
    }
  }

  private async parseParallel(filePaths: string[]) {
    let i = 0;
    let parsedSoFar = 0;

    this.logger.info('Loading parallel')

    while(parsedSoFar < filePaths.length) {
      if(i >= filePaths.length) {
        await asyncTimeout(100);
        continue;
      }

      if(this.cancelledFileParsing) {
        return;
      }

      if(!this.availableWorkers.length && this.allWorkers.length >= this.opts.useCpus) {
        await this.awaitTillFree();
      }
      const filePath = filePaths[i];
      const curIndex = i;
      let didCheck = false;
      this.resolveAsync(filePath).then((res) => {
        if(!this.parsingFiles || !this.db) {
          didCheck = true;
          return;
        }
        didCheck = true;
        this.checkForRepeatingPlayer(curIndex, res.data.result);
        if(!('error' in res)) {
          this.persistResults(res.data.result, res.data.stats);
        } else {
          this.persistInvalidResult(filePath, res.error, res.data);
        }
      }).finally(() => {
        if(!didCheck) {
          this.checkForRepeatingPlayer(curIndex, null);
        }
        parsedSoFar++;
        this.emit(TRACKER_EVENTS.PARSED_FILE, parsedSoFar);
      });
      i++;
    }
    return new Promise((resolve) => {
      if(this.persisting) {
        this.once(TRACKER_EVENTS.PERSIST_FINISH, () => {
          return resolve(true);
        })
      }
      return resolve(true);
    })
  }

  private async parseInProcess(files: string[]) {
    const start = Date.now();
    let parsedSoFar = 0;
    for(let i = 0; i < files.length; i++) {
      if(this.cancelledFileParsing || !this.parsingFiles || !this.db) {
        return;
      }
      
      const doProcess = async () => {
        const f = files[i]
        return new Promise((resolve) => {
          setImmediate(() => {
            const result = this.addGameSlippi(new SlippiGame(f, { processOnTheFly: false }), f);
            if(!this.parsingFiles || !this.db) {
              return resolve(true);
            }
            this.checkForRepeatingPlayer(i, result?.result);
            if(result?.result) {
              this.persistResults(result.result, result.stats)
            } else {
              const fileName = basename(f);
              this.persistInvalidResult(fileName, "unknown");
            }
            this.emit(TRACKER_EVENTS.PARSED_FILE, i+1);
            parsedSoFar++;
            /*
            if(!(parsedSoFar % 20)) {
              console.log('took', ((Date.now() - start) / 1000), 'seconds to parse', parsedSoFar, 'files')
            }
              */
            return resolve(true);
          });
        });
      }
      await doProcess();
    }
  }

  private clearWorkers() {
    this.allWorkers.forEach(w => {
      w.terminate();
    })
    this.allWorkers.length = 0;
    this.availableWorkers.length = 0;
  }

  public validateSlippiFolder(path: string) : { files: number, folders: number, duplicates: number } | null {
    const exists = fs.existsSync(path);
    if(!exists) {
      return null;
    }
    const { files, folders, duplicates } = this.getSlippiFileAndFolders(path, {}, true);
    return {
      duplicates: duplicates.length,
      files: files.length,
      folders: folders.length,
    }
  }

  private resetRecentTrackedResults() {
    this.lastProcessedResult.index = -1;
    this.lastProcessedResult.result = null;
    this.queuedProcessedResults.length = 0;
    this.foundRepeatingCodes.length = 0;
  }

  public async load() {
    if(this.hardReset) { return; }
    this.emit(TRACKER_EVENTS.LOAD_START)
    this.logger.info(`Refreshing rank...`);
    const activeRank = await this.refreshYourRankIfNeeded();
    const characterNotes = await this.getCharacterNotes();
    this.emit(TRACKER_EVENTS.CHARACTER_NOTES, characterNotes);
    this.emit(TRACKER_EVENTS.LOAD_FINISH)
  }

  /**
   * 
   * @param path - path to search for .slp files
   * @param folderTimetstamps - lookup of directories and the last time they were checked so we can know if we can skip it.
   * @returns valid folders and files
   */
  private getSlippiFileAndFolders (path: string, folderTimetstamps?: {[key: string]: number }, checkForDups=false) : { duplicates: string[], folders: string[], files: string[], } {
   
    const returnObj : { folders: string[], files: string[], duplicates: string[], } = { folders: [], files: [], duplicates: [], };
    if(this.opts.recursivelyAllPaths) {
      const folders = readFoldersRecursively(path, folderTimetstamps || {});
      for(let i = 0; i < folders.length; i++) {
        returnObj.folders.push(folders[i]);
        const _files = readFiles(folders[i]).filter(f => f.endsWith('.slp'));
        if(_files.length) {
          returnObj.files.push(..._files);
        }
      }
    } else {
      if(!folderTimetstamps || (!(path in folderTimetstamps) || folderTimetstamps[path] < fs.statSync(path).mtimeMs)) {
        returnObj.folders.push(path);
        returnObj.files.push(...readFiles(path).filter(f => f.endsWith('.slp')));
      }
    } 
    if(checkForDups) {
      const dupChecks : {[fileName: string]: number} = {};
      returnObj.files.forEach((f, i) => {
        const fileName = basename(f);
        if(fileName in dupChecks) {
          returnObj.duplicates.push(f);
        } else {
          dupChecks[fileName] = i;
        }
      });
    }
    return returnObj;
  }

  public async parse(path: string) {
    this.resetRecentTrackedResults();
    const oldMeta = this.getMeta();
    this.emit(TRACKER_EVENTS.META, oldMeta);
    const { folderTimetstamps } = oldMeta;
    console.time('check-exist')
    const { folders, files } = this.getSlippiFileAndFolders(path, folderTimetstamps);    
    const notExists = await checkFilesNotExist(this.db!, "results", files, 500, false);
    const stillRemaining = await checkFilesNotExist(this.db!, "invalid_results", notExists, 500, true);
    // incase the same slippi file is in two directories, catch it here...

    const uniqueNameToPaths : {[fileName: string]: string } = {};
    stillRemaining.forEach(f => {
      const fileName = basename(f);
      if(fileName in uniqueNameToPaths) {
        this.logger.warn(`Duplicate file found ${fileName} in ${f} and ${uniqueNameToPaths[fileName]}... skipping...`);
      } else {
        uniqueNameToPaths[fileName] = f;
      }
    });

    const finalFilesToParse = Object.values(uniqueNameToPaths);

    console.timeEnd('check-exist');
    this.parsingFiles = finalFilesToParse.length > 0;
    this.emit(TRACKER_EVENTS.PARSE_START, finalFilesToParse.length);

    if(finalFilesToParse.length > 0) {
      this.logger.info(`Parsing ${finalFilesToParse.length} files...`);
      const parse =  this.opts.processParallel 
        ? this.parseParallel.bind(this) 
        : this.parseInProcess.bind(this);
        parse(finalFilesToParse).finally(() => {
          this.resetRecentTrackedResults();
          this.logger.info(`Finished parsing ${finalFilesToParse.length} files`);

          if(!this.currentlyTrackedGame) {
            this.parsingFiles = false;
          } else {
            this.once(TRACKER_EVENTS.GAME_END, () => {
              this.parsingFiles = false;
            });
          }
          this.clearWorkers();
          this.emit(TRACKER_EVENTS.PARSE_FINISH, finalFilesToParse.length);
          if(!this.cancelledFileParsing) {
             const prevMeta = this.getMeta();
             const finalFolderTimestamps : {[key: string]: number } = prevMeta.folderTimetstamps || {};
             folders.forEach(f => {
              finalFolderTimestamps[f] = Date.now();
            });
             this.updateMeta({
                folderTimetstamps: finalFolderTimestamps,
             })
          }
        });
    } else {
      this.emit(TRACKER_EVENTS.PARSE_FINISH, finalFilesToParse.length);
    }
  }

  private async endGameIfNeeded() {
    const gameEnd = this.currentlyTrackedGame?.getGameEnd({ skipProcessing: true });
    if(this.endingGamePath !== this.currentlyTrackedGamePath && !!gameEnd) {
      this.logger.info(`Detected need to end game at path: ${this.currentlyTrackedGamePath}`);
      switch(gameEnd.gameEndMethod) {
        case 0:
          this.logger.info(`Game end method was unresolved`);
          break;
        case 3:
          this.logger.info(`Game end method was resolved`);
          break;
        case 2:
          this.logger.info(`Game end method was game`);
          break;
        case 1:
          this.logger.info(`Game end method was time`);
          break;
        case 7:
          this.logger.info(`Game end method was no content`);
          break;
        default:
          this.logger.info(`Unknown game end method: ${gameEnd.gameEndMethod}`)
          break;
      }
      await this.endCurrentGame();
    }
  }

  private checkForPlayerPercents() {
    const frame = this.currentlyTrackedGame?.getLatestFrame();
    if(!frame || this.currentOpponentPlayerIndex === null) {
      return;
    }
    const yourIndex = this.currentOpponentPlayerIndex === 0 ? 1 : 0;
    const opponent = frame.players?.[this.currentOpponentPlayerIndex];
    if(!opponent) {
      return;
    }
    this.emit(TRACKER_EVENTS.PLAYER_PERCENTS, [
      frame.players[yourIndex]?.post?.percent || 0,
      opponent.post?.percent || 0,
    ]);
  }

  private clearIntervals() {
    if(this.gameCheckInterval !== null) {
      this.curGameCheckIteration = 0;
      clearInterval(this.gameCheckInterval);
    }
  }

  private createCurrentGame(path: string) {
    if(this.currentlyTrackedGamePath === path) {
      return;
    }
    this.clearIntervals();
    this.currentGamePendingCodes = null;
    this.currentOpponentsRanks = null;
    this.initializedCurrentGameResults = false;
    this.currentlyTrackedGamePath = path;
    this.currentlyTrackedGame = new SlippiGame(path, { processOnTheFly: true });

    this.gameCheckInterval = setInterval(() => {
      this.curGameCheckIteration++;
      if(this.curGameCheckIteration > 10) {
        this.curGameCheckIteration = 0;
     //   console.time('game-end-check')
        this.endGameIfNeeded();
     //   console.timeEnd('game-end-check')
      } else if (!this.skipPercentCheckForGame) {
       // console.time('percent-check')
        this.checkForPlayerPercents();
      //  console.timeEnd('percent-check')
      }
    }, 1000);
  }

  private setResultRanks(playerResult: PlayerGameResults, gameResult: GameResults, ranks: PlayerRank[] | null) {
        // was going to do it dynamic like this but eh i think it's uglier than just doing if elses.
      ///  const opponentGameResultRankProp = `player${playerResult.opponentPlayerIndex+1}Ranks` as 'player1Ranks' | 'player2Ranks'
        // gameResult[opponentGameResultRankProp] = this.currentOpponentsRanks;
    
    if(playerResult.opponentPlayerIndex === 0) {
      gameResult.player1Ranks = ranks;
      playerResult.opponentRanks = ranks;
      const validRanks = gameResult.player1Ranks?.filter(o => hasValidRank(o));
     
      const highestElo = validRanks?.length ? Math.max(...validRanks.map(r => r.elo)) : null;
      playerResult.opponentHighestElo = highestElo;
      gameResult.player1HighestElo = highestElo;

      const activeElo =  gameResult.player1Ranks?.find(r => r.wasActiveSeason && hasValidRank(r))?.elo || null;
      playerResult.opponentActiveElo = activeElo;
      gameResult.player1ActiveElo = activeElo;
    } else {
      gameResult.player2Ranks = ranks;
      playerResult.opponentRanks = ranks;
      const validRanks = gameResult.player2Ranks?.filter(o => hasValidRank(o));

      const highestElo = validRanks?.length ? Math.max(...validRanks.map(r => r.elo)) : null;
      playerResult.opponentHighestElo = highestElo;
      gameResult.player2HighestElo = highestElo;
      
      const activeElo =  gameResult.player2Ranks?.find(r => r.wasActiveSeason && hasValidRank(r))?.elo || null;
      playerResult.opponentActiveElo = activeElo;
      gameResult.player2ActiveElo = activeElo;
    }
    
    const validRanks = playerResult.opponentRanks?.filter(o => hasValidRank(o)) || [];
    this.persistPlayerRanks(validRanks);
  }
  
  
  public async confirmCode(code: string, startAt: string) {
    const currentPendingCodes = this.currentGamePendingCodes
    this.currentGamePendingCodes = null;
    
    try {
      if(startAt === currentPendingCodes?.startAt) {
        if(code == currentPendingCodes?.player1Code || code == currentPendingCodes?.player2Code) {
          const userId = code === currentPendingCodes.player1Code ? currentPendingCodes.player1UserId : currentPendingCodes.player2UserId;
          this.addDetectedCode(code, userId);
        }
        const result = getResultFromSlippi(this.currentlyTrackedGamePath!, this.currentlyTrackedGame!);
        if(result.data && !('error' in result)) {
          const gameResult :  GameResults = result.data.result as GameResults;   
          const playerResult = gameToPlayerResults(gameResult, this.opts.currentCodes)
          if(playerResult) {
            // only need to update this stuff if it was player2Code since we assume player1Code at first
            if(code === currentPendingCodes?.player2Code) {
              this.currentOpponentsRanks = await this.fetchPlayerRanks(playerResult.opponentCode);
              this.setResultRanks(playerResult, gameResult, this.currentOpponentsRanks);
              this.currentOpponentPlayerIndex = playerResult.opponentPlayerIndex;
              const history = playerResult ? await this.getPlayerResults(playerResult.opponentUserId) : [];
              this.emit(TRACKER_EVENTS.STARTED_GAME_CODE_CONFIRMED, {
                result: playerResult,
                history,
              });
            } else {
              this.emit(TRACKER_EVENTS.STARTED_GAME_CODE_CONFIRMED, null);
            }
          }
        }
      }
    } catch (err) {
      this.logger.error('Error confirming code', err);
    }
  }

  private async initCurrentGame() {
    if(!this.validateGame(this.currentlyTrackedGame!)) {
      return;
    }
    const result = getResultFromSlippi(this.currentlyTrackedGamePath!, this.currentlyTrackedGame!);
    
    if(!result.data || 'error' in result) {
      this.logger.error(`Error getting result from slippi file: ${result['error'] || 'Failed to parse'}`);
      return;
    }
    const gameResult :  GameResults = result.data.result as GameResults;      
    this.initializedCurrentGameResults = true;
    if(gameResult.slpFilePath !== this.currentlyTrackedGamePath) {
      return;
    }
    const currentCodes = [...this.opts.currentCodes];

    if(!currentCodes.includes(gameResult.player1Code) && !currentCodes.includes(gameResult.player2Code)) {
      this.currentGamePendingCodes = { player1Code: gameResult.player1Code, player2Code: gameResult.player2Code, startAt: gameResult.startAt, player1UserId: gameResult.player1UserId, player2UserId: gameResult.player2UserId };
      this.emit(TRACKER_EVENTS.UNKNOWN_CODE_GAME_STARTED, { player1Code: gameResult.player1Code, player2Code: gameResult.player2Code, startAt: gameResult.startAt });
      currentCodes.length = 0; 
      // temporaily set the code to player1Code until it gets confirmed
      currentCodes.push(gameResult.player1Code);
    }

    const playerResult = gameToPlayerResults(gameResult, currentCodes)
    if(playerResult) {
      this.currentOpponentsRanks = await this.fetchPlayerRanks(playerResult.opponentCode);
      this.setResultRanks(playerResult, gameResult, this.currentOpponentsRanks);
      this.currentOpponentPlayerIndex = playerResult.opponentPlayerIndex;
    }

    const history = playerResult ? await this.getPlayerResults(playerResult.opponentUserId) : [];
    if(gameResult.slpFilePath !== this.currentlyTrackedGamePath) {
      return;
    }
    this.logger.info(`watching slippi file located at: ${gameResult.slpFilePath}`);
    this.watch(gameResult.slpFilePath, 15000);
    if(!this.parsingFiles) {
      this.checkForRepeatingPlayer(this.lastProcessedResult.index+1, gameResult)
    }
    this.emit(TRACKER_EVENTS.GAME_START, { 
      result: playerResult, 
      history, 
    });
  }

  private async endCurrentGame() {
    this.endingGamePath = this.currentlyTrackedGamePath;
    this.logger.info(`Game ended at: ${this.currentlyTrackedGamePath}`);
    try {
      this.skipPercentCheckForGame = false;
      this.currentOpponentPlayerIndex = null;
      this.clearIntervals();
      const finalResult = this.addGameSlippi(this.currentlyTrackedGame!, this.currentlyTrackedGamePath!);
      if(finalResult?.result) {
        this.endingGameResult = finalResult.result;
        const playerResult = gameToPlayerResults(finalResult.result, this.opts.currentCodes);
        if(playerResult) {
          this.currentOpponentsRanks = this.currentOpponentsRanks?.length 
          ? this.currentOpponentsRanks 
          : await this.fetchPlayerRanks(playerResult.opponentCode as string);
          this.setResultRanks(playerResult, this.endingGameResult, this.currentOpponentsRanks);
        }
        finalResult.result = await this.persistResults(finalResult.result, finalResult.stats);
      }
      this.endingGameResult = null;
      const playerResult = finalResult?.result ? gameToPlayerResults(finalResult?.result, this.opts.currentCodes) : null;
      if(playerResult) {
        this.persistEloFromGame(playerResult);
        this.invalidateCharacterStatsCache(unique([playerResult.opponentCharacter, playerResult.yourCharacter]));
      } else {
        this.logger.warn(`Error getting player result from game at: ${this.currentlyTrackedGamePath}`);
      }
     
      if(finalResult?.result) {
        this.logger.info(`Winner: ${finalResult?.result?.player1Won ? `${finalResult?.result.player1Nickname}` : `${finalResult?.result?.player2Nickname}`}`);
      } else {
        this.logger.info(`Game ended with invalid result...`);
      }
      this.emit(TRACKER_EVENTS.GAME_END, playerResult);
      this.watch();
      this.currentlyTrackedGame = null;
      this.currentlyTrackedGamePath = null;
      this.currentOpponentsRanks = null;
    } catch (err) {
      this.endingGameResult = null;
      this.logger.error('Error ending game', err);
    };
    this.endingGamePath = null;
  }

  private watch(filePath?: string, directoryWatchInterval?: number, fileWatchInterval?: number) {
    this.unwatch();
    if(filePath) {
      this.fileWatcher = chokidar.watch(filePath, {
        usePolling: true,
        interval: fileWatchInterval || 1000,
        persistent: true,
        ignoreInitial: true,
      })
    }

    this.logger.info(`Watching directory for new slippi files at: ${this.opts.pathToReplays}`);
    this.directoryWatcher = chokidar.watch(this.opts.pathToReplays, {
      usePolling: true,
      interval: directoryWatchInterval || 3000,
      persistent: true,
      ignoreInitial: true,
    });
    
    this.directoryWatcher.on('add', async (path: string) => {
      if(!path.endsWith('.slp')) {
        return;
      }
      if(this.currentlyTrackedGame && this.endingGamePath !== this.currentlyTrackedGamePath) {
        this.logger.info(`Ending current game: ${this.currentlyTrackedGamePath} on added file at: ${path}`);
        await this.endCurrentGame();
      }
      this.logger.info(`New slippi file detected at: ${path} Creating game.`);      
      this.createCurrentGame(path);
    });

    const onChange =  async (path: string) => {
      if(!path.endsWith('.slp')) {
        return;
      }
      if(this.currentlyTrackedGamePath && this.currentlyTrackedGamePath !== path) {
        return;
      }

      if(this.endingGameResult) {
        return;
      }

      if(!this.currentlyTrackedGame) {
        this.logger.info(`Changed slippi file detected at: ${path} Creating game since it wasnt already.`);      
        this.createCurrentGame(path);
      } 
      if(!this.initializedCurrentGameResults && this.currentlyTrackedGame) {
        this.logger.info(`First change of the current slippi game has been detected, initializing game...`);      
        await this.initCurrentGame();
      }

      this.endGameIfNeeded();
    }

    const onChangeWatcher = this.fileWatcher || this.directoryWatcher;
    onChangeWatcher.on('change', onChange);
  }

  private unwatch() {
    if(this.directoryWatcher) {
      this.directoryWatcher.close();
      this.directoryWatcher = null;
    }
    if(this.fileWatcher) {
      this.fileWatcher.close();
      this.fileWatcher = null;
    }
    this.logger.info('Stopped watching files and diretories.');
  }

  public setOptions(opts: MatchTrackerOptions) {
    if(!this.initialized || this.hardReset) {
      return;
    }
    const oldOpts : Partial<MatchTrackerOptions> = jsonCopy(this.opts || {});
    
    if (!opts.currentCodes && !opts.autodetectCodes) {
      throw new Error("need codes or auto detect flag");
    }
    
    if (!opts.pathToReplays) {
      throw new Error("need path to replays");
    }

    const oldPathToReplays = this.opts.pathToReplays;

    this.opts = {
      ...this.opts,
      ...opts,
    };

    if(this.opts.pathToReplays !== oldPathToReplays) {
      if(this.parsingFiles) {
        this.cancelFileParsing();
      }
      // await this.getUniqueCodes();
      if(this.opts.pathToReplays) {
        this.logger.info("Parsing replays...");
        console.time('parse');
        this.parse(this.opts.pathToReplays).finally(() => {
          console.timeEnd('parse');
          this.logger.info("Load finished...");
        })
      }
    }
    
    if(!this.opts.disableLiveTracking && oldOpts.disableLiveTracking) {
      this.watch();
    } else if (this.opts.disableLiveTracking && !oldOpts.disableLiveTracking) {
      this.unwatch();
    } 
    this.emit(TRACKER_EVENTS.SET_OPTIONS, this.opts);
  }

  get initializedDatabase() {
    return !!this.db;
  }

  public async initTracker(opts: MatchTrackerOptions) {
    if(this.hardReset) { return; }
    if(this.initialized) {
      this.emit(TRACKER_EVENTS.LOAD_FINISH);
      return;
    }
    this.initialized = true;
    this.cancelledFileParsing = false;  
   

    if(!opts.pathToDb) {
      throw new Error("Need path to db");
    }
    
    if(!this.db) {
      this.logger.info("Initializing db...")
      await super.initDb(opts.pathToDb);
    }
    await this.load();
    this.setOptions(opts);
    this.watch();
  }
}

