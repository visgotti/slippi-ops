import './env.d.ts';

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { TRACKER_STATES } from '@/store/tracker';
import { useSettingsStore, useTrackerStore, useSlippiStore, useMatchHistoryStore, useUpdaterStore }  from '@/store';
import "./style.scss";
import type { 
  Player, MatchTrackerOptions, PlayerNote,
  CharacterNote, PlayerGameResults, QueryParams,
   PlayerRank, 
   ChatMessage} from '@slippiops/types';

import { TRACKER_EVENTS } from '@slippiops/types';

import type { StatsType } from '@slippi/slippi-js';

import App from './App.vue';
import Toast from './components/Toast.vue';
import { uniqueIgnoreCase } from '@slippiops/utils';

const app = createApp(App);
app.use(createPinia())

const trackerStore = useTrackerStore();
const settingsStore = useSettingsStore();
const slippiStore = useSlippiStore();
const matchHistoryStore = useMatchHistoryStore();
const updaterStore = useUpdaterStore();
let resSeq = 0;

const awaitingResponses : {[reqSeq: string]: { resolve: any, reject: any }} = {};

const invokeTrackerMethod : (name: string, ...args: any[]) => Promise<any> = async (name: string, ...args: any[]) => {
  const seq = resSeq++;
  return new Promise((resolve, reject) => {
    const onResolve = (payload: any) => {
      delete awaitingResponses[seq];
      resolve(payload);
    }
    const onReject = (payload: any) => {
      delete awaitingResponses[seq];
      reject(payload);
    }
    awaitingResponses[seq] = { resolve: onResolve, reject: onReject };

    window.electron.invokeTrackerMethod(JSON.stringify({ name, seq, args }));
  });
}

app.config.globalProperties.$confirmCode = (code: string, startAt: string) => invokeTrackerMethod('confirmCode', code, startAt);
app.config.globalProperties.$upsertPlayerChat = (opponentUserId: string) => invokeTrackerMethod('upsertPlayerChat', opponentUserId);
app.config.globalProperties.$addChatMessage = (message: Omit<ChatMessage, 'id'>) => invokeTrackerMethod('addChatMessage', message);
app.config.globalProperties.$trackerInitialized = () => invokeTrackerMethod('trackerInitialized');
app.config.globalProperties.$setOptions = (options: MatchTrackerOptions) => invokeTrackerMethod('setOptions', options);
app.config.globalProperties.$initTracker = (options: MatchTrackerOptions) => invokeTrackerMethod('initTracker', options);
app.config.globalProperties.$cancelFileParsing = () => invokeTrackerMethod('cancelFileParsing');
app.config.globalProperties.$revealFile = (path: string) => window.electron.revealFile(path);
app.config.globalProperties.$startUpdate = () => window.electron.startUpdate();
app.config.globalProperties.$queryResultCount = (queryOptions: Omit<QueryParams, 'pagination'>) => invokeTrackerMethod('queryResultCount', queryOptions) as Promise<number>;
app.config.globalProperties.$queryResults = (queryOptions: QueryParams) => invokeTrackerMethod('queryResults', queryOptions) as Promise<PlayerGameResults[]>;
app.config.globalProperties.$getTotalMatches = () => invokeTrackerMethod('getTotalMatches') as Promise<number>;
app.config.globalProperties.$getCharacterStats = (id: number) => invokeTrackerMethod('getCharacterStats', id);
app.config.globalProperties.$deleteCharacterNote = (id: number) => invokeTrackerMethod("deleteCharacterNote", id) as Promise<boolean>;
app.config.globalProperties.$createCharacterNote = (characterId: number, content: string) => invokeTrackerMethod("createCharacterNote", characterId, content) as Promise<CharacterNote>;
app.config.globalProperties.$updateCharacterNote = (id: number, content: string) => invokeTrackerMethod("updateCharacterNote", id, content) as Promise<boolean>;
app.config.globalProperties.$getPlayerNotes = (playerUserId: string) => invokeTrackerMethod('getPlayerNotes', playerUserId) as Promise<PlayerNote[]>;

app.config.globalProperties.$deletePlayerNote = (id: number) => invokeTrackerMethod("deletePlayerNote", id) as Promise<boolean>;
app.config.globalProperties.$createPlayerNote = (playerUserId: string, content: string) => invokeTrackerMethod("createPlayerNote", playerUserId, content) as Promise<CharacterNote>;
app.config.globalProperties.$updatePlayerNote = (id: number, content: string) => invokeTrackerMethod("updatePlayerNote", id, content) as Promise<boolean>;
app.config.globalProperties.$saveMatchNotes = (resultId: number, notes: Array<{ createdAt: number, content: string }>) => invokeTrackerMethod 
("saveMatchNotes", resultId, notes) as Promise<void>;
app.config.globalProperties.$getMatchStats = (params: number[]) => invokeTrackerMethod('getMatchStats', params) as Promise<StatsType[]>;
app.config.globalProperties.$validateSlippiFolder = (path: string) => invokeTrackerMethod('validateSlippiFolder', path);
app.config.globalProperties.$loadReplays = (path: string) => invokeTrackerMethod('validateSlippiFolder', path) as Promise<void>;
app.config.globalProperties.$loadReplays = (path: string) => invokeTrackerMethod('load', path) as Promise<void>;
app.config.globalProperties.$getPlayerResults = (playerUserId: string) => invokeTrackerMethod('getPlayerResults', playerUserId) as Promise<PlayerGameResults[]>;
app.config.globalProperties.$refreshPlayerRanks = (playerUserId: string) => invokeTrackerMethod("refreshPlayerRanks", playerUserId) as Promise<PlayerRank[]>;
app.config.globalProperties.$getPlayerRanks = (playerUserId: string) => invokeTrackerMethod("getPlayerRanks", playerUserId) as Promise<PlayerRank[]>;
app.config.globalProperties.$getPlayer = (playerUserId: string) => invokeTrackerMethod("getPlayer", playerUserId) as Promise<Player>;
app.config.globalProperties.$upsertPlayer = (player: Player) => invokeTrackerMethod('upsertPlayer', player) as Promise<void>;
app.config.globalProperties.$disablePercentCheckForCurrentGame = () => invokeTrackerMethod('disablePercentCheckForCurrentGame') as Promise<void>;
app.config.globalProperties.$importDatabase = (path: string) => invokeTrackerMethod('importDatabase', path);
app.config.globalProperties.$exportDatabase = async () => {
  const v = await window.electron.getDownloadDirectory();
  return invokeTrackerMethod('exportDatabase', v);
} 
app.config.globalProperties.$getUniqueCodes = () => invokeTrackerMethod('getUniqueCodes');

let lastCreatedToast : any = null;

app.config.globalProperties.$toast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
  const toastApp = createApp(Toast, {
    message,
    type
  });
  if (lastCreatedToast?.parentNode) {
    lastCreatedToast.parentNode.removeChild(lastCreatedToast);
    lastCreatedToast = null;
  }
  const instance = toastApp.mount(document.createElement('div'));
  document.body.appendChild(instance.$el);
  lastCreatedToast = instance.$el;
  setTimeout(() => {
    if (lastCreatedToast && instance.$el === lastCreatedToast) {
      try {
        document.body.removeChild(instance.$el);
        lastCreatedToast = null;
      } catch (err) {
      }
    }
  }, 1500);
}

app.config.globalProperties.$exportCharacterNotes = async () => {
  const file = await window.electron.getDownloadJson('character_notes.json');
  if(file.status === 'canceled') {
    return { status: 'canceled' };
  }
  await invokeTrackerMethod('exportCharacterNotes', file.path);
  return { status: 'success', path: file.path }
}

app.config.globalProperties.$importCharacterNotes = async () => {
  const file = await window.electron.selectJson();
  if(file.status === 'canceled') {
    return { status: 'canceled' };
  }
  const imported = await invokeTrackerMethod('importCharacterNotes', file.path) as any;
  return { status: 'success', ...imported }
}


app.config.globalProperties.$restoreApplication = async () => {
  await invokeTrackerMethod('hardResetApplication');
  trackerStore.reset()
  settingsStore.reset()
  slippiStore.reset()
  matchHistoryStore.reset()

  return true;
}

// app.config.globalProperties.$getOpponentHistory = (amount: number, skip: number)

app.config.globalProperties.$invokeTrackerMethod = invokeTrackerMethod;

const ekc = 'WyJBcnJvd1VwIiwiQXJyb3dVcCIsIkFycm93RG93biIsIkFycm93RG93biIsIkFycm93TGVmdCIsIkFycm93UmlnaHQiLCJBcnJvd0xlZnQiLCJBcnJvd1JpZ2h0IiwiS2V5QiIsIktleUEiXQ==';
const dkc = JSON.parse(atob(ekc));
let ekcRefIdx = 0;
const onKeyDown = (event: any) => {
  if (event.code === dkc[ekcRefIdx]) {
    ekcRefIdx++;
    if (ekcRefIdx === dkc.length) {
      settingsStore.confirmYk();
    }
  }
}
window.addEventListener('keydown', onKeyDown);

const handleTrackerResponse = (data: { seq: number, payload: any }) => {
  // negative sequence means error
  const r = data.seq < 0 ? 'reject' : 'resolve';
  awaitingResponses[Math.abs(data.seq)]?.[r](data.payload);
}

const handleUpdaterEvent = (data: { event: string, data: any}) => {
  console.log('handleUpdaterEvent', { event: data.event, data: data.data });
  switch(data.event) {
    case "current-version":
    case "update-available":
      updaterStore.setValue('hasUpdates', true);
      break;
    case "download-cancelled":
      break;
    case "download-started":
      updaterStore.setValue('updating', true);
      break;
    case "update-downloaded":
      updaterStore.setValue('updating', false);
      updaterStore.setValue('finishedUpdate', true);
      break;
    case "update-error":
      updaterStore.setError(data.data);
      break;
  }
}

const handleTrackerEvent = (data: { event: string, data: any }) => {
  switch (data.event) {
    case TRACKER_EVENTS.META:
      trackerStore.setMetaData(data.data);
      if (settingsStore.options.autodetectCodes) {
        settingsStore.setOptionValue('currentCodes', uniqueIgnoreCase([...settingsStore.options.currentCodes, ...Object.keys(data.data.detectedUserCodes)]));
      }
      break;
    case TRACKER_EVENTS.SEASONS:
      slippiStore.setRankedSeasons(data.data);
      break;
    case TRACKER_EVENTS.NUM_CPUS:
      settingsStore.setMaxCpus(data.data);
      break;
    case TRACKER_EVENTS.LOAD_START:
      trackerStore.loaded = false;
      trackerStore.loading = true;
      break;
    case TRACKER_EVENTS.LOAD_FINISH:
      trackerStore.loaded = true;
      trackerStore.loading = false;
      break;
    case TRACKER_EVENTS.PARSE_FINISH:
      trackerStore.parsed = true;
      trackerStore.parsing = false;
      trackerStore.setNeedToParse(0);
      break;
    case TRACKER_EVENTS.PARSE_START:
      trackerStore.parsed = false;
      trackerStore.parsing = true;
      trackerStore.setNeedToParse(data.data);
      break;
    case TRACKER_EVENTS.PARSED_FILE:
      trackerStore.setParsedFiles(data.data);
      break;
    case TRACKER_EVENTS.GAME_END:
      trackerStore.setWaitingConfirmCode(null);
      trackerStore.endGame(data.data);
      break;
    case TRACKER_EVENTS.UNKNOWN_CODE_GAME_STARTED:
      trackerStore.setWaitingConfirmCode(data.data);
      break;
    case TRACKER_EVENTS.SET_OPTIONS:
      trackerStore.setOptionsInitialized(true);
      break;
    case TRACKER_EVENTS.STARTED_GAME_CODE_CONFIRMED:
      trackerStore.setWaitingConfirmCode(null);
      if(data.data) {
        trackerStore.setCurrentMatch(data.data.result, data.data.history);
      }
      break;
    case TRACKER_EVENTS.GAME_START:
      trackerStore.setCurrentMatch(data.data.result, data.data.history);
      break;
    case TRACKER_EVENTS.OPPONENT_RANK:
      trackerStore.setOpponentRank(data.data);
      break;
    case TRACKER_EVENTS.PLAYER_PERCENTS:
      trackerStore.setPlayerPercents(data.data[0], data.data[1]);
      break;
    case TRACKER_EVENTS.CHARACTER_NOTES:
      trackerStore.setCharacterNotes(data.data);
      break;
  }
};

const handleDbImportEvent = (data: { event: string, data: any }) => {
  switch (data.event) {
    case TRACKER_EVENTS.DB_IMPORT_ROW:
      // number, number
      trackerStore.updateDbImport(data.data.success, data.data.failed);
      break;
    case TRACKER_EVENTS.DB_IMPORT_TABLE_START:
      // string, number
      trackerStore.startDbTableImport(data.data.table, data.data.rows);
      break;
    case TRACKER_EVENTS.DB_IMPORT_START:
      trackerStore.startDbImport();
      break;
    case TRACKER_EVENTS.DB_IMPORT_FINISH:
      trackerStore.endDbImport();
      break;
  }
};

invokeTrackerMethod('setOptions', settingsStore.options);

window.electron.onUpdaterEvent(handleUpdaterEvent);
window.electron.onTrackerEvent(handleTrackerEvent);
window.electron.onTrackerResponse(handleTrackerResponse);

app.mount('#app')
