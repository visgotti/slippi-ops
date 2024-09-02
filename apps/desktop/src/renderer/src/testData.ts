import { GameResults, GameType, RankStrings } from "@slippiops/types";
import { ELO_THRESHOLDS } from "@slippiops/utils";

const opponentRanks = [
  {
    seasonDateStart: '2024-01-01',
    seasonDateEnd: '2024-12-31',
    seasonId: 'season2024',
    wins: 10,
    losses: 5,
    seasonName: '2024 Season',
    continent: 'North America',
    elo: 1600,
    wasActiveSeason: true,
    characters: [
      { name: 'FOX', gameCount: 75 },
      { name: 'FALCO', gameCount: 234 }
    ]
  },
  {
    seasonDateStart: '2023-01-01',
    seasonDateEnd: '2023-12-31',
    seasonId: 'season2023',
    wins: 65,
    losses: 55,
    seasonName: '2023 Season',
    continent: 'North America',
    elo: 1400,
    wasActiveSeason: false,
    characters: [
      { name: 'FOX', gameCount: 111 },
      { name: 'FALCO', gameCount: 9225 }
    ]
  },
  {
    seasonDateStart: '2022-01-01',
    seasonDateEnd: '2022-12-31',
    seasonId: 'season2022',
    wins: 65,
    losses: 55,
    seasonName: '2022 Season',
    continent: 'North America',
    elo: 1100,
    wasActiveSeason: false,
    characters: [
      { name: 'FOX', gameCount: 21 },
      { name: 'FALCO', gameCount: 225 }
    ]
  },
  {
    seasonDateStart: '2021-01-01',
    seasonDateEnd: '2021-12-31',
    seasonId: 'season2021',
    wins: 65,
    losses: 55,
    seasonName: '2021 Season',
    continent: 'North America',
    elo: 1150,
    wasActiveSeason: false,
    characters: [
      { name: 'FOX', gameCount: 33 },
      { name: 'FALCO', gameCount: 525 }
    ]
  }
];

const mockMatch = {
  notes: [
    { content: 'presses down b lot', createdAt: Date.now() },
    { content: 'presses down b lot', createdAt: Date.now() },
    { content: 'presses down b lot', createdAt: Date.now() },
    { content: 'presses down b lot', createdAt: Date.now() },
    { content: 'presses b a lot', createdAt: Date.now() }
  ],
  opponentRanks,
  yourCharacterColor: 0,
  yourCharacterName: "Marth",
  yourCharacter: 9,
  stageName: "Pokémon Stadium",
  opponentCharacterColor: 0,
  opponentCharacterName: "Falco",
  opponentCharacter: 9,
  stageId: 3,
  matchId: "mode.unranked-2024-06-08T01:25:19.82-3",
  slpFile: "C:\\Users\\user\\OneDrive\\Documents\\Slippi\\2024-06\\Game_20240607T212524.slp",
  youQuit: false,
  opponentQuit: false,
  startAt: "2024-06-08T01:25:24Z",
  youWon: false,
  opponentWon: false,
  opponentPercent: 84.8699951171875,
  opponentStocks: 0,
  opponentNickname: "unranked_falco",
  opponentCode: "THEM#696",
  yourCode: "YOU#420",
  yourPercent: 87.6500015258789,
  yourStocks: 1,
  yourNickname: "cornholio"
};
const mockHistory = [
  {
    opponentRanks,
    yourCharacterColor: 0,
    yourCharacterName: "Marth",
    yourCharacter: 9,
    stageName: "Pokémon Stadium",
    opponentCharacterColor: 1,
    opponentCharacterName: "Marth",
    opponentCharacter: 9,
    stageId: 3,
    matchId: "mode.unranked-2024-06-08T01:29:39.83-5",
    slpFilePath: "C:\\Users\\user\\OneDrive\\Documents\\Slippi\\2024-06\\Game_20240607T212944.slp",
    slpFile: "Game_20240607T212944.slp",
    youQuit: false,
    opponentQuit: false,
    startAt: "2024-06-08T01:29:44Z",
    youWon: true,
    opponentWon: false,
    opponentPercent: 168.95999145507812,
    opponentStocks: 0,
    opponentNickname: "@@@@@@@@@@@@@@@",
    opponentCode: "THEM#696",
    yourCode: "YOU#420",
    yourPercent: 125.98999786376953,
    yourStocks: 2,
    yourNickname: "@@@@@@@@@@@@@@@"
  },
  {
    opponentRanks,
    yourCharacterColor: 0,
    yourCharacterName: "Marth",
    yourCharacter: 9,
    stageName: "Battlefield",
    opponentCharacterColor: 1,
    opponentCharacterName: "Falco",
    opponentCharacter: 9,
    stageId: 31,
    matchId: "mode.unranked-2024-06-08T01:33:34.82-2",
    slpFilePath: "C:\\Users\\user\\OneDrive\\Documents\\Slippi\\2024-06\\Game_20240607T213339.slp",
    slpFile: "Game_20240607T213339.slp",
    youQuit: true,
    opponentQuit: false,
    startAt: "2024-06-08T01:33:39Z",
    youWon: false,
    opponentWon: true,
    opponentPercent: 160,
    opponentStocks: 3,
    opponentNickname: "unranked_falco",
    opponentCode: "THEM#696",
    yourCode: "YOU#420",
    yourPercent: 0,
    yourStocks: 1,
    yourNickname: "cornholio"
  },
  {
    opponentRanks,
    yourCharacterColor: 0,
    yourCharacterName: "Marth",
    yourCharacter: 9,
    stageName: "Dream Land N64",
    opponentCharacterColor: 2,
    opponentCharacterName: "Falco",
    opponentCharacter: 9,
    stageId: 28,
    matchId: "mode.unranked-2024-06-08T01:36:19.82-0",
    slpFilePath: "C:\\Users\\user\\OneDrive\\Documents\\Slippi\\2024-06\\Game_20240607T213624.slp",
    slpFile: "Game_20240607T213624.slp",
    youQuit: true,
    opponentQuit: false,
    startAt: "2024-06-08T01:36:24Z",
    youWon: false,
    opponentWon: true,
    opponentPercent: 0,
    opponentStocks: 4,
    opponentNickname: "unranked_falco",
    opponentCode: "THEM#696",
    yourCode: "YOU#420",
    yourPercent: 0,
    yourStocks: 4,
    yourNickname: "cornholio"
  },
  {
    opponentRanks,
    yourCharacterColor: 0,
    yourCharacterName: "Marth",
    yourCharacter: 9,
    stageName: "Final Destination",
    opponentCharacterColor: 3,
    opponentCharacterName: "Falco",
    opponentCharacter: 9,
    stageId: 32,
    matchId: "mode.unranked-2024-06-08T01:36:29.82-0",
    slpFilePath: "C:\\Users\\user\\OneDrive\\Documents\\Slippi\\2024-06\\Game_20240607T213635.slp",
    slpFile: "Game_20240607T213635.slp",
    youQuit: false,
    opponentQuit: false,
    startAt: "2024-06-08T01:36:35Z",
    youWon: true,
    opponentWon: false,
    opponentPercent: 84.09000396728516,
    opponentStocks: 0,
    opponentNickname: "unranked_falco",
    opponentCode: "THEM#696",
    yourCode: "YOU#420",
    yourPercent: 100.37000274658203,
    yourStocks: 2,
    yourNickname: "cornholio"
  },
  {
    opponentRanks,
    yourCharacterColor: 0,
    yourCharacterName: "Marth",
    yourCharacter: 9,
    stageName: "Final Destination",
    opponentCharacterColor: 0,
    opponentCharacterName: "Falco",
    opponentCharacter: 9,
    stageId: 32,
    matchId: "mode.unranked-2024-06-08T01:41:14.82-1",
    slpFilePath: "C:\\Users\\user\\OneDrive\\Documents\\Slippi\\2024-06\\Game_20240607T214119.slp",
    slpFile: "Game_20240607T214119.slp",
    youQuit: false,
    opponentQuit: false,
    startAt: "2024-06-08T01:41:19Z",
    youWon: true,
    opponentWon: false,
    opponentPercent: 60.11000061035156,
    opponentStocks: 0,
    opponentNickname: "unranked_falco",
    opponentCode: "THEM#696",
    yourCode: "YOU#420",
    yourPercent: 12,
    yourStocks: 2,
    yourNickname: "cornholio"
  },
  {
    opponentRanks,
    yourCharacterColor: 0,
    yourCharacterName: "Marth",
    yourCharacter: 9,
    stageName: "Fountain of Dreams",
    opponentCharacterColor: 0,
    opponentCharacterName: "Falco",
    opponentCharacter: 9,
    stageId: 2,
    matchId: "mode.unranked-2024-06-08T01:44:14.82-1",
    slpFilePath: "C:\\Users\\user\\OneDrive\\Documents\\Slippi\\2024-06\\Game_20240607T214419.slp",
    slpFile: "Game_20240607T214419.slp",
    youQuit: false,
    opponentQuit: false,
    startAt: "2024-06-08T01:44:19Z",
    youWon: true,
    opponentWon: false,
    opponentPercent: 126.08000946044922,
    opponentStocks: 0,
    opponentNickname: "unranked_falco",
    opponentCode: "THEM#696",
    yourCode: "YOU#420",
    yourPercent: 37.0099983215332,
    yourStocks: 1,
    yourNickname: "cornholio"
  }
];

const ranks = [
  {
    id: 1,
    updatedAt: "2023-07-01T12:00:00Z",
    elo: 1500,
    wasActiveSeason: true,
    seasonId: "season1",
    userId: "user123",
    wins: 10,
    losses: 5,
    regionalPlacement: 1,
    globalPlacement: 10
  },
  {
    id: 2,
    updatedAt: "2023-07-02T12:00:00Z",
    elo: 1400,
    wasActiveSeason: false,
    seasonId: "season2",
    userId: "user456",
    wins: 8,
    losses: 7,
    regionalPlacement: 2,
    globalPlacement: 20
  }
];

const seasons = [
  {
    id: 1,
    slippiId: "slippi1",
    startedAt: "2023-01-01T00:00:00Z",
    endedAt: "2023-06-30T23:59:59Z",
    name: "Season 1"
  },
  {
    id: 2,
    slippiId: "slippi2",
    startedAt: "2023-07-01T00:00:00Z",
    endedAt: "2023-12-31T23:59:59Z",
    name: "Season 2"
  }
];

const stats = [
  {
    id: 1,
    startAt: "2023-07-01T12:00:00Z",
    stats: {
      totalGames: 100,
      wins: 60,
      losses: 40
    }
  },
  {
    id: 2,
    startAt: "2023-07-02T12:00:00Z",
    stats: {
      totalGames: 80,
      wins: 50,
      losses: 30
    }
  }
];
const makeRandomEloFromRank: (rank: RankStrings) => number = (rank) => {
  switch (rank) {
    case "Grand Master":
      return Math.floor(Math.random() * (ELO_THRESHOLDS.MAX_ELO - ELO_THRESHOLDS.GRAND_MASTER_MIN + 1)) + ELO_THRESHOLDS.GRAND_MASTER_MIN;
    case "Master 3":
      return Math.floor(Math.random() * (ELO_THRESHOLDS.MASTER_3_MIN - ELO_THRESHOLDS.GRAND_MASTER_MIN)) + ELO_THRESHOLDS.GRAND_MASTER_MIN;
    case "Master 2":
      return Math.floor(Math.random() * (ELO_THRESHOLDS.MASTER_2_MIN - ELO_THRESHOLDS.MASTER_3_MIN)) + ELO_THRESHOLDS.MASTER_3_MIN;
    case "Master 1":
      return Math.floor(Math.random() * (ELO_THRESHOLDS.MASTER_1_MIN - ELO_THRESHOLDS.MASTER_2_MIN)) + ELO_THRESHOLDS.MASTER_2_MIN;
    case "Diamond 3":
      return Math.floor(Math.random() * (ELO_THRESHOLDS.DIAMOND_3_MIN - ELO_THRESHOLDS.MASTER_1_MIN)) + ELO_THRESHOLDS.MASTER_1_MIN;
    case "Diamond 2":
      return Math.floor(Math.random() * (ELO_THRESHOLDS.DIAMOND_2_MIN - ELO_THRESHOLDS.DIAMOND_3_MIN)) + ELO_THRESHOLDS.DIAMOND_3_MIN;
    case "Diamond 1":
      return Math.floor(Math.random() * (ELO_THRESHOLDS.DIAMOND_1_MIN - ELO_THRESHOLDS.DIAMOND_2_MIN)) + ELO_THRESHOLDS.DIAMOND_2_MIN;
    case "Plat 3":
      return Math.floor(Math.random() * (ELO_THRESHOLDS.PLAT_3_MIN - ELO_THRESHOLDS.DIAMOND_1_MIN)) + ELO_THRESHOLDS.DIAMOND_1_MIN;
    case "Plat 2":
      return Math.floor(Math.random() * (ELO_THRESHOLDS.PLAT_2_MIN - ELO_THRESHOLDS.PLAT_3_MIN)) + ELO_THRESHOLDS.PLAT_3_MIN;
    case "Plat 1":
      return Math.floor(Math.random() * (ELO_THRESHOLDS.PLAT_1_MIN - ELO_THRESHOLDS.PLAT_2_MIN)) + ELO_THRESHOLDS.PLAT_2_MIN;
    case "Gold 3":
      return Math.floor(Math.random() * (ELO_THRESHOLDS.GOLD_3_MIN - ELO_THRESHOLDS.PLAT_1_MIN)) + ELO_THRESHOLDS.PLAT_1_MIN;
    case "Gold 2":
      return Math.floor(Math.random() * (ELO_THRESHOLDS.GOLD_2_MIN - ELO_THRESHOLDS.GOLD_3_MIN)) + ELO_THRESHOLDS.GOLD_3_MIN;
    case "Gold 1":
      return Math.floor(Math.random() * (ELO_THRESHOLDS.GOLD_1_MIN - ELO_THRESHOLDS.GOLD_2_MIN)) + ELO_THRESHOLDS.GOLD_2_MIN;
    case "Silver 3":
      return Math.floor(Math.random() * (ELO_THRESHOLDS.SILVER_3_MIN - ELO_THRESHOLDS.GOLD_1_MIN)) + ELO_THRESHOLDS.GOLD_1_MIN;
    case "Silver 2":
      return Math.floor(Math.random() * (ELO_THRESHOLDS.SILVER_2_MIN - ELO_THRESHOLDS.SILVER_3_MIN)) + ELO_THRESHOLDS.SILVER_3_MIN;
    case "Silver 1":
      return Math.floor(Math.random() * (ELO_THRESHOLDS.SILVER_1_MIN - ELO_THRESHOLDS.SILVER_2_MIN)) + ELO_THRESHOLDS.SILVER_2_MIN;
    case "Bronze 3":
      return Math.floor(Math.random() * (ELO_THRESHOLDS.BRONZE_3_MIN - ELO_THRESHOLDS.SILVER_1_MIN)) + ELO_THRESHOLDS.SILVER_1_MIN;
    case "Bronze 2":
      return Math.floor(Math.random() * (ELO_THRESHOLDS.BRONZE_2_MIN - ELO_THRESHOLDS.BRONZE_3_MIN)) + ELO_THRESHOLDS.BRONZE_3_MIN;
    case "Bronze 1":
      return Math.floor(Math.random() * (ELO_THRESHOLDS.BRONZE_1_MIN - 0 + 1));
    default:
      throw new Error(`Invalid rank: ${rank}`);
  }
};
const mockPlayerCode = "PLAY#0";

const mockPlayerAlternateCode = "YOU#0";


const mockOpponent1Code = "OPP#1";
const mockOpponent2Code = "OPP#2";

const mockResults : Array<GameResults> = [
  {
    raw: { 
      settings: null,
      metaData: null,
      winners: null,
      gameEnd: null,
      lastFrame: null,
    },
    notes: [],
    matchId: "direct-match1",
    gameNumber: 1,
    type: GameType.DIRECT,
    slpFile: "file1.slp",
    slpFilePath: "file1.slp",
    startAt: "2023-07-01T12:00:04Z",
    stageId: 31, // Battlefield
    matchLength: 300,
    player1Won: true,
    player2Won: false,
    player1Quit: false,
    player2Quit: false,
    player1UserId: "player",
    player2UserId: "opponent2",
    player1Character: 9, // Marth
    player2Character: 7, // Luigi
    player1CharacterColor: 1,
    player2CharacterColor: 2,
    player1Stocks: 3,
    player2Stocks: 1,
    player1Percent: 120,
    player2Percent: 80,
    player1Ranks: [],
    player2Ranks: [],
    player1Nickname: "Your Nickname",
    player2Nickname: "Opponent Nickname",
    player1Code: mockPlayerCode,
    player2Code: mockOpponent1Code,
    player1ActiveElo: makeRandomEloFromRank("Bronze 1"),
    player2ActiveElo: makeRandomEloFromRank("Bronze 1"),
    player1HighestElo: 1600,
    player2HighestElo: 1500
  },
  {
    raw: { 
      settings: null,
      metaData: null,
      winners: null,
      gameEnd: null,
      lastFrame: null,
    },
    notes: [],
    matchId: "ranked_match2",
    gameNumber: 1,
    type: GameType.RANKED,
    slpFile: "file2.slp",
    slpFilePath: "file2.slp",
    startAt: "2023-07-02T12:00:03Z",
    stageId: 32, // FD
    matchLength: 250,
    player1Won: true,
    player2Won: false,
    player1Quit: false,
    player2Quit: false,
    player1UserId: "user456",
    player2UserId: "player",
    player1Character: 2, // Fox
    player2Character: 12, // Peach
    player1CharacterColor: 3,
    player2CharacterColor: 4,
    player1Stocks: 2,
    player2Stocks: 2,
    player1Percent: 90,
    player2Percent: 100,
    player1Ranks: [],
    player2Ranks: [],
    player1Nickname: "Enemy Nickname",
    player2Nickname: "Your Nickname",
    player1Code: mockOpponent2Code,
    player2Code: mockPlayerCode,
    player1ActiveElo: makeRandomEloFromRank("Bronze 2"),
    player2ActiveElo: makeRandomEloFromRank("Bronze 2"),
    player1HighestElo: 1500,
    player2HighestElo: 1600
  },
  {
    raw: { 
      settings: null,
      metaData: null,
      winners: null,
      gameEnd: null,
      lastFrame: null,
    },
    notes: [],
    matchId: "direct_match2",
    gameNumber: 1,
    type: GameType.UNRANKED,
    slpFile: "file3.slp",
    slpFilePath: "file3.slp",
    startAt: "2023-07-02T12:00:02Z",
    stageId: 32, // FD
    matchLength: 250,
    player1Won: false,
    player2Won: true,
    player1Quit: false,
    player2Quit: true,
    player1UserId: "user456",
    player2UserId: "player",
    player1Character: 2, // Fox
    player2Character: 9, // Marth
    player1CharacterColor: 3,
    player2CharacterColor: 4,
    player1Stocks: 2,
    player2Stocks: 2,
    player1Percent: 90,
    player2Percent: 100,
    player1Ranks: [],
    player2Ranks: [],
    player1Nickname: "TESTOTHERNICKNAME",
    player2Nickname: "Player Nickname",
    player1Code: mockOpponent2Code,
    player2Code: mockPlayerCode,
    player1ActiveElo: makeRandomEloFromRank("Bronze 3"),
    player2ActiveElo: makeRandomEloFromRank("Bronze 3"),
    player1HighestElo: 1500,
    player2HighestElo: 1600
  },
  {
    raw: { 
      settings: null,
      metaData: null,
      winners: null,
      gameEnd: null,
      lastFrame: null,
    },
    notes: [],
    matchId: "unranked_match3",
    gameNumber: 1,
    type: GameType.UNRANKED,
    slpFile: "file4.slp",
    slpFilePath: "file4.slp",
    startAt: "2023-07-02T12:00:01Z",
    stageId: 32, // FD
    matchLength: 250,
    player1Won: false,
    player2Won: true,
    player1Quit: false,
    player2Quit: true,
    player1UserId: "user456",
    player2UserId: "player",
    player1Character: 2,
    player2Character: 9,
    player1CharacterColor: 3,
    player2CharacterColor: 4,
    player1Stocks: 2,
    player2Stocks: 2,
    player1Percent: 90,
    player2Percent: 100,
    player1Ranks: [],
    player2Ranks: [],
    player1Nickname: "TESTOTHERNICKNAME",
    player2Nickname: "Self Nickname",
    player1Code: mockOpponent2Code,
    player2Code: mockPlayerAlternateCode,
    player1ActiveElo: makeRandomEloFromRank("Silver 1"),
    player2ActiveElo: makeRandomEloFromRank("Silver 1"),
    player1HighestElo: 1500,
    player2HighestElo: 1600
  },
  {
    raw: { 
      settings: null,
      metaData: null,
      winners: null,
      gameEnd: null,
      lastFrame: null,
    },
    notes: [],
    matchId: "unranked_match4",
    gameNumber: 1,
    type: GameType.UNRANKED,
    slpFile: "file5.slp",
    slpFilePath: "file5.slp",
    startAt: "2023-07-02T12:00:00Z",
    stageId: 32, // FD
    matchLength: 250,
    player1Won: false,
    player2Won: true,
    player1Quit: false,
    player2Quit: true,
    player1UserId: "user456",
    player2UserId: "player",
    player1Character: 2, // Fox
    player2Character: 9, // Marth
    player1CharacterColor: 3,
    player2CharacterColor: 4,
    player1Stocks: 2,
    player2Stocks: 2,
    player1Percent: 90,
    player2Percent: 100,
    player1Ranks: [],
    player2Ranks: [],
    player1Nickname: "TESTOTHERNICKNAME",
    player2Nickname: "Your Nickname",
    player1Code: mockOpponent2Code,
    player2Code: mockPlayerCode,
    player1ActiveElo: makeRandomEloFromRank("Gold 1"),
    player2ActiveElo: makeRandomEloFromRank("Gold 1"),
    player1HighestElo: 1500,
    player2HighestElo: 1600
  }
];

export { opponentRanks, mockMatch, mockHistory, mockResults, mockPlayerCode, mockPlayerAlternateCode, mockOpponent1Code, mockOpponent2Code }