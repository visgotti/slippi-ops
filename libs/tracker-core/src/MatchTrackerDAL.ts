import * as winston from "winston";
import { EventEmitter } from "events";
import type { StatsType } from "@slippi/slippi-js";
import { fetchUserProfile, hasValidRank, gameToPlayerResults, calculateElo, convertToPlayerPrefixedData, getEloRangeForRank, arraysDeepEqual, defaultTrackerOptions } from '@slippiops/utils';
import { ensureExists, fsWriteAsynceDebounced,  } from '@slippiops/node-utils';
import { Database } from 'sqlite3';
import { generateCharacterStatsQuery, queryResultsSqlLite } from './db/queries';
import * as fs from "fs";
import { SELECT_RESULT_VAR_STRING, } from './db/columnDefs';
import { initDb } from './db/init';
import { columnDefs } from "./db/columnDefs";
import {
  upsertSqlLite, allAsync, 
  queryRows, SqlLiteQueryOptions,
  queryRowsWhere, queryRow, updateOne, insertOne, deleteRow, countRows, 
  Where
} from '@slippiops/sqllite'
import { MatchTrackerOptions, MatchNote, QueryParams, GameResults, PlayerGameResults, MatchTrackerMetaData, CharacterNote, RankDbData, PlayerRank, UnprefixedResultData, PlayerNote, CharacterStats, BaseCharacterStats, GameResultsQueryable, ByCharacterStats, ByStageStats, GameType, RankedSeasonData, QuerySort, Player, Chat, ChatMessage } from "@slippiops/types";
import { importTable } from '@slippiops/sqllite';
import { TRACKER_EVENTS } from '@slippiops/types';
const metaDataFile = 'slippi-ops.meta.json'


const INVALID_GAMES_FILE = 'invalid_games.txt';

const defaultMeta = () => ({
  folderTimetstamps: {},
  detectedUserCodes: {}, 
  lastUsedCode: '',
  lastUsedUserId: '',
  unrankedElo: 1100,
  unrankedEloMatches: 0,
} as MatchTrackerMetaData);

type UserDataCache<T> = {
    cachedAsCodes: string[],
    data: T,
}

export class MatchTrackerDAL extends EventEmitter {
  protected hardReset = false;
  protected db?: Database;
  protected persisting = 0;
  protected logger = winston.createLogger({
    level: 'info',
    defaultMeta: { service: 'match-tracker' },
    transports: [
      new winston.transports.Console()
    ]
  });
  public seasons?: RankedSeasonData[];
  
  readonly characterStatsCache: UserDataCache<{[characterId: string]: CharacterStats}> = {
    cachedAsCodes: [],
    data: {}
  }

  readonly pendingCharacterLoads : {[key: string]: boolean } = {}
  protected opts : MatchTrackerOptions = defaultTrackerOptions();

  public constructor() {
    super();
    if(fs.existsSync('character_stats_cache.json')) {
      this.characterStatsCache = JSON.parse(fs.readFileSync('character_stats_cache.json', 'utf-8'));
    }
  }

  override emit(event: string | symbol, data?: null | string | number | boolean | object) {
    super.emit(event, data);
    super.emit('*', { event, data });
    return true;
  }

  public async upsertPlayerChat(opponentUserId: string): Promise<{ chat: Chat, messages: ChatMessage[] }> {
    try {
      const chat: Chat = await upsertSqlLite(this.db!, columnDefs, 'chats', { opponentUserId }, 'opponentUserId');
      const messages = await this.getChatMessages(chat.id);
      return { chat, messages };
    } catch (err) {
      this.logger.error('Failed to create chat', err);
      throw err;
    }
  }

  public async deleteDatafiles(retry=0) {
    this.hardReset = true;
    if(retry > 5) {
      throw new Error(`Failed to delete datafiles after 5 attempts`);
    }
    if(fs.existsSync('character_stats_cache.json')) {
      try {
        fs.unlinkSync('character_stats_cache.json');
      } catch (err) {
        this.logger.error('Failed to delete character stats cache', err);
      }
    }
    if(fs.existsSync(metaDataFile)) {
      try {
        fs.unlinkSync(metaDataFile);
      } catch (err) {
        this.logger.error('Failed to delete meta file', err);
      }
    }
    if(this.db) {
      return new Promise((resolve) => {
        this.db?.close((closeError) => {
          if(closeError) {
            this.logger.error('Failed to close db', closeError);
            return resolve(this.deleteDatafiles(retry + 1));
          }
          delete this.db;
          try {
            fs.unlinkSync(this.opts.pathToDb);
          } catch (err) {
            this.logger.error('Failed to delete db file', err);
            return resolve(this.deleteDatafiles(retry + 1));
          }
          resolve(true);
        });
      });
    } else {
      try {
        fs.unlinkSync(this.opts.pathToDb);
      } catch (err) {
        this.logger.error('Failed to delete db file', err);
        return this.deleteDatafiles(retry + 1);
      }
    }
  }

  public async addChatMessage(message: Omit<ChatMessage, 'id'>): Promise<ChatMessage> {
    try {
      const created = await insertOne(this.db!, 'chat_messages', {
        ...message,
      }) as ChatMessage;
      return created;
    } catch (err) {
      this.logger.error('Failed to add chat message', err);
      throw err;
    }
  }

  public async getChatMessages(chatId: number) : Promise<ChatMessage[]> {
    try {
      // Query all messages where chatId matches
      const messages = await queryRowsWhere(this.db!, columnDefs, 'chat_messages', { chatId }) as ChatMessage[];
      return messages;
    } catch (err) {
      this.logger.error('Failed to retrieve chat messages', err);
      throw err;
    }
  }

  public async initDb(pathToDb: string) {
    this.db = await initDb(pathToDb);
    this.emit(TRACKER_EVENTS.INITIALIZED_DB, true);
  }
  private getCurrentPlayerWhere(
    playerWhere: Partial<UnprefixedResultData> = {},
    opponentPlayerWhere: Partial<UnprefixedResultData> = {},
    otherQueryParams: GameResultsQueryable = {}
  ) : Where {
    const prefixedData = convertToPlayerPrefixedData(playerWhere)
    const prefixedOpponentwhere = convertToPlayerPrefixedData(opponentPlayerWhere);
    return [
      {
        player1Code: {
          oneOf: this.opts.currentCodes,
        },
        ...prefixedData[0],
        ...prefixedOpponentwhere[1],
        ...otherQueryParams,
      }, {
        player2Code: {
          oneOf: this.opts.currentCodes,
        },
        ...prefixedData[1],
        ...prefixedOpponentwhere[0],
        ...otherQueryParams,
      }
    ]
  }

  private getOponentPlayerWhere(
    opponentPlayerWhere: Partial<UnprefixedResultData> = {}, 
    yourPlayerWhere: Partial<UnprefixedResultData> = {},
    otherQueryParams: Partial<Omit<GameResults, 'raw' | 'notes' | 'player1Ranks' | 'player2Ranks'>> = {}
  ) : Where {
    const yourPlayerData = convertToPlayerPrefixedData(yourPlayerWhere)
    const opponentPlayerData = convertToPlayerPrefixedData(opponentPlayerWhere)
    return [
      {
        player1Code: {
          notOneOf: this.opts.currentCodes,
        },
        player2Code: {
          oneOf: this.opts.currentCodes
        },
        ...opponentPlayerData[0],
        ...yourPlayerData[1],
        ...otherQueryParams,
      }, {
        player2Code: {
          notOneOf: this.opts.currentCodes,
        },
        player1Code: {
          oneOf: this.opts.currentCodes
        },
        ...opponentPlayerData[1],
        ...yourPlayerData[0],
        ...otherQueryParams,
      }
    ]
  }

  public async getTotalMatches() : Promise<number> {
    return countRows(this.db!, columnDefs, 'results', {
      where: this.getCurrentPlayerWhere(),
    })
  }

  protected persistCharacterStatsCache() {
    fsWriteAsynceDebounced('character_stats_cache.json', JSON.stringify(this.characterStatsCache), 10000);
  }

  protected async invalidateCharacterStatsCache(characterId?: number | number[]) {
    if(characterId === undefined) {
      // clear entire cache
      this.characterStatsCache.data = {};
      this.characterStatsCache.cachedAsCodes = this.opts.currentCodes;
      this.persistCharacterStatsCache();
      return;
    }
    const ids = Array.isArray(characterId) ? characterId : [characterId]; 
    let hadAny = false;
    ids.forEach(id => {
      if(!this.characterStatsCache.data[id]) {  return; }
      hadAny = true;
      delete this.characterStatsCache.data[id];
    });
    if(hadAny) { this.persistCharacterStatsCache(); }
  }

  public async getBaseCharacterStats(characterId: number, stageId?: number, character2?: number) : Promise<{ timesWonAgainst: number, timesPlayedAgainst: number, timesLostAgainst: number }> {
    const otherQueryParam = (character2 !== null && character2 !== undefined) 
      ? { character: character2 } 
      : {};

    const stageParam = (stageId !== null && stageId !== undefined) 
      ? { stageId } 
      : {};

      /*
    const timesPlayedAs = await countRows(this.db!, columnDefs, columnDefs, 'results', {
      where: this.getCurrentPlayerWhere({
        character: characterId,
      }, otherQueryParam, stageParam)
    });

    const timesWonAs = await countRows(this.db!, columnDefs, columnDefs, 'results', {
      where: this.getCurrentPlayerWhere({
        character: characterId,
        won: true,
      }, otherQueryParam, stageParam)
    });

    */
    const timesPlayedAgainst = await countRows(this.db!, columnDefs, 'results', {
      where: this.getOponentPlayerWhere({
        character: characterId,
      }, otherQueryParam, stageParam)
    });

    const timesLostAgainst = await countRows(this.db!, columnDefs, 'results', {
      where: this.getOponentPlayerWhere({
        character: characterId,
        won: true,
      }, otherQueryParam, stageParam)
    });
    
    return { 
      timesWonAgainst: timesPlayedAgainst - timesLostAgainst,
      timesPlayedAgainst,
      timesLostAgainst,
    }
  }
  
  public async getCharacterStats(characterId: number) : Promise<CharacterStats> {
    if(!arraysDeepEqual(this.opts.currentCodes, this.characterStatsCache.cachedAsCodes)) {
      this.invalidateCharacterStatsCache();
    } else if(this.characterStatsCache.data[characterId]) {
      return this.characterStatsCache.data[characterId];
    }
    console.time('getCharacterStats');
    const queryString = generateCharacterStatsQuery(this.opts.currentCodes, characterId);

    const { timesPlayedAgainst, timesWonAgainst, timesLostAgainst } = await this.getBaseCharacterStats(characterId);
    const baseStats : BaseCharacterStats = {
      timesPlayedAs: 0,
      timesPlayedAgainst,
      timesWonAs: 0,
      timesLostAs: 0,
      timesWonAgainst,
      timesLostAgainst,
    }
    
    const rows : Array<{
      characterId: number,
      stageId: "Total" | number,
      won: "Total" | "yes" | "no",
      opponentCharacter: "Total" | number,
      count: number,
    }> = await allAsync(this.db!, queryString);
    
    const byStage : {[stageId: string]: ByStageStats } = {};
    const byCharacter : {[characterId: string]: ByCharacterStats } = {};
    
    rows.forEach(r => {
      const { won, stageId, opponentCharacter, count } = r;
      const ensureStageInit = () => {
        if(!(stageId in byStage)) {
          byStage[stageId] = {
            timesPlayedAs: 0,
            timesWonAs: 0,
            timesLostAs: 0,
            byCharacter: {}
          };
        }
      }
      const ensureCharInit = () => {
        ensureStageInit();
        if(!byStage[stageId].byCharacter[opponentCharacter]) {
          byStage[stageId].byCharacter[opponentCharacter] = {
            timesLostAgainst: 0,
            timesWonAgainst: 0,
            timesPlayedAgainst: 0,
          }
        }
      }

      if(won !== "Total") {
        if(stageId !== "Total" && opponentCharacter === "Total") {
          ensureStageInit();
          const key = won === "yes" ? 'timesWonAs' : 'timesLostAs';

          // for some reason these records come back twice so make sure it only gets initialized once.
          if(!byStage[stageId][key]) {
            byStage[stageId][key] = count;
            byStage[stageId].timesPlayedAs += count;
            baseStats[key] += count;
            baseStats.timesPlayedAs += count;
          }
        // add to byStage
        } else if(stageId === "Total" && opponentCharacter !== "Total") {
        // add to byStage.byCharacter
        const key = won === "yes" ? 'timesWonAgainst' : 'timesLostAgainst';
          if(!byCharacter[opponentCharacter]) {
              byCharacter[opponentCharacter] = {
                timesLostAgainst: 0,
                timesWonAgainst: 0,
                timesPlayedAgainst: 0,
              } as ByCharacterStats;
          }
          byCharacter[opponentCharacter][key] = count;
          byCharacter[opponentCharacter].timesPlayedAgainst += count;
        } else if (stageId !== "Total" && opponentCharacter !== "Total"){
          // specific character record
          ensureCharInit();
          const key = won === "yes" ? 'timesWonAgainst' : 'timesLostAgainst';
          byStage[stageId].byCharacter[opponentCharacter][key] = count;
          byStage[stageId].byCharacter[opponentCharacter].timesPlayedAgainst += count;
        }
      } else {
        // baseStats.timesPlayedAs += count;
        // add to total games played
      }
    });
    console.timeEnd('getCharacterStats');
    // fs.writeFileSync('byStage.json', JSON.stringify({ byStage, byCharacter }, null, 2), 'utf-8');
      
    const finalStats = {
      ...baseStats,
      byStage,
      byCharacter,
    }
    this.characterStatsCache.data[characterId] = finalStats,
    this.persistCharacterStatsCache();
    return finalStats;
  }

  public async saveMatchNotes(resultId: number, notes: Array<MatchNote>) {
    try {
      await updateOne(this.db!, columnDefs, 'results', resultId, { notes })
      return true;
    } catch (err) {
      return false;
    }
  }
 
  protected ensurePersistExists() {
    ensureExists(INVALID_GAMES_FILE);
  }

  public async persistInvalidResult(filePath: string, error: string, data?: any) {
    try {
      await this.db!.run(`
        INSERT INTO invalid_results (slpFilePath, error, data) 
        VALUES (?, ?, ?)
      `, [filePath, error, JSON.stringify(data)]);
    } catch (err) {
      this.logger.error('Failed to persist invalid result', err);
    }
  }

  public async updateSeasonData(season: RankedSeasonData) {
    if(!this.seasons) {
      this.seasons = await queryRows(this.db!, columnDefs, 'seasons');
    }

    // find if the season exists but the end date WAS null and now it's not 
    const prevActive = this.seasons?.find(s => 
      s.name === season.name && !!s.endedAt !== !!season.endedAt
    );
  
    // first check if the season has ended but we think it hasnt
    if(prevActive) {
      if(prevActive?.endedAt) {
        throw new Error(`Previous active should not have an ended date..`)
      }
      prevActive.endedAt = season.endedAt;
      await updateOne(this.db!, columnDefs, 'seasons', prevActive.id, { endedAt: season.endedAt });
      this.emit(TRACKER_EVENTS.SEASONS, this.seasons)
      return;
    } 

    if(!this.seasons?.some(s => s.name === season.name || s.slippiId === season.slippiId)) {
      const inserted : RankedSeasonData = await insertOne(this.db!, 'seasons', season);
      this.seasons!.push(inserted);
      this.emit(TRACKER_EVENTS.SEASONS, this.seasons)
    } 
  }

  private formatQueryAndValues(query: string, params?: QueryParams) {
    const values: any[] = [];
    const codeString = this.opts.currentCodes.map((c: string) => `'${c}'`).join(',');

    const { ranked, unranked, direct } = params?.filters || {};

    if (ranked && unranked && direct) {
      // do nothing this is all types
    } else {
      const conditions : string[] = [];
      if (ranked) {
        conditions.push(`type = ${GameType.RANKED}`);
      }
      if (unranked) {
        conditions.push(`type = ${GameType.UNRANKED}`);
      }
      if (direct) {
        conditions.push(`type = ${GameType.DIRECT}`);
      }
      if (conditions.length > 0) {
        query += ` AND (${conditions.join(' OR ')})`;
      }
    }

    if(params?.filters?.includeFinished && params?.filters.opponentQuit && params?.filters?.youQuit) {
      // do nothing includes all games
    } else if (params?.filters?.includeFinished || params?.filters?.opponentQuit || params?.filters?.youQuit) {
      const conditions : string[] = [];
      if (params?.filters?.includeFinished) {
        conditions.push('(player1Quit = 0 AND player2Quit = 0)');
      }
      if (params.filters.youQuit) {
        conditions.push(`
          (
            (player1Code in (${codeString}) AND player1Quit = 1)
            OR
            (player2Code in (${codeString}) AND player2Quit = 1)
          )
        `);
      }
      if (params.filters.opponentQuit) {
        conditions.push(`
          (
            (player1Code in (${codeString}) AND player2Quit = 1)
            OR
            (player2Code in (${codeString}) AND player1Quit = 1)
          )
        `);
      }
      query += ` AND (${conditions.join(' OR ')})`;
    }

    if (params?.filters?.startAtBefore) {
      const date = new Date(params.filters.startAtBefore).getTime();
      query += ' AND startAt < ?';
      values.push(date);
    }

    if (params?.filters?.startAtAfter) {
      const date = new Date(params.filters.startAtAfter).getTime();
      query += ' AND startAt > ?';
      values.push(date);
    }
   
    // Handling opponentString filter
    if (params?.filters?.opponentString) {
      const { opponentString, searchOnlyOpponentCodes, searchOnlyOpponentNicknames, opponentSearchExactMatch } = params.filters;
    
      const formattedStringExact = opponentString;
      const formattedStringLike = `%${opponentString.toUpperCase()}%`;
    
      if (searchOnlyOpponentCodes === searchOnlyOpponentNicknames) {
        // both are true or both are false, search both code and name
        if (opponentSearchExactMatch) {
          query += `
          AND (
            (player1Code in (${codeString}) AND (player2Code = '${formattedStringExact}' OR player2Nickname = '${formattedStringExact}'))
            OR
            (player2Code in (${codeString}) AND (player1Code = '${formattedStringExact}' OR player1Nickname = '${formattedStringExact}'))
          )`;
        } else {
          query += `
          AND (
            (player1Code in (${codeString}) AND (UPPER(player2Code) LIKE '${formattedStringLike}' OR UPPER(player2Nickname) LIKE '${formattedStringLike}'))
            OR
            (player2Code in (${codeString}) AND (UPPER(player1Code) LIKE '${formattedStringLike}' OR UPPER(player1Nickname) LIKE '${formattedStringLike}'))
          )`;
        }
      } else if (searchOnlyOpponentCodes) {
        if (opponentSearchExactMatch) {
          query += `
          AND (
            (player1Code in (${codeString}) AND player2Code = '${formattedStringExact}')
            OR
            (player2Code in (${codeString}) AND player1Code = '${formattedStringExact}')
          )`;
        } else {
          query += `
          AND (
            (player1Code in (${codeString}) AND UPPER(player2Code) LIKE '${formattedStringLike}')
            OR
            (player2Code in (${codeString}) AND UPPER(player1Code) LIKE '${formattedStringLike}')
          )`;
        }
      } else if (searchOnlyOpponentNicknames) {
        if (opponentSearchExactMatch) {
          query += `
          AND (
            (player1Code in (${codeString}) AND player2Nickname = '${formattedStringExact}')
            OR
            (player2Code in (${codeString}) AND player1Nickname = '${formattedStringExact}')
          )`;
        } else {
          query += `
          AND (
            (player1Code in (${codeString}) AND UPPER(player2Nickname) LIKE '${formattedStringLike}')
            OR
            (player2Code in (${codeString}) AND UPPER(player1Nickname) LIKE '${formattedStringLike}')
          )`;
        }
      }
    }
      
    // Handling yourString filter
    if (params?.filters?.yourString) {
      const { yourString, searchOnlyYourCodes, searchOnlyYourNicknames, yourSearchExactMatch } = params.filters;
    
      const formattedStringExact = yourString;
      const formattedStringLike = `%${yourString.toUpperCase()}%`;
    
      if (searchOnlyYourCodes === searchOnlyYourNicknames) {
        // both are true or both are false, search both code and name
        if (yourSearchExactMatch) {
          query += `
          AND (
            (player1Code in (${codeString}) AND (player1Code = '${formattedStringExact}' OR player1Nickname = '${formattedStringExact}'))
            OR
            (player2Code in (${codeString}) AND (player2Code = '${formattedStringExact}' OR player2Nickname = '${formattedStringExact}'))
          )`;
        } else {
          query += `
          AND (
            (player1Code in (${codeString}) AND (UPPER(player1Code) LIKE '${formattedStringLike}' OR UPPER(player1Nickname) LIKE '${formattedStringLike}'))
            OR
            (player2Code in (${codeString}) AND (UPPER(player2Code) LIKE '${formattedStringLike}' OR UPPER(player2Nickname) LIKE '${formattedStringLike}'))
          )`;
        }
      } else if (searchOnlyYourCodes) {
        if (yourSearchExactMatch) {
          query += `
          AND (
            (player1Code in (${codeString}) AND player1Code = '${formattedStringExact}')
            OR
            (player2Code in (${codeString}) AND player2Code = '${formattedStringExact}')
          )`;
        } else {
          query += `
          AND (
            (player1Code in (${codeString}) AND UPPER(player1Code) LIKE '${formattedStringLike}')
            OR
            (player2Code in (${codeString}) AND UPPER(player2Code) LIKE '${formattedStringLike}')
          )`;
        }
      } else if (searchOnlyYourNicknames) {
        if (yourSearchExactMatch) {
          query += `
          AND (
            (player1Code in (${codeString}) AND player1Nickname = '${formattedStringExact}')
            OR
            (player2Code in (${codeString}) AND player2Nickname = '${formattedStringExact}')
          )`;
        } else {
          query += `
          AND (
            (player1Code in (${codeString}) AND UPPER(player1Nickname) LIKE '${formattedStringLike}')
            OR
            (player2Code in (${codeString}) AND UPPER(player2Nickname) LIKE '${formattedStringLike}')
          )`;
        }
      }
    }

    if (params?.filters?.yourCharacters?.length) {
      query += `
      AND (
        player1Code in (${codeString}) AND player1Character in (${params?.filters.yourCharacters.map((c) => c).join(',')})
        OR
        player2Code in (${codeString}) AND player2Character in (${params?.filters.yourCharacters.map((c) => c).join(',')})
      )`;
    }

    if (params?.filters?.opponentCharacters?.length) {
      const opponentCharactersValues = params.filters.opponentCharacters.map((c) => c).join(',');
      query += `
      AND (
        player1Code in (${codeString}) AND player2Character IN (${opponentCharactersValues})
        OR
        player2Code in (${codeString}) AND player1Character IN (${opponentCharactersValues})
      )`;
    }

    if (params?.filters?.yourStocks !== undefined) {
      query += `
      AND (
        (player1Code in (${codeString}) AND player1Stocks = ${params.filters.yourStocks})
        OR
        (player2Code in (${codeString}) AND player2Stocks = ${params.filters.yourStocks})
      )`;
    }

    if (params?.filters?.opponentStocks !== undefined) {
      query += `
        AND (
          (player1Code in (${codeString}) AND player2Stocks = ${params.filters.opponentStocks})
          OR
          (player2Code in (${codeString}) AND player1Stocks = ${params.filters.opponentStocks})
        )`;
    }

    if (params?.filters?.ranks?.length) {
      const eloRanges = params?.filters.ranks.map((rank: string) => getEloRangeForRank(rank));
      const eloConditions = eloRanges.map((range: { min: number, max: number }) => 
        `(
          (player1Code in (${codeString}) AND player2ActiveElo IS NOT NULL AND player2ActiveElo BETWEEN ${range.min} AND ${range.max})
          OR
          (player2Code in (${codeString}) AND player1ActiveElo IS NOT NULL AND player1ActiveElo BETWEEN ${range.min} AND ${range.max})
        )`
      ).join(' OR ');
      query += ` AND (${eloConditions})`;
    }

    if(params?.filters?.stages?.length) {
      const stageIds = params.filters.stages.map(s => s).join(',');
      query += ` AND stageId IN (${stageIds})`;
    }

    if (params?.filters?.startAtAfter) {
      query += ' AND startAt > ?';
      values.push(params?.filters.startAtAfter);
    }

    if (params?.sort?.sortBy) {
      query += ` ${this.getSortingQuery(params.sort, codeString)}`;      
    }

    if(params?.pagination) {
      const { pagination } = params;
      if(typeof pagination === "object") {
        const offset = 'offset' in pagination ? pagination.offset : pagination.page * pagination.size;
        query += ` LIMIT ${pagination.size} OFFSET ${offset}`;
      } else {
        query += ` LIMIT ${pagination}`;
      }
    }
    return { query, values }
  }

  public getCharacterNameCase(column: string): string {
    return `
      CASE ${column}
        WHEN 0 THEN 'Captain Falcon'
        WHEN 1 THEN 'Donkey Kong'
        WHEN 2 THEN 'Fox'
        WHEN 3 THEN 'Mr. Game & Watch'
        WHEN 4 THEN 'Kirby'
        WHEN 5 THEN 'Bowser'
        WHEN 6 THEN 'Link'
        WHEN 7 THEN 'Luigi'
        WHEN 8 THEN 'Mario'
        WHEN 9 THEN 'Marth'
        WHEN 10 THEN 'Mewtwo'
        WHEN 11 THEN 'Ness'
        WHEN 12 THEN 'Peach'
        WHEN 13 THEN 'Pikachu'
        WHEN 14 THEN 'Ice Climbers'
        WHEN 15 THEN 'Jigglypuff'
        WHEN 16 THEN 'Samus'
        WHEN 17 THEN 'Yoshi'
        WHEN 18 THEN 'Zelda'
        WHEN 19 THEN 'Sheik'
        WHEN 20 THEN 'Falco'
        WHEN 21 THEN 'Young Link'
        WHEN 22 THEN 'Dr. Mario'
        WHEN 23 THEN 'Roy'
        WHEN 24 THEN 'Pichu'
        WHEN 25 THEN 'Ganondorf'
        ELSE 'Unknown'
      END
    `;
  }

  public getSortingQuery(params: QuerySort, codeString: string) {
    let sortingQuery = '';
    if (params?.sortBy) {
      switch (params.sortBy) {
        case 'yourStocks':
          sortingQuery = `
            ORDER BY
            CASE
              WHEN player1Code IN (${codeString}) THEN player1Stocks
              WHEN player2Code IN (${codeString}) THEN player2Stocks
              ELSE NULL
            END ${params.sortOrder === 'desc' ? 'DESC' : 'ASC'}
          `;
          break;
        case 'opponentStocks':
          sortingQuery = `
            ORDER BY
            CASE
              WHEN player1Code NOT IN (${codeString}) THEN player1Stocks
              WHEN player2Code NOT IN (${codeString}) THEN player2Stocks
              ELSE NULL
            END ${params.sortOrder === 'desc' ? 'DESC' : 'ASC'}
          `;
          break;
        case 'yourCharacterName':
          sortingQuery = `
            ORDER BY
            CASE
              WHEN player1Code IN (${codeString}) THEN ${this.getCharacterNameCase('player1Character')}
              WHEN player2Code IN (${codeString}) THEN ${this.getCharacterNameCase('player2Character')}
              ELSE NULLthis.
            END ${params.sortOrder === 'desc' ? 'DESC' : 'ASC'}
          `;
          break;
        case 'opponentCharacterName':
        sortingQuery = `
          ORDER BY
          CASE
            WHEN player1Code NOT IN (${codeString}) THEN ${this.getCharacterNameCase('player1Character')}
            WHEN player2Code NOT IN (${codeString}) THEN ${this.getCharacterNameCase('player2Character')}
            ELSE NULL
          END ${params.sortOrder === 'desc' ? 'DESC' : 'ASC'}
        `;
        break;
        case 'youWon':
          sortingQuery = `
            ORDER BY
            CASE
              WHEN player1Code IN (${codeString}) THEN player1Won
              WHEN player2Code IN (${codeString}) THEN player2Won
              ELSE NULL
            END ${params.sortOrder === 'desc' ? 'DESC' : 'ASC'}
          `;
          break;
        case 'opponentWon':
          sortingQuery = `
            ORDER BY
            CASE
              WHEN player1Code NOT IN (${codeString}) THEN player1Won
              WHEN player2Code NOT IN (${codeString}) THEN player2Won
              ELSE NULL
            END ${params.sortOrder === 'desc' ? 'DESC' : 'ASC'}
          `;
          break;
        case 'opponentNickname':
          sortingQuery = `
            ORDER BY
            CASE
              WHEN player1Code NOT IN (${codeString}) THEN player1Nickname
              WHEN player2Code NOT IN (${codeString}) THEN player2Nickname
              ELSE NULL
            END ${params.sortOrder === 'desc' ? 'DESC' : 'ASC'}
          `;
          break;
        case 'opponentCode':
          sortingQuery = `
            ORDER BY
            CASE
              WHEN player1Code NOT IN (${codeString}) THEN player1Code
              WHEN player2Code NOT IN (${codeString}) THEN player2Code
              ELSE NULL
            END ${params.sortOrder === 'desc' ? 'DESC' : 'ASC'}
          `;
          break;
        case 'opponentActiveElo':
          sortingQuery = `
            ORDER BY
            CASE
              WHEN player1Code NOT IN (${codeString}) THEN player1ActiveElo
              WHEN player2Code NOT IN (${codeString}) THEN player2ActiveElo
              ELSE NULL
            END ${params.sortOrder === 'desc' ? 'DESC' : 'ASC'}
          `;
          break;
        default:
          // Default case for fields that don't start with "you" or "opponent"
          sortingQuery = `
            ORDER BY ${params.sortBy} ${params.sortOrder === 'desc' ? 'DESC' : 'ASC'}
          `;
          break;
      }
    }
    return sortingQuery;
  }

  public async queryResults(params?: QueryParams): Promise<PlayerGameResults[]> {
    const codeString = this.opts.currentCodes.map(c => `'${c}'`).join(',');
    const query = `SELECT ${SELECT_RESULT_VAR_STRING} FROM results WHERE (player1Code in (${codeString}) OR player2Code in (${codeString}))`;
    const d = this.formatQueryAndValues(query, params);
    const results = await queryResultsSqlLite(this.db!, d.query, d.values);
    return results?.map((r: GameResults) => {
      return gameToPlayerResults(r, this.opts.currentCodes);
    }).filter((i) => i !== null) as PlayerGameResults[] || []
  }
  
  public async queryResultCount(params: Omit<QueryParams, 'pagination'>): Promise<number> {
    const codeString = this.opts.currentCodes.map(c => `'${c}'`).join(',');
    const query = `SELECT COUNT(*) AS count FROM results WHERE(player1Code in (${codeString}) OR player2Code in (${codeString}))`;
    const d = this.formatQueryAndValues(query, params);
    const r = await allAsync(this.db!, d.query, d.values);
    return r[0].count;
  }
  
  
  async persistResults(result: GameResults, stats?: StatsType | null) : Promise<GameResults> {
    this.persisting++;
    try {
      if(stats) {
        const statsDoc : any = await upsertSqlLite(this.db!, columnDefs, 'stats', {
          stats,
          startAt: result.startAt
        } as any, 'startAt');
        result.statsId = statsDoc.id;
      }
    } catch (err) {
      console.error("Failed to persist stats:", err);
    }
    try {
      const res = await upsertSqlLite(this.db!, columnDefs, 'results', result);
   
      this.persistCharacterStatsFromGame(result);
      this.persisting--;
      if(!this.persisting) {
        this.emit('finish-persist');
      }
      return res;
    } catch (err) {
      this.persisting--;
      if(!this.persisting) {
        this.emit('finish-persist');
      }
      console.error("Failed to persist results ", err);
      throw err;
    }
  }

  async persistEloFromGame(playerResult: PlayerGameResults,) {
    const currentMeta = this.getMeta();
    if(playerResult.opponentActiveElo && (playerResult.youWon || (playerResult.opponentWon && !playerResult.youQuit))) {
      this.updateMeta({
        unrankedEloMatches: Number(currentMeta.unrankedEloMatches) + 1,
        unrankedElo: calculateElo(currentMeta.unrankedElo ?? 1100, playerResult.opponentActiveElo, Number(playerResult.youWon)).player1NewRating
      });
    }
  }

  private persistCharacterStatsFromGame(game: GameResults) {
    const playerResults = gameToPlayerResults(game, this.opts.currentCodes);
    if(playerResults?.yourCharacter !== undefined && playerResults?.yourCharacter !== null) {
      if(!this.characterStatsCache)
      if(playerResults.yourCharacter)  {
        this.invalidateCharacterStatsCache(playerResults.yourCharacter);
      }
    } 
  }
 
  async queryResultRows(options?: SqlLiteQueryOptions) {
    return queryRows(this.db!, columnDefs, 'results', options);
  }

  public async getMatchStats(statIds: number[]) : Promise<StatsType[]> {
    const got = await queryRowsWhere(this.db!, columnDefs, "stats", { id: {
        oneOf: statIds,
      } 
    }) as ({ id: number, stats: StatsType })[];
    if(got.length !== statIds.length) {
      throw new Error(`Did not find all stat records for provided ids...`);
    }
    return statIds.map( id => got.find( stat => stat.id === id)!.stats);
  }

  public async getPlayerResults(playerUserId: string): Promise<PlayerGameResults[]> {
    const r = await this.getResults(playerUserId);
    return r.map(gr => {
      return gameToPlayerResults(gr, this.opts.currentCodes);
    }).filter(gr => !!gr) as PlayerGameResults[];
  }

  public async getResults(playerUserId: string): Promise<GameResults[]> {
      if (!playerUserId) {
        return [];
      }
      const query = `
      SELECT 
      ${SELECT_RESULT_VAR_STRING}
      FROM results 
      WHERE player1UserId = ? OR player2UserId = ?
      ORDER BY startAt DESC
    `;
    return queryResultsSqlLite(this.db!, query, [playerUserId, playerUserId]);
  }

  protected updateMeta(m: Partial<MatchTrackerMetaData>) {
    if(this.hardReset) return;
    const meta = this.getMeta();
    this.saveMeta({
      ...defaultMeta(),
      ...meta,
      ...m,
    });
  }

  public async deletePlayerNote(id: number) {
    return deleteRow(this.db!, 'player_notes', id);
  }

  public async createPlayerNote(playerUserId: string, content: string) : Promise<PlayerNote> {
    return insertOne(this.db!, 'player_notes', {
      userId: playerUserId,
      content,
    });
  }

  public async getPlayerNotes(playerUserId: string) : Promise<PlayerNote[]> {
    return queryRowsWhere(this.db!, columnDefs, 'player_notes', { userId: playerUserId });
  }

  public async updatePlayerNote(id: number, content: string) : Promise<boolean> {
    return updateOne(this.db!, columnDefs, 'player_notes', id, { content });
  }

  public async deleteCharacterNote(id: number) {
    return deleteRow(this.db!, 'character_notes', id);
  }

  public async createCharacterNote(characterId: number, content: string | Partial<CharacterNote>) : Promise<CharacterNote> {
    const noteUpdate : Partial<CharacterNote> = typeof content === "string" ? { content } : content;
    return insertOne(this.db!, 'character_notes', {
      ...noteUpdate,
      characterId,
    }) as unknown as CharacterNote;
  }

  public async updateCharacterNote(id: number, content: string | Partial<CharacterNote>) : Promise<boolean> {
    const noteUpdate = typeof content === "string" ? { content } : content;
    return updateOne(this.db!, columnDefs, 'character_notes', id, noteUpdate);
  }

  public async importCharacterNotes(notesOrPath: string | ({[id: number]: CharacterNote[] })) : Promise<{ succeeded: number, failed: number }> {
    let succeeded = 0;
    let failed = 0;
    const notes : {[id: number]: CharacterNote[] } = typeof notesOrPath === 'string' ? JSON.parse(fs.readFileSync(notesOrPath, 'utf-8')) : notesOrPath;
    for(const characterId in notes) {
      const characterNotes = notes[characterId];
      for(let i = 0; i < characterNotes.length; i++) {
        const { id, ...note } = characterNotes[i];
        try {      
          await insertOne(this.db!, 'character_notes', {
            ...note,
            characterId: Number(characterId),
          });
          succeeded++;
        } catch (err: any) {
          console.error(`Failed to import note: ${err.message}`)
          failed++;
        }
      }
    }
    const allNotes = await this.getCharacterNotes();
    this.emit(TRACKER_EVENTS.CHARACTER_NOTES, allNotes);

    return {succeeded, failed};
  }

  public async exportCharacterNotes(pathTo: string) {
    const notes = await this.getCharacterNotes();
    if(!pathTo.endsWith('.json')) {
      pathTo = `${pathTo}.json`;
    }
    fs.writeFileSync(pathTo, JSON.stringify(notes, null, 2), 'utf-8'); 
    return true;
  }

  public async getCharacterNotes() : Promise<{[id: number]: CharacterNote[] }> {
    const notes = await queryRows(this.db!, columnDefs, 'character_notes');
    const lookup : { [id: number]: CharacterNote[] } = {};
    notes.forEach((n : CharacterNote) => {
      if(!(n.characterId in lookup)) {
        lookup[n.characterId] = [];
      }
      lookup[n.characterId].push(n);
    })
    return lookup;
  }
  
  public exportDatabase(toPath: string) {
    fs.copyFileSync(this.opts.pathToDb, toPath);
  }

  protected getMeta(raw: true) : string;
  protected getMeta(raw: false): MatchTrackerMetaData;
  protected getMeta() : MatchTrackerMetaData;
  protected getMeta(raw=false) : MatchTrackerMetaData | string {
    ensureExists(metaDataFile);
    const f = fs.readFileSync(metaDataFile, 'utf-8');
    if(f === '') {
      const meta = defaultMeta();
      return raw ? JSON.stringify(meta) : meta;
    }
    return raw ? f : JSON.parse(f);
  }

  protected saveMeta(m:  MatchTrackerMetaData) {
    if(this.hardReset) return;
    const meta = this.getMeta(true);
    const encoded = JSON.stringify(m);
    if(encoded !== meta) {
      this.emit(TRACKER_EVENTS.META, m);
      return fs.writeFileSync(metaDataFile, encoded, 'utf-8');
    }
  }

  public async importDatabase(pathToDb: string) {
    this.emit(TRACKER_EVENTS.DB_IMPORT_START)
    const db = new Database(pathToDb);
    
    const oldToNewIds : {[key: string]: number } = {};    
    let success = 0;
    let failed = 0;
    let table = 'stats';

    const finishRow = (succeeded: boolean) => {
      succeeded ? success++ : failed++;
      this.emit(TRACKER_EVENTS.DB_IMPORT_ROW, { table, success, failed })
    }

    const doImport = async<T>(
      onSucceeded?: ((records: any) => void) | null,
      onBeforeInsert?: ((record: T & { id: number }) => T) | null
    ) => {
      return importTable(db, this.db!, columnDefs, table, {
        onStart: (rows: number) => this.emit(TRACKER_EVENTS.DB_IMPORT_TABLE_START, { table, rows }),
        onSucceeded: (records: any) => {
          finishRow(true);
          onSucceeded?.(records);
        },
        onFailed: () => finishRow(false),
        onBeforeInsert: (record: T & { id: number }) => {
          return onBeforeInsert?.(record) || record;;
        },
      });
    }

    await doImport(({ oldRecord, newRecord }) => {
      oldToNewIds[oldRecord.id] = newRecord.id;
    });

    success = 0, failed = 0, table = 'results';
    await doImport(null, (result: GameResults) => {
      if(result.statsId) {
        result.statsId = oldToNewIds[result.statsId];
      } else {
        delete result.statsId;
      }
      return result;
    });

    success = 0, failed = 0, table = 'players';
    await doImport();

    success = 0, failed = 0, table = 'ranks';
    await doImport();

    success = 0, failed = 0, table = 'character_notes';
    await doImport();

    this.emit(TRACKER_EVENTS.DB_IMPORT_FINISH)
  }


  protected async refreshYourRankIfNeeded() : Promise<RankDbData | null>{
    const { lastUsedCode, lastUsedUserId } = this.getMeta();
    if(!lastUsedCode || !this.opts.currentCodes.includes(lastUsedCode)) {
      return null;
    }

    let activeRank : RankDbData | null = null;

    const yourRanks = await this.fetchPlayerRanks(lastUsedCode);
    for(let i = 0; i < yourRanks.length; i++) {
      const r = yourRanks[i];
      if(!hasValidRank(r)) continue;
      const rankRecord : RankDbData = await queryRow(this.db!, columnDefs, 'ranks', {
        sort: {
          sortBy: 'updatedAt',
          sortDirection: 'desc',
        },
        where: {
          seasonId: r.seasonId,
          userId: lastUsedUserId,
        }
      });

      const updatePayload : Omit<RankDbData, 'id'> = {
        ...r,
        updatedAt: `${Date.now()}`,
      }

      let updatedRecord : RankDbData | null = null;
      
      if(!rankRecord || rankRecord.elo !== updatePayload.elo) {
        // we want to make a new record of our players rank if elo changed so we can track progress
        updatedRecord = await insertOne(this.db!, 'ranks', updatePayload);
      } else if (rankRecord.wasActiveSeason || r.wasActiveSeason) {
        await updateOne(this.db!, columnDefs, 'ranks', rankRecord.id, updatePayload)
        updatedRecord = { ...updatePayload, id: rankRecord.id };
      }

      if(updatedRecord && updatedRecord.wasActiveSeason) {
        activeRank = updatedRecord
      }
    }
    return activeRank;
  }

  public async upsertPlayer(player: Player) {
    await upsertSqlLite(this.db!, columnDefs, 'players', player, 'id');
  } 
  public async getPlayer(userId: string) : Promise<Player> {
    return queryRow(this.db!, columnDefs, 'players', { where: { id: userId } });
  }
  public async getPlayerRanks(userId: string) : Promise<PlayerRank[]> {
    return queryRows(this.db!, columnDefs, 'ranks', { where: { userId } });
  }

  public async refreshPlayerRanks(userCode: string) : Promise<PlayerRank[]> {
    const fetched = await this.fetchPlayerRanks(userCode);
    await this.persistPlayerRanks(fetched);
    return fetched;
  }

  public async persistPlayerRanks(ranks: PlayerRank[]) {
    let userId : string | null = null;
    for(let i = 0; i < ranks.length; i++) {
      if(userId === null || userId === undefined) {
        userId = ranks[i].userId;
      }
      const r = ranks[i];

      await upsertSqlLite(this.db!, columnDefs, 'ranks', r as any, ['userId', 'seasonId']);
     // got ? (await updateOne(this.db!, columnDefs, 'ranks', got.id, newRank)) : (await insertOne(this.db!, 'ranks', newRank));
    }
    if(userId) {
      await this.upsertPlayer({ id: userId, fetchedRanksAt: `${Date.now()}` });
    }
  }

  public async fetchPlayerRanks(opponentCodeOrId: string | null) : Promise<PlayerRank[]>{
    const ranks : PlayerRank[] = [];
    if(!opponentCodeOrId) {
      return ranks;
    }
    try {
      const result = await fetchUserProfile(opponentCodeOrId);

      const user : any = result?.data?.getConnectCode?.user || result?.data?.getUser;

      user?.netplayProfiles?.forEach((profile: any) => {
        if(!profile) { return };
        ranks.push({
          userId: user.fbUid,
          globalPlacement: profile.dailyGlobalPlacement,
          regionalPlacement: profile.dailyRegionalPlacement,
          seasonDateStart: profile.season?.startedAt,
          seasonDateEnd: profile.season?.endedAt,
          seasonId: profile.season?.id,
          seasonName: profile?.season?.name,
          wasActiveSeason: profile.season.status === "ACTIVE",
          elo: profile.ratingOrdinal,
          wins: profile.wins,
          losses: profile.losses,
          continent: profile.continent,
          characters: profile.characters?.map((c: any) => {
            return {
              name: c.character,
              gameCount: c.gameCount,
            }
          })
        })
      })
    } catch (err) {
      console.error("Error fetching:", err);
    }
    return ranks;
  }
}

