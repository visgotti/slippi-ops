import { SlippiGame } from '@slippi/slippi-js';

import type { GameStartType, PlayerType, StatsType } from '@slippi/slippi-js';
import * as path from 'path';
import * as fs from "fs";
import { type RawSlippiData, type GameResults, GameType } from "@slippiops/types";
import { characterData } from "@slippiops/utils";

export function readFilesRecursively(directory: string, filePaths: string[] = []): string[] {
  const files = fs.readdirSync(directory);
  files.forEach((file) => {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      readFilesRecursively(fullPath, filePaths); // Recursively read the subdirectory
    } else {
      filePaths.push(fullPath); // Add the file path to the array
    }
  });
  return filePaths;
}

export function readFoldersRecursively(directory: string, skipFolderTimestamps: {[key: string]: number }, folderPaths: string[] = []): string[] {
  const d = skipFolderTimestamps[directory];
  const stats = fs.statSync(directory);
  if(!d || stats.mtimeMs > d) {
    folderPaths.push(directory);
  }
  const items = fs.readdirSync(directory);
  items.forEach((item) => {
    const fullPath = path.join(directory, item);
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      readFoldersRecursively(fullPath, skipFolderTimestamps, folderPaths); // Recursively read the subdirectory
    }
  });
  return folderPaths;
}

export function fsRead(f: string) : Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(f, 'utf-8', (err, data) => {
      if(err) {
        return reject(err);
      }
      return resolve(data as string);
    })
  });
}

const fileDebounceTimeouts: {[key: string]: NodeJS.Timeout } = {};
export function fsWriteAsynceDebounced(f: string, data: string, timeout = 5000) {
  clearTimeout(fileDebounceTimeouts[f]);
  fileDebounceTimeouts[f] = setTimeout(() => {
    fs.writeFileSync(f, data, 'utf-8');
    delete fileDebounceTimeouts[f];
  }, timeout);
}


export function ensureExists(f : string) {
  const dir = path.dirname(f);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(f)) {
    fs.writeFileSync(f, '', 'utf-8');
  }
}

export function readFiles(directory: string): string[] {
  const filePaths: string[] = [];
  const files = fs.readdirSync(directory);
  files.forEach((file) => {
    const fullPath = path.join(directory, file);
    filePaths.push(fullPath);
  });
  return filePaths;
}

export function transformResultsFromSlippi(raw: RawSlippiData, filePath: string) : GameResults  /*used to return PlayerGameResults */ {
  const { settings, lastFrame, metaData, winners, gameEnd } = raw;
  //but now
  const player1 = settings!.players[0];
  const player2 = settings!.players[1];

  // refactor rest of code to not use "opponent" and "your" prefixes as we just want the data and make it agnostic to the actuat codes that we are no longer passing in
  const gameNumber = settings?.matchInfo?.gameNumber || Math.round(-(Math.random() * 100000000));
  const matchId = settings?.matchInfo?.matchId || metaData?.startAt as string || `${Date.now()}`;


  const player1LastFrame = Object.values(lastFrame?.players || {}).find((p) => p?.post.playerIndex === player1?.playerIndex)?.post;
  const player2LastFrame = Object.values(lastFrame?.players || {}).find((p) => p?.post.playerIndex === player2?.playerIndex)?.post;

  const player1Setting = settings!.players.find(p => p.playerIndex === player1?.playerIndex) as PlayerType;
  const player2Setting = settings!.players.find(p => p.playerIndex === player2?.playerIndex) as PlayerType;

  const unranked = matchId.includes("unranked") || filePath.includes("unranked");
  const ranked = !unranked && (matchId.includes("ranked") || filePath.includes("ranked"));

  // since the game runs on a tick of 60 fps this should (i think) calculate the length of the match in milliseconds
  let matchLength = lastFrame?.frame ? Math.round(lastFrame.frame * 16.66667) : 0;
  if(!Number.isInteger(matchLength)) {
    matchLength = 0;
  }

  let player1CharacterColor = 0;
  let player2CharacterColor = 0;

  if(player1Setting && player1Setting?.characterColor !== undefined && player1Setting?.characterColor !== null && Number(player1Setting.characterColor) < characterData[player1Setting.characterId as number].colors.length) {
    player1CharacterColor = player1Setting.characterColor;
  }

  
  if(player2Setting && player2Setting?.characterColor !== undefined && player2Setting?.characterColor !== null && Number(player2Setting.characterColor) < characterData[player2Setting.characterId as number].colors.length) {
    player2CharacterColor = player2Setting.characterColor;
  }

  const data: GameResults = {
    raw,
    matchId,
    gameNumber,
    slpFilePath: filePath,
    slpFile: path.basename(filePath),
    startAt: metaData?.startAt ? `${new Date(metaData?.startAt || Date.now()).getTime()}` : `${Date.now()}`,
    stageId: settings!.stageId as number,
    type: ranked ? GameType.RANKED : unranked ? GameType.UNRANKED : GameType.DIRECT,
    matchLength,
    notes: [],
    player1Ranks: [],
    player2Ranks: [],

    player1Won: winners?.[0]?.playerIndex === player1.playerIndex,
    player2Won: winners?.[0]?.playerIndex === player2.playerIndex,

    player1UserId: player1Setting?.userId,
    player2UserId: player2Setting?.userId,

    player1Character: player1Setting?.characterId as number,
    player2Character: player2Setting?.characterId as number,

    player1Quit: !!gameEnd && (gameEnd.gameEndMethod === 7 && gameEnd.lrasInitiatorIndex === player1?.playerIndex),
    player2Quit: !!gameEnd && (gameEnd.gameEndMethod === 7 && gameEnd.lrasInitiatorIndex === player2?.playerIndex),

    player1CharacterColor,
    player2CharacterColor,

    player1Stocks: player1LastFrame?.stocksRemaining as number,
    player2Stocks: player2LastFrame?.stocksRemaining as number,

    player1Percent: player1LastFrame?.percent as number,
    player2Percent: player2LastFrame?.percent as number,

    player1Nickname: player1?.displayName,
    player2Nickname: player2?.displayName,

    player1Code: player1.connectCode,
    player2Code: player2.connectCode,

    player1ActiveElo: null,
    player1HighestElo: null,

    player2ActiveElo: null,
    player2HighestElo: null,
  };

  return data;
}

export function getResultFromSlippi(filePath: string, game?: SlippiGame) : { data?: any, error: string } | { data: { result: GameResults, stats?: StatsType | null } } {
  try {
    game = game || new SlippiGame(filePath, { processOnTheFly: false });

    const settings = game.getSettings() as GameStartType;

    if(settings?.players.length != 2) {
      return { error: "Game did not have 2 players"}
    }
    const gameEnd = game.getGameEnd();
    const winners = game.getWinners();
    const lastFrame = game.getLatestFrame();
    const metaData = game.getMetadata();
    let gameStats : null | StatsType = null;
    try {
      gameStats = game.getStats();
    } catch (err) {
      console.error("Error getting stats", err);
    }

    return { 
      data: { 
        result: transformResultsFromSlippi({ gameEnd, settings, metaData, lastFrame, winners }, filePath),
        stats: gameStats
      }
    }
  } catch (err: any) {
    console.error("Error:", err);
    return { error: err?.message || "unknown error"}
  }
}

export async function tryFindFolderContainingFileType(fileType: string, directory: string = __dirname): Promise<string | null> {
  // Helper function to get parent directory
  const getParentDirectory = (dir: string): string | null => {
      const parentDir = path.dirname(dir);
      return parentDir === dir ? null : parentDir;
  };

  // Helper function to check if a directory contains only files of the specified type
  const containsOnlySpecifiedFileType = (dir: string, fileType: string): boolean => {
      const files = fs.readdirSync(dir);
      if (files.length === 0) return false;
      return files.every(file => path.extname(file).toLowerCase() === fileType.toLowerCase());
  };

  // Recursively check current and parent directories
  let currentDir: string | null = directory;
  while (currentDir) {
      const files = fs.readdirSync(currentDir);

      // If the directory contains files and one of them is of the specified type
      if (files.some(file => path.extname(file).toLowerCase() === fileType.toLowerCase())) {
          // If all files are of the specified type, return the directory
          if (containsOnlySpecifiedFileType(currentDir, fileType)) {
              return currentDir;
          }
      }

      // Move to the parent directory
      currentDir = getParentDirectory(currentDir);
  }

  // If no directory with only the specified file type is found, return null
  return null;
}