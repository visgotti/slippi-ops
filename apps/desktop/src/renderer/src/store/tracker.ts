import { defineStore } from 'pinia'
import { StatsType } from '@slippi/slippi-js';
import { removeFromArray, updateInArray, upsertArray } from '@slippiops/utils';
import { MatchTrackerMetaData, PlayerGameResults, CharacterNote, PlayerNote } from '@slippiops/types';
export enum TRACKER_STATES {
  NONE = 'NONE',
  LOADING = 'LOADING',
  PARSING = 'PARSING',
  LOADED = 'LOADED'
}

export type TrackerStoreState = {
  opponentRank?: any,
  lastQueriedHistoryOpponentId: string,
  lastQueriedHistoryOpponentHistory: PlayerGameResults[],
  opponentPercent: number,
  yourPercent: number,
  metaData?: MatchTrackerMetaData | null,
  needToParse: number,
  loaded: boolean,
  loading: boolean,
  parsing: boolean,
  parsed: boolean,
  parsedFiles: number,
  currentMatch: PlayerGameResults | null,
  selectedMatch: PlayerGameResults | null,
  currentOpponentHistory: PlayerGameResults[],
  lastMatches: PlayerGameResults[],
  matchTrackerInitialized: boolean,
  viewingStatsFile: string,
  viewingStats: StatsType[] | null,
  yourCodes: string[],
  optionsInitialized: boolean,
  playerNotes: PlayerNote[],
  characterNotes: {[id: string]: CharacterNote[] },
  waitingToConfirmCode: { player1Code: string, player2Code: string, startAt: string } | null,
  importState: {
    dbImportInProgress: boolean,
    currentTable: string,
    totalRows: number,
    successCount: number,
    failedCount: number,
  }
}
 
const defaultState : () => TrackerStoreState = () => ({
  opponentRank: null,
  lastQueriedHistoryOpponentId: '',
  lastQueriedHistoryOpponentHistory: [],
  opponentPercent: 0,
  yourPercent: 0,
  characterNotes: {},
  metaData: null,
  yourCodes: [],
  needToParse: 0,
  playerNotes: [],
  parsedFiles: 0,
  parsing: false,
  parsed: false,
  loaded: false,
  loading: false,
  optionsInitialized: false,
  waitingToConfirmCode: null,
  currentMatch: null,
  selectedMatch: null,
  currentOpponentHistory: [],
  lastMatches: [],
  viewingStatsFile: "",
  viewingStats: null,
  matchTrackerInitialized: false,
  importState: {
    dbImportInProgress: false,
    currentTable: '',
    totalRows: 0,
    successCount: 0,
    failedCount: 0,
  }
})

export type TrackerStoreGetters = {
  allResultsUnfiltered(state: TrackerStoreState): PlayerGameResults[];
  allResults(state: TrackerStoreState): PlayerGameResults[];
  selectedHistory(state: TrackerStoreState): PlayerGameResults[];
  selectedResult(state: TrackerStoreState): { match: PlayerGameResults, history: PlayerGameResults[] } | null;
};

export type TrackerStoreActions = {
  setOptionsInitialized(v: boolean): void;
  setWaitingConfirmCode(v: { player1Code: string, player2Code: string, startAt: string } | null): void;
  setPlayerPercents(yourPercent: number, opponentPercent: number): void;
  setViewingStats(url: string): void;
  setSelectedMatch(v: PlayerGameResults | null): void;
  initializedMatchTracker(): void;
  removePlayerNote(note: PlayerNote): void;
  updatePlayerNote(note: PlayerNote): void;
  addPlayerNote(note: PlayerNote): void;
  setPlayerNotes(notes: PlayerNote[]): void;
  removeCharacterNote(note: CharacterNote): void;
  updateCharacterNote(note: CharacterNote): void;
  addCharacterNote(note: CharacterNote): void;
  setCharacterNotes(notes: { [id: string]: CharacterNote[] }): void;
  reset(): void;
  setMetaData(v: MatchTrackerMetaData): void;
  setLastQueriedHistory(opponentId: string, history: PlayerGameResults[]): void;
  endGame(result: PlayerGameResults): void;
  setNeedToParse(p: number): void;
  setParsedFiles(parsed: number): void;
  setCurrentMatch(match: PlayerGameResults, history: PlayerGameResults[]): void;
  setOpponentRank(rank: any): void;
  startDbImport(): void;
  endDbImport(): void;
  startDbTableImport(table: string, rows: number): void;
  updateDbImport(success: number, failed: number): void;
};

export const useTrackerStore = defineStore<'tracker', TrackerStoreState, TrackerStoreGetters, TrackerStoreActions>({
  id: 'tracker',
  state: defaultState,
  getters: {
    allResultsUnfiltered() : PlayerGameResults[]  {
      return [...this.currentOpponentHistory, ...this.lastMatches];
    },
    allResults() : PlayerGameResults[]  {
      const seenStartAt : any = {}
      return this.allResultsUnfiltered.filter(item => {
        if (item && !seenStartAt[item.startAt]) {
          seenStartAt[item.startAt] = true;
          return true;
        }
        return false;
      }).sort((a, b) => parseInt(b.startAt) - parseInt(a.startAt));
    },
    selectedHistory() : PlayerGameResults[] {
      if(!this.selectedMatch) return [];
      return this.allResults.filter(r => {
        return r.opponentUserId == this.selectedMatch?.opponentUserId;
      });
    },
    selectedResult() : { match: PlayerGameResults, history: PlayerGameResults[] } | null {
      if(!this.selectedMatch) {
        return null;
      }
      return { match: this.selectedMatch, history: this.selectedHistory }
    }
  },
  actions: {
    setWaitingConfirmCode(v: { player1Code: string, player2Code: string, startAt: string } | null) {
      this.waitingToConfirmCode = v;
    },
    setPlayerPercents(yourPercent: number, opponentPercent: number) {
      this.yourPercent = yourPercent;
      this.opponentPercent = opponentPercent;
    },
    setViewingStats(url: string) {
      this.viewingStatsFile = url;
    },
    setSelectedMatch(v: PlayerGameResults | null) {
      this.selectedMatch = v;
    },
    initializedMatchTracker() {
      this.matchTrackerInitialized = true;
    },
    removePlayerNote(note: PlayerNote) {
      removeFromArray(this.playerNotes, note, "id");
    },
    updatePlayerNote(note: PlayerNote) {
      updateInArray(this.playerNotes, note, "id");
    },
    addPlayerNote(note: PlayerNote) {
      if(!this.playerNotes) {
        this.playerNotes = [];
      }
      this.playerNotes.unshift(note);
    },
    setPlayerNotes(notes: PlayerNote[]) {
      this.playerNotes = notes;
    },
    removeCharacterNote(note: CharacterNote) {
      removeFromArray(this.characterNotes[note.characterId], note, "id");
    },
    updateCharacterNote(note: CharacterNote) {
      updateInArray(this.characterNotes[note.characterId], note, "id");
    },
    addCharacterNote(note: CharacterNote) {
      if(!this.characterNotes[note.characterId]) {
        this.characterNotes[note.characterId] = [];
      }
      this.characterNotes[note.characterId].unshift(note);
    },
    setCharacterNotes(notes: {[id: string]: CharacterNote[] }) {
      this.characterNotes = notes;
    },
    reset() {
      const d = defaultState();
      for(const key in d) {
        this[key] = d[key];
      }
    },
    setMetaData(v: MatchTrackerMetaData) {
        this.metaData = v;
    },  

    setLastQueriedHistory(opponentId: string, history: PlayerGameResults[]) {
      this.lastQueriedHistoryOpponentId = opponentId;
      this.lastQueriedHistoryOpponentHistory = history;
    },
    endGame(result: PlayerGameResults) {
      // not sure why but this was undefined once
      if(!result) {
        return;
      }
      upsertArray(this.lastMatches, result, "startAt");
      this.currentOpponentHistory = [];
      this.currentMatch = null;
      this.selectedMatch = result;
    },
    setNeedToParse(p: number) {
      this.needToParse = p;
    },
    setParsedFiles(parsed: number) {
      this.parsedFiles = parsed;
    },
    setOptionsInitialized(v: boolean) {
      this.optionsInitialized = v;
    },
    setCurrentMatch(match: PlayerGameResults, history: PlayerGameResults[]) {
      this.selectedMatch = null;
      this.currentMatch = match;
      this.currentOpponentHistory = history;
    },
    setOpponentRank(rank: any) {
      this.opponentRank = rank;
    },
    startDbImport() {
      this.importState.dbImportInProgress = true;
      this.importState.successCount = 0;
      this.importState.failedCount = 0;
      this.importState.currentTable = '';
      this.importState.totalRows = 0;
    },
    endDbImport() {
      this.importState.dbImportInProgress = false;
      this.importState.successCount = 0;
      this.importState.failedCount = 0;
      this.importState.currentTable = '';
      this.importState.totalRows = 0;
    },
    startDbTableImport(table: string, rows: number) {
      this.importState.currentTable = table;
      this.importState.totalRows = rows;
      this.importState.successCount = 0;
      this.importState.failedCount = 0;
    },
    updateDbImport(success: number, failed: number) {
      this.importState.successCount = success;
      this.importState.failedCount = failed;
    },
  }
});
