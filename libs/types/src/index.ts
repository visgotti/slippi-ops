import type { GameStartType, MetadataType, PlacementType, GameEndType, FrameEntryType } from "@slippi/slippi-js";
import type { Pagination } from "@slippiops/sqllite";

export type MatchTrackerMetaData = {
	unrankedEloMatches: number,
	unrankedElo: number,
  lastUsedCode: string,
  lastUsedUserId: string,
  folderTimetstamps: {[key: string]: number },
  detectedUserCodes: {[key: string]: string },
}

export type MatchTrackerOptions = {
  useCpus: number,
  autodetectCodes: boolean,
  processParallel: boolean,
  currentCodes: string[];
  pathToReplays: string;
	pathToDb: string;
  recursivelyAllPaths: boolean;
	disableLiveTracking: boolean;
};

export type Chat = {
  id: number;      
  opponentUserId: string;
};

export type ChatMessage = {
  id: number;         
  chatId: number;    
	nickname: string; 
  playerId: number;   
  content: string;    
  sentAt: string;     
	matchId?: string;
};


export type DiTypes = 'no-di' | 'di-out' | 'slight-di' | 'di-in'

export type CharacterNote = {
	stageIds?: number[] | null,
	opponentPercentStart?: number | null,
	opponentPercentEnd?: number | null,
	yourPercentStart?: number | null,
	yourPercentEnd?: number | null,
	yourCharacterIds?: number[] | null,
  id: number,
  characterId: number,
  content: string,

	//hopefully get to add
	diLabels?: DiTypes[]
	customLabels?: CharacterNoteCustomCharacterNoteLabels[]
}

// not used yet
export type CharacterNoteCustomCharacterNoteLabels = {
	customNoteId: number,
	value: string
}


// not used yet
export type CustomCharacterNoteLabels = {
	id: number,
	name: string,
	color: string,
}

export type LiveCharacterNote = CharacterNote & {
  opponentPercentConditionType: string;
  yourPercentConditionType: string;
}

export type PlayerNote = {
	id: number,
	userId: string,
	content: string,
}

export type RankedSeasonData = {
	id: number,
	slippiId: string,
	name: string,
	endedAt: string,
	startedAt?: string | null,
	seasonName: string,
}

export type RankData = {
	elo: number,
	seasonId: string,
	wins: number,
	losses: number,
	wasActiveSeason: boolean,
	globalPlacement?: number | null,
	regionalPlacement?: number | null
}

export type Player = {
	id: string, //userId
	fetchedRanksAt?: string | null,
}

export type PlayerRank = {
	userId: string,
	elo: number,
	seasonId: string,
	wins: number,
	losses: number,
	wasActiveSeason: boolean,
	globalPlacement?: number | null,
	regionalPlacement?: number | null
	seasonDateStart: string,
	seasonDateEnd: string,
	seasonName: string,
	continent: string,
	characters: Array<{ name: string, gameCount: number }>
}

export type RankDbData = PlayerRank & {
	id: number,
	updatedAt: string,
}


export type RawSlippiData = {
	settings: GameStartType | null,
	metaData: MetadataType | null,
	winners: PlacementType[] | null,
	gameEnd: GameEndType | null,
	lastFrame: FrameEntryType | null,
}

export type Results = {
	id?: number,
	statsId?: number,
	raw: RawSlippiData,
	matchId: string;
	gameNumber: number;
	slpFilePath: string;
	slpFile: string;
	startAt: string;
	stageId: number;
	type: GameType,
	notes: Array<MatchNote>,
	matchLength: number;
}

export type UnprefixedResultData = {
	won: boolean,
	userId: string,
	character: number,
	quit: boolean,
	characterName: string,
	characterColor: number,
	characterColorName: string,
	stocks: number,
	percent: number,
	nickname: string,
	code: string,
	activeElo: number | null,
	highestElo: number | null,
}

export type GameResultsQueryable = Partial<Omit<GameResults, 'raw' | 'notes' | 'player1Ranks' | 'player2Ranks'>>

export enum GameType {
	UNRANKED,
	RANKED,
	DIRECT,
}

export type GameResults = Results & {
	id?: number,
	statsId?: number,
	matchId: string;
	gameNumber: number;
	slpFile: string;
	startAt: string;
	stageId: number;
	
	notes: Array<{ createdAt: number, content: string }>
	player1Ranks: PlayerRank[] | null,
	player2Ranks: PlayerRank[] | null,
	
	player1Won: boolean,
	player2Won: boolean,
	
	player1UserId: string,
	player2UserId: string,

	player1Character: number,
	player2Character: number,
	
	player1Quit: boolean,
	player2Quit: boolean,
	
	player1CharacterColor: number,
	player2CharacterColor: number,
	
	player1Stocks: number,
	player2Stocks: number,
	
	player1Percent: number,
	player2Percent: number,
	
	player1Nickname: string,
	player2Nickname: string,
	
	player1Code: string,
	player2Code: string,

	player1ActiveElo: number | null,
	player1HighestElo: number | null,

	player2ActiveElo: number | null,
	player2HighestElo: number | null,
};
  
export type PlayerGameResults = Results &  {
	stageName: string;

	opponentRanks: PlayerRank[] | null,
	yourRanks: PlayerRank[] | null,

	yourPlayerIndex: number,
	opponentPlayerIndex: number,

	youWon: boolean;
	opponentWon: boolean;

	youQuit: boolean;
	opponentQuit: boolean;

	yourUserId: string;
	opponentUserId: string;

	yourCharacter: number;
	opponentCharacter: number;

	yourCharacterName: string;
	opponentCharacterName: string;

	yourCharacterColor: number;
	opponentCharacterColor: number;

	yourCharacterColorName: string;
	opponentCharacterColorName: string;

	yourStocks: number;
	opponentStocks: number;

	yourPercent: number;
	opponentPercent: number;

	yourNickname: string;
	opponentNickname: string;

	yourCode: string;
	opponentCode: string;

	yourActiveElo: number | null;
	opponentActiveElo: number | null;

	yourHighestElo: number | null;
	opponentHighestElo: number | null;
};  

export type QueryFilters = {
	ranks?: string[]; // filter option for ranks
	startAtBefore?: string;
	startAtAfter?: string;
	opponentString?: string,
	searchOnlyOpponentCodes?: boolean,
	searchOnlyOpponentNicknames?: boolean,
	opponentSearchExactMatch?: boolean,
	yourString?: string,
	searchOnlyYourCodes?: boolean,
	searchOnlyYourNicknames?: boolean,
	yourSearchExactMatch?: boolean,
	yourStocks?: number; // filter option for yourStocks
	opponentStocks?: number; // filter option for opponentStocks
	opponentCharacters?: number[],
	yourCharacters?: number[],
	stages?: number[], // filter option for stageId
	youQuit?: boolean,
	opponentQuit?: boolean,
	includeFinished?: boolean,
	ranked?: boolean;
	unranked?: boolean;
	direct?: boolean;
	youWon?: boolean;
	youLoss?: boolean;
	matchLengthStart?: number;
	matchLengthEnd?: number;
}
  
export type MatchNote = {
	content: string,
	createdAt: number,
}

export type RankStrings = 'Bronze 1' | 'Bronze 2' | 'Bronze 3' | 'Silver 1' | 'Silver 2' | 'Silver 3' | 'Gold 1' | 'Gold 2' | 'Gold 3' | 'Plat 1' | 'Plat 2' | 'Plat 3' | 'Diamond 1' | 'Diamond 2' | 'Diamond 3' | 'Master 1' | 'Master 2' | 'Master 3' | 'Grand Master';

export type QueryOptions = {
	page?: number;
	limit?: number;
	lastOpponentQuery?: string; // combined last query string
	lastStartAt?: string;
}

export type QuerySort = {
	sortBy?: 'startAt' | 'opponentNickname' | 'opponentCode' | 'matchLength' | 'youWon' | 'opponentWon' | 'yourStocks' | 'opponentStocks' | 'opponentCharacterName' | 'yourCharacterName' | 'opponentActiveElo';
	sortOrder?: 'asc' | 'desc';
}

export type QueryParams = {
	filters?: QueryFilters,
	sort?: QuerySort,
	pagination?: Pagination,
};

export type MatchMakerInitialLoadPayload = {
	meta: MatchTrackerMetaData,
	activeRank: RankDbData | null,
}

export type BaseCharacterStats = {
	timesPlayedAs: number,
	timesPlayedAgainst: number,
	timesWonAs: number,
	timesLostAs: number,
	timesWonAgainst: number,
	timesLostAgainst: number,
}

export type ByStageStats = {
	timesWonAs: number,
	timesLostAs: number,
	timesPlayedAs: number,
	byCharacter: {[characterId: string]: ByCharacterStats },
}

export type ByCharacterStats = {
	timesWonAgainst: number,
	timesLostAgainst: number,
	timesPlayedAgainst: number,
}

export type CharacterStats = BaseCharacterStats & {
	byStage: {[stageId: string]: ByStageStats },
	byCharacter: {[characterId: string]: ByCharacterStats },
}

export type ComputedCharacterStats = BaseCharacterStats & {
	winRate: number,
	lossRate: number,
	byStage: {[stageId: string]: ByStageStats & { winRate: number, lossRate: number } },
}

export * from './events';