import axios from "axios";
import { CharacterNote, GameResults, LiveCharacterNote, PlayerGameResults, PlayerRank, RankStrings, Results, UnprefixedResultData } from "@slippiops/types";
import { characterData, characterRanges, characterStockIconRects, stageIdsToNameLookup, ELO_THRESHOLDS } from "./melee_data";
import { capitalizeFirstLetter } from "./common";

function getCharacterStartingIndexIcon(characterName: string) : number{
  let index = 0;
  const normalizedCharacterName = characterName.replace(/[\s-_.]/g, "").toLowerCase();
  for (let i = 0; i < characterRanges.length; i++) {
    const { name, colors } = characterRanges[i];
    if (name === normalizedCharacterName || (name === "gameandwatch" && normalizedCharacterName === "mrgame&watch")) {
      return index;
    }
    index += colors;
  }
  throw new Error(`Cannot find normalized character name: ${normalizedCharacterName} for ${characterName}`);
}

function getCharacterStartingIndexIconIgnoreColor(characterName: string) : number {
  const normalizedCharacterName = characterName.replace(/[\s-_.]/g, "").toLowerCase();

  for (let i = 0; i < characterRanges.length; i++) {
    const { name } = characterRanges[i];
    if (name === normalizedCharacterName || (name === "gameandwatch" && normalizedCharacterName === "mrgame&watch")) {
      return i;
    }
  }
  throw new Error(`Cannot find normalized character name: ${normalizedCharacterName} for ${characterName}`);
}

export function getCellCoordinates(index: number, columns: number, columnWidth: number, rowHeight: number): { x: number, y: number } {
  const rowIndex = Math.floor(index / columns);
  const colIndex = index % columns;

  const x = colIndex * columnWidth;
  const y = rowIndex * rowHeight;
  return { x, y };
}

export function normalizeCharacterName(v: string) {
  return v.replace(/[\s-_.]/g, "").toLowerCase();
}

export function characterNamesAreTheSame(name1: string, name2: string) {
  const normalized1 = normalizeCharacterName(name1);
  const normalized2 = normalizeCharacterName(name2);
  return normalizedCharacterNamesAreTheSame(normalized1, normalized2);
}


export async function fetchUserProfile(code: string) {
  const query = {
    operationName: "AccountManagementPageQuery",
    variables: { cc: code, uid: code },
    query: `
      fragment profileFields on NetplayProfile {
        id
        ratingOrdinal
        ratingUpdateCount
        wins
        losses
        dailyGlobalPlacement
        dailyRegionalPlacement
        continent
        characters {
          id
          character
          gameCount
          __typename
        }
        __typename
      }
      
      fragment userProfilePage on User {
        fbUid
        displayName
        connectCode {
          code
          __typename
        }
        status
        activeSubscription {
          level
          hasGiftSub
          __typename
        }
        rankedNetplayProfile {
          ...profileFields
          __typename
        }
        netplayProfiles {
          ...profileFields
          season {
            id
            startedAt
            endedAt
            name
            status
            __typename
          }
          __typename
        }
        __typename
      }
      
      query AccountManagementPageQuery($cc: String!, $uid: String!) {
        getUser(fbUid: $uid) {
          ...userProfilePage
          __typename
        }
        getConnectCode(code: $cc) {
          user {
            ...userProfilePage
            __typename
          }
          __typename
        }
      }
    `
  };

  try {
    const response = await axios.post('https://gql-gateway-dot-slippi.uc.r.appspot.com/graphql', query, {
      headers: {
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'en-US,en;q=0.9',
        'Apollographql-Client-Name': 'slippi-web',
        'Cache-Control': 'no-cache',
        'Content-Length': JSON.stringify(query).length,
        'Content-Type': 'application/json',
        'Origin': 'https://slippi.gg',
        'Pragma': 'no-cache',
        'Priority': 'u=1, i',
        'Referer': 'https://slippi.gg/',
        'Sec-Ch-Ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

export function getRankIconFromElo(elo?: number, placement?: number | null): string {
  if (typeof elo === "undefined" || elo === null) return "none.svg";
  const isGm = placement && placement <= ELO_THRESHOLDS.PLACEMENT_THRESHOLD && elo >= ELO_THRESHOLDS.GRAND_MASTER_MIN;
  if (isGm) {
    return "grandmaster.svg";
  }
  if (elo >= ELO_THRESHOLDS.MASTER_3_MIN) return "master_3.svg";
  if (elo >= ELO_THRESHOLDS.MASTER_2_MIN) return "master_2.svg";
  if (elo >= ELO_THRESHOLDS.MASTER_1_MIN) return "master_1.svg";
  if (elo >= ELO_THRESHOLDS.DIAMOND_3_MIN) return "diamond_3.svg";
  if (elo >= ELO_THRESHOLDS.DIAMOND_2_MIN) return "diamond_2.svg";
  if (elo >= ELO_THRESHOLDS.DIAMOND_1_MIN) return "diamond_1.svg";
  if (elo >= ELO_THRESHOLDS.PLAT_3_MIN) return "plat_3.svg";
  if (elo >= ELO_THRESHOLDS.PLAT_2_MIN) return "plat_2.svg";
  if (elo >= ELO_THRESHOLDS.PLAT_1_MIN) return "plat_1.svg";
  if (elo >= ELO_THRESHOLDS.GOLD_3_MIN) return "gold_3.svg";
  if (elo >= ELO_THRESHOLDS.GOLD_2_MIN) return "gold_2.svg";
  if (elo >= ELO_THRESHOLDS.GOLD_1_MIN) return "gold_1.svg";
  if (elo >= ELO_THRESHOLDS.SILVER_3_MIN) return "silver_3.svg";
  if (elo >= ELO_THRESHOLDS.SILVER_2_MIN) return "silver_2.svg";
  if (elo >= ELO_THRESHOLDS.SILVER_1_MIN) return "silver_1.svg";
  if (elo >= ELO_THRESHOLDS.BRONZE_3_MIN) return "bronze_3.svg";
  if (elo >= ELO_THRESHOLDS.BRONZE_2_MIN) return "bronze_2.svg";
  return "bronze_1.svg";
}

export function getRankFromElo(elo: number, placement?: number | null): RankStrings {
  const isGm = placement && placement <= ELO_THRESHOLDS.PLACEMENT_THRESHOLD && elo >= ELO_THRESHOLDS.GRAND_MASTER_MIN;
  if (isGm) {
    return "Grand Master";
  }
  if (elo >= ELO_THRESHOLDS.MASTER_3_MIN) return "Master 3";
  if (elo >= ELO_THRESHOLDS.MASTER_2_MIN) return "Master 2";
  if (elo >= ELO_THRESHOLDS.MASTER_1_MIN) return "Master 1";
  if (elo >= ELO_THRESHOLDS.DIAMOND_3_MIN) return "Diamond 3";
  if (elo >= ELO_THRESHOLDS.DIAMOND_2_MIN) return "Diamond 2";
  if (elo >= ELO_THRESHOLDS.DIAMOND_1_MIN) return "Diamond 1";
  if (elo >= ELO_THRESHOLDS.PLAT_3_MIN) return "Plat 3";
  if (elo >= ELO_THRESHOLDS.PLAT_2_MIN) return "Plat 2";
  if (elo >= ELO_THRESHOLDS.PLAT_1_MIN) return "Plat 1";
  if (elo >= ELO_THRESHOLDS.GOLD_3_MIN) return "Gold 3";
  if (elo >= ELO_THRESHOLDS.GOLD_2_MIN) return "Gold 2";
  if (elo >= ELO_THRESHOLDS.GOLD_1_MIN) return "Gold 1";
  if (elo >= ELO_THRESHOLDS.SILVER_3_MIN) return "Silver 3";
  if (elo >= ELO_THRESHOLDS.SILVER_2_MIN) return "Silver 2";
  if (elo >= ELO_THRESHOLDS.SILVER_1_MIN) return "Silver 1";
  if (elo >= ELO_THRESHOLDS.BRONZE_3_MIN) return "Bronze 3";
  if (elo >= ELO_THRESHOLDS.BRONZE_2_MIN) return "Bronze 2";
  return "Bronze 1";
}

export function getEloRangeForRank(rank: string) {
  switch (rank) {
    case "Grand Master":
      return { min: ELO_THRESHOLDS.GRAND_MASTER_MIN, max: ELO_THRESHOLDS.MAX_ELO };
    case "Master 3":
      return { min: ELO_THRESHOLDS.MASTER_3_MIN, max: ELO_THRESHOLDS.MAX_ELO };
    case "Master 2":
      return { min: ELO_THRESHOLDS.MASTER_2_MIN, max: ELO_THRESHOLDS.MASTER_3_MIN - 1 };
    case "Master 1":
      return { min: ELO_THRESHOLDS.MASTER_1_MIN, max: ELO_THRESHOLDS.MASTER_2_MIN - 1 };
    case "Diamond 3":
      return { min: ELO_THRESHOLDS.DIAMOND_3_MIN, max: ELO_THRESHOLDS.MASTER_1_MIN - 1 };
    case "Diamond 2":
      return { min: ELO_THRESHOLDS.DIAMOND_2_MIN, max: ELO_THRESHOLDS.DIAMOND_3_MIN - 1 };
    case "Diamond 1":
      return { min: ELO_THRESHOLDS.DIAMOND_1_MIN, max: ELO_THRESHOLDS.DIAMOND_2_MIN - 1 };
    case "Plat 3":
      return { min: ELO_THRESHOLDS.PLAT_3_MIN, max: ELO_THRESHOLDS.DIAMOND_1_MIN - 1 };
    case "Plat 2":
      return { min: ELO_THRESHOLDS.PLAT_2_MIN, max: ELO_THRESHOLDS.PLAT_3_MIN - 1 };
    case "Plat 1":
      return { min: ELO_THRESHOLDS.PLAT_1_MIN, max: ELO_THRESHOLDS.PLAT_2_MIN - 1 };
    case "Gold 3":
      return { min: ELO_THRESHOLDS.GOLD_3_MIN, max: ELO_THRESHOLDS.PLAT_1_MIN - 1 };
    case "Gold 2":
      return { min: ELO_THRESHOLDS.GOLD_2_MIN, max: ELO_THRESHOLDS.GOLD_3_MIN - 1 };
    case "Gold 1":
      return { min: ELO_THRESHOLDS.GOLD_1_MIN, max: ELO_THRESHOLDS.GOLD_2_MIN - 1 };
    case "Silver 3":
      return { min: ELO_THRESHOLDS.SILVER_3_MIN, max: ELO_THRESHOLDS.GOLD_1_MIN - 1 };
    case "Silver 2":
      return { min: ELO_THRESHOLDS.SILVER_2_MIN, max: ELO_THRESHOLDS.SILVER_3_MIN - 1 };
    case "Silver 1":
      return { min: ELO_THRESHOLDS.SILVER_1_MIN, max: ELO_THRESHOLDS.SILVER_2_MIN - 1 };
    case "Bronze 3":
      return { min: ELO_THRESHOLDS.BRONZE_3_MIN, max: ELO_THRESHOLDS.SILVER_1_MIN - 1 };
    case "Bronze 2":
      return { min: ELO_THRESHOLDS.BRONZE_2_MIN, max: ELO_THRESHOLDS.BRONZE_3_MIN - 1 };
    case "Bronze 1":
      return { min: 0, max: ELO_THRESHOLDS.BRONZE_2_MIN - 1 };
    default:
      throw new Error(`Invalid rank: ${rank}`);
  }
}

export function formatCode(input: string) {
  // Use regex to separate letters and numbers
  const match = input.match(/^([a-zA-Z]+)[\s-_#]*([\d]+)$/);

  if (match) {
    // Extract the letter and number parts
    const letters = match[1].toUpperCase();
    const numbers = match[2];
    return `${letters}#${numbers}`;
  } else {
    throw new Error("Invalid format. The input should contain letters followed by numbers.");
  }
}


/**
 * Calculate the new Elo ratings for two players after a match.
 * @param {number} player1Rating - Current rating of player 1.
 * @param {number} player2Rating - Current rating of player 2.
 * @param {number} player1Result - Result of the match for player 1 (1 for win, 0.5 for draw, 0 for loss).
 * @param {number} kFactor - K-factor determines the maximum possible adjustment per game.
 * @returns {object} New ratings for both players.
 */
export function calculateElo(
  player1Rating: number,
  player2Rating: number,
  player1Result: number,
  kFactor = 32
): { player1NewRating: number; player2NewRating: number } {
  // Calculate the expected scores
  const expectedScore1: number = 1 / (1 + Math.pow(10, (player2Rating - player1Rating) / 400));
  const expectedScore2: number = 1 / (1 + Math.pow(10, (player1Rating - player2Rating) / 400));

  // Calculate the new ratings
  const player1NewRating: number = player1Rating + kFactor * (player1Result - expectedScore1);
  const player2NewRating: number = player2Rating + kFactor * ((1 - player1Result) - expectedScore2);

  return {
      player1NewRating: Math.max(300, Math.round(player1NewRating)),
      player2NewRating: Math.max(300, Math.round(player2NewRating))
  };
}

export function convertToPlayerPrefixedData(input: Partial<UnprefixedResultData>): Partial<Omit<GameResults, 'raw' | 'notes' | 'player1Ranks' | 'player2Ranks'>>[] {

   /*
  const result1: Partial<PlayerGameResults> = {};
   const result2: Partial<PlayerGameResults> = {};
  
   Object.keys(input).forEach((key) => {
     result1[`player1${capitalizeFirstLetter(key)}` as keyof PlayerGameResults] = (<any>input)[key];
     result2[`player2${capitalizeFirstLetter(key)}` as keyof PlayerGameResults] = (<any>input)[key];
   });
   */

   const result1: any = {};
   const result2: any = {};
  
   Object.keys(input).forEach((key) => {
    result1[`player1${capitalizeFirstLetter(key)}`] = (<any>input)[key];
    result2[`player2${capitalizeFirstLetter(key)}`] = (<any>input)[key];
  });
   return [result1, result2] as unknown as Partial<Omit<GameResults, 'raw' | 'notes' | 'player1Ranks' | 'player2Ranks'>>[];
}

export function getOpponentCode(game: GameResults, yourPlayerCodes: string[]) : string | null {
  return gameToPlayerResults(game, yourPlayerCodes)?.opponentCode || null;
}

export function gameToPlayerResults(game: GameResults, yourPlayerCodes: string[]): PlayerGameResults | null {
  const isPlayer1 = yourPlayerCodes.includes(game.player1Code);
  const isPlayer2 = yourPlayerCodes.includes(game.player2Code);

  if (!isPlayer1 && !isPlayer2) {
    return null;
  }

  const {
    id,
    statsId,
    raw,
    matchId,
    gameNumber,
    slpFile,
    slpFilePath,
    startAt, 
    stageId,
    type,
    notes,
    matchLength,
  } = game;

  const result : Results = {
    id,
    statsId,
    raw,
    matchId,
    gameNumber,
    slpFile,
    slpFilePath,
    startAt, 
    stageId,
    type,
    notes,
    matchLength
  }

  if (isPlayer1) {
    return {
      ...result,
      stageName: stageIdsToNameLookup[result.stageId],
      yourPlayerIndex: 0,
      opponentPlayerIndex: 1,

      opponentRanks: game.player2Ranks,
      yourRanks: game.player1Ranks,
      
      youWon: game.player1Won,
      opponentWon: game.player2Won,
      
      youQuit: game.player1Quit,
      opponentQuit: game.player2Quit,
      
      yourUserId: game.player1UserId,
      opponentUserId: game.player2UserId,
      
      yourCharacter: game.player1Character,
      opponentCharacter: game.player2Character,
      
      yourCharacterName: characterData[game.player1Character]?.name,
      opponentCharacterName: characterData[game.player2Character]?.name,
      
      yourCharacterColor: game.player1CharacterColor,
      opponentCharacterColor: game.player2CharacterColor,
      
      yourCharacterColorName: characterData[game.player1Character]?.colors[game.player1CharacterColor],
      opponentCharacterColorName: characterData[game.player2Character]?.colors[game.player2CharacterColor],
      
      yourStocks: game.player1Stocks,
      opponentStocks: game.player2Stocks,
      
      yourPercent: game.player1Percent,
      opponentPercent: game.player2Percent,
      
      yourNickname: game.player1Nickname,
      opponentNickname: game.player2Nickname,
      
      yourCode: game.player1Code,
      opponentCode: game.player2Code,
      
      yourActiveElo: game.player1ActiveElo,
      opponentActiveElo: game.player2ActiveElo,
      
      yourHighestElo: game.player1HighestElo,
      opponentHighestElo: game.player2HighestElo,
    };
  }

  if (isPlayer2) {
    return {
      ...result,
      stageName: stageIdsToNameLookup[result.stageId],
      yourPlayerIndex: 1,
      opponentPlayerIndex: 0,

      opponentRanks: game.player1Ranks,
      yourRanks: game.player2Ranks,
      
      youWon: game.player2Won,
      opponentWon: game.player1Won,
      
      youQuit: game.player2Quit,
      opponentQuit: game.player1Quit,
      
      yourUserId: game.player2UserId,
      opponentUserId: game.player1UserId,
      
      yourCharacter: game.player2Character,
      opponentCharacter: game.player1Character,
      
      yourCharacterName: characterData[game.player2Character]?.name,
      opponentCharacterName: characterData[game.player1Character]?.name,
      
      yourCharacterColor: game.player2CharacterColor,
      opponentCharacterColor: game.player1CharacterColor,
      
      yourCharacterColorName: characterData[game.player2Character]?.colors[game.player2CharacterColor],
      opponentCharacterColorName: characterData[game.player1Character]?.colors[game.player1CharacterColor],
    
      yourStocks: game.player2Stocks,
      opponentStocks: game.player1Stocks,
      
      yourPercent: game.player2Percent,
      opponentPercent: game.player1Percent,
      
      yourNickname: game.player2Nickname,
      opponentNickname: game.player1Nickname,
      
      yourCode: game.player2Code,
      opponentCode: game.player1Code,
      
      yourActiveElo: game.player2ActiveElo,
      opponentActiveElo: game.player1ActiveElo,
      
      yourHighestElo: game.player2HighestElo,
      opponentHighestElo: game.player1HighestElo,
    };
  }

  return null;
}

export function normalizedCharacterNamesAreTheSame(normalized1: string, normalized2: string) {
  return normalized1 === normalized2 || (normalized1 === "gameandwatch" && normalized2 === "mrgame&watch" || normalized1 === "mrgame&watch" && normalized2 === "gameandwatch")
}
export const hasValidRank = (r?: PlayerRank) => {
  if(!r) return false;
  return r && (r.wins !== null || r.losses !== null && (r.losses != 0 || r.wins != 0)) // not sure if these turn to 0 when one is not null.
}

export const getMostPlayedCharacterAndPercentFromRank = (rank: PlayerRank) => {
  const characters = rank.characters;
  if(characters.length === 0) return null;
  let mostPlayedCharacter = characters[0];
  for(let i = 1; i < characters.length; i++) {
    if(characters[i].gameCount > mostPlayedCharacter.gameCount) {
      mostPlayedCharacter = characters[i];
    }
  }
  return { character: mostPlayedCharacter.name, percentage: getCharacterPercentage(mostPlayedCharacter, rank) };
}

export const getCharacterPercentage = (character: PlayerRank['characters'][0], rank: PlayerRank) => {
  const totalGames = rank.characters.reduce((sum: number, char: any) => sum + char.gameCount, 0);
  return parseFloat(Math.round((character.gameCount / totalGames) * 100).toFixed(2));
};

export function getCharacterStockIconRect(characterName: string, characterColor: string | number) {
  const idx = getCharacterStartingIndexIcon(characterName);
  const a = characterStockIconRects[idx + parseInt(`${characterColor}`)];
  return { x: a[0], y: a[1], w: a[2], h: a[3] }
}

export function getCharacterStatImageRect(characterName: string) {
  const idx = getCharacterStartingIndexIconIgnoreColor(characterName);
  const { x, y } = getCellCoordinates(idx, 9, 69, 36);
  return { x, y, w: 63, h: 31 }
}

export function getCharacterName(chacterCode: number) {
  if(chacterCode < 0 || chacterCode > 25) {
    throw new Error(`Invalid character code: ${chacterCode} should be between 0 and 25`);
  }
  return characterData[chacterCode].name;
}

export function getCharacterColorName(chacterCode: number, colorCode: number) : string {
  if(chacterCode < 0 || chacterCode > 25) {
    throw new Error(`Invalid character code: ${chacterCode} should be between 0 and 25`);
  }
  return characterData[chacterCode].colors[colorCode];
}

export function getCharacterSelectSpriteRect(characterName: string, outfitIndex: number): { x: number, y: number, w: number, h: number } {
  const spriteWidth = 136;
  const spriteHeight = 188;
  const buffer = 1;

  // Normalize the character name
  const normalizedCharacterName = characterName.replace(/[\s-_.]/g, "").toLowerCase();

  if (normalizedCharacterName === "sheik") {
    // Special case for Sheik
    const x = (outfitIndex + 6) * (spriteWidth + buffer) + buffer;
    const y = 4 * (spriteHeight + buffer) + buffer;
    return { x, y, w: spriteWidth, h: spriteHeight };
  }

  let yIndex = 0;
  let columnOffset = 0;

  for (const { name } of characterRanges) {
    if (name === "sheik") {
      continue;
    }

    // After mewtwo, reset yIndex and adjust column offset
    if (name === "mewtwo") {
      yIndex = 0;
      columnOffset = 6; // Move to the 7th column
    }

    if (name === normalizedCharacterName || (name === "gameandwatch" && normalizedCharacterName === "mrgame&watch")) {
      const x = (outfitIndex + columnOffset) * (spriteWidth + buffer) + buffer;
      const y = yIndex * (spriteHeight + buffer) + buffer;
      return { x, y, w: spriteWidth, h: spriteHeight };
    }

    yIndex++;
  }

  throw new Error(`Cannot resolve for character ${characterName}`);
}


export const resolveConditionType = (percentStart?: number | null, percentEnd?: number | null) : '' | 'between' | 'greater' | 'less' => {
  if(percentStart !== null && percentStart !== undefined) {
    if(percentEnd !== null && percentEnd !== undefined) {
      return 'between';
    } else {
      return 'greater';
    }
  } else if(percentEnd !== null && percentEnd !== undefined) {
    return 'less';
  }
  return '';
}

export const formatLiveCharacterNote = (v: CharacterNote) : LiveCharacterNote => {
  const opponentPercentConditionType = resolveConditionType(v.opponentPercentStart, v.opponentPercentEnd);
  const yourPercentConditionType = resolveConditionType(v.yourPercentStart, v.yourPercentEnd);
  return {
    ...v,
    opponentPercentConditionType,
    yourPercentConditionType,
  }
  
}