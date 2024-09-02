import type { ColumnDefLookup } from "@slippiops/sqllite";



export const columnDefs : ColumnDefLookup = {
  'invalid_results': [
    { name: "id", type: "INTEGER", primary: true },
    { name: "slpFilePath", type: "TEXT", unique: true, index: true },
    { name: "error", type: "TEXT" },
    { name: "data", type: "TEXT" },
  ],
  'players': [
    { name: "id", type: "TEXT", index: true, primary: true },
    { name: "fetchedRanksAt", type: "TEXT" }
  ],
  'chats': [
    { name: "id", type: "INTEGER", primary: true },
    { name: "opponentUserId", type: "TEXT" },
  ],
  'chat_messages': [
    { name: "id", type: "INTEGER", primary: true }, 
    { name: "chatId", type: "INTEGER", references: { table: "chats", column: "id" }, index: true },
    { name: "playerId", type: "INTEGER" },  
    { name: "nickname", type: "TEXT" },
    { name: 'resultId', type: "INTEGER", references: { table: "results", column: "id"} },
    { name: "content", type: "TEXT" }, 
    { name: "sentAt", type: "TEXT" },  
  ],
  'character_notes': [
    { name: "id", type: "INTEGER", primary: true },
    { name: "characterId", type: "INTEGER" },
    { name: "yourCharacterIds", type: "ARRAY" },
    { name: "content", type: "TEXT" },
    { name: "stageIds", type: "ARRAY" },
    { name: "opponentPercentStart", type: "INTEGER" },
    { name: "opponentPercentEnd", type: "INTEGER" },
    { name: "yourPercentStart", type: "INTEGER" },
    { name: "yourPercentEnd", type: "INTEGER" },
  ],
  'player_notes': [
    { name: "id", type: "INTEGER", primary: true },
    { name: "userId", type: "TEXT", index: true },
    { name: "content", type: "TEXT" },
  ],
  'ranks': [
    { name: "id", type: "INTEGER", primary: true },
    { name: "updatedAt", type: "TEXT", index: true },
    { name: "elo", type: "INTEGER" },
    { name: "wasActiveSeason", type: "BOOLEAN" },
    { name: "seasonId", type: "TEXT", index: true },
    { name: "userId", type: "TEXT", index: true },
    { name: "wins", type: "INTEGER" },
    { name: "losses", type: "INTEGER" },
    { name: "regionalPlacement", type: "INTEGER" },
    { name: "globalPlacement", type: "INTEGER" },
    { name: 'characters', type: 'ARRAY'},
    { name: 'seasonDateStart', type: 'TEXT'},
    { name: 'seasonDateEnd', type: 'TEXT'},
    { name: 'seasonName', type: 'TEXT'},
    { name: 'continent', type: 'TEXT'},
  ],
  'seasons': [
    { name: "id", type: "INTEGER", primary: true },
    { name: "slippiId", type: "TEXT", unique: true },
    { name: "startedAt", type: "TEXT", unique: true },
    { name: "endedAt", type: "TEXT" },
    { name: "name", type: "TEXT", unique: true },
  ],
  'stats': [
    { name: "id", type: "INTEGER", primary: true },
    { name: "startAt", type: "TEXT", unique: true },
    { name: "stats", type: "OBJECT" },
  ],
  'results': [
    { name: "id", type: "INTEGER", primary: true },
    { name: "statsId", type: "INTEGER", references: { table: "stats", column: "id" } },
    { name: "raw", type: "OBJECT" },
    { name: "notes", type: "ARRAY" },
    { name: "matchId", type: "TEXT", index: true },
    { name: "gameNumber", type: "INTEGER" },
    { name: "type", type: "INTEGER", index: true },
    { name: "slpFile", type: "TEXT", unique: true, index: true },
    { name: "slpFilePath", type: "TEXT" },
    { name: "startAt", type: "TEXT", index: true },
    { name: "stageId", type: "INTEGER", index: true },
    { name: "matchLength", type: "INTEGER" },

    { name: "player1Won", type: "BOOLEAN" },
    { name: "player2Won", type: "BOOLEAN" },

    { name: "player1Quit", type: "BOOLEAN" },
    { name: "player2Quit", type: "BOOLEAN" },

    { name: "player1UserId", type: "TEXT", index: true },
    { name: "player2UserId", type: "TEXT", index: true },
    
    { name: "player1Character", type: "INTEGER", index: true },
    { name: "player2Character", type: "INTEGER", index: true },

    { name: "player1CharacterColor", type: "INTEGER" },
    { name: "player2CharacterColor", type: "INTEGER" },

    { name: "player1Stocks", type: "INTEGER", index: true },
    { name: "player2Stocks", type: "INTEGER", index: true },

    { name: "player1Percent", type: "INTEGER" },
    { name: "player2Percent", type: "INTEGER" },

    { name: "player1Ranks", type: "ARRAY" },
    { name: "player2Ranks", type: "ARRAY" },

    { name: "player1Nickname", type: "TEXT", index: true },
    { name: "player2Nickname", type: "TEXT", index: true },

    { name: "player1Code", type: "TEXT", index: true },
    { name: "player2Code", type: "TEXT", index: true },

    { name: "player1ActiveElo", type: "INTEGER" },
    { name: "player2ActiveElo", type: "INTEGER" },

    { name: "player1HighestElo", type: "INTEGER" },
    { name: "player2HighestElo", type: "INTEGER" },
  ]
}



const DONT_SELECT_KEYS = ['raw']
const selectableKeys = columnDefs['results'].map(c => c.name).filter(k => !DONT_SELECT_KEYS.includes(k));
export const SELECT_RESULT_VAR_STRING = selectableKeys.join(', ');