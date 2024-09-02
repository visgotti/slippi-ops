/// <reference types="vite/client" />


import type { StatsType } from '@slippi/slippi-js';
import type { CharacterStats, CharacterNote, MatchNote, PlayerGameResults, QueryOptions, QueryParams, PlayerRank } from './electron/main/types';
import type { DefineComponent } from 'vue';
import { ChatMessage, MatchTrackerOptions } from '@slippiops/types';

declare module '*.vue' {
  const component: DefineComponent<{}, {}, any>
  export default component
}

// do a ctrl shift f to see how we add new global properties,
// and ctrl shift f for method name without the $ prefix inside MatchTracker.ts or MatchTrackerDAL.ts to see the implementation
export interface CustomProperties {
  $confirmCode(code: string, startAt: string): Promise<void>;
  $restoreApplication(): Promise<boolean>;
  $upsertPlayerChat(opponentUserId: string): Promise<{ chat: Chat, messages: ChatMessage[] }>;
  $addChatMessage(message: Omit<ChatMessage, 'id'>): Promise<ChatMessage>;
  $trackerInitialized: () => Promise<boolean>;
  $setOptions: (options: MatchTrackerOptions) => void;
  $initTracker: (options: MatchTrackerOptions) => void;
  $cancelFileParsing: () => void;
  $disablePercentCheckForCurrentGame: () => void;
  $upsertPlayer: (player: Player) => Promise<void>;
  $getPlayerRanks: (playerUserId: string) => Promise<PlayerRank[]>;
  $getPlayer: (playerUserId: string) => Promise<Player>;
  $refreshPlayerRanks: (playerUserId: string) => Promise<PlayerRank[]>;
  $getUniqueCodes: () => Promise<string[]>;
  $revealFile: (path: string) => Promise<void>;
  $toast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  $queryResultCount: (query: Omit<QueryParams, 'pagination'>) => Promise<number>;
  $queryResults: (query: QueryParams) => Promise<PlayerGameResults[]>;
  $saveMatchNotes: (resultId: number, notes: Array<MatchNote>) => Promise<void>;
  $deletePlayerNote: (id: number) => Promise<boolean>;
  $createPlayerNote: (playerUserId: string, content: string) => Promise<CharacterNote>;
  $updatePlayerNote: (id: number, content: string) => Promise<boolean>;
  $loadReplays: (path: string) => Promise<void>;
  $exportDatabase: (path?: string) => Promise<{ status: 'success' | 'canceled', path?: string }>;
  $importDatabase: (db: string) => Promise<{ status: 'success' | 'canceled', path?: string }>;
  $saveMatchData: (data: PlayerGameResults) => Promise<void>;
  $getMatchStats: (statIds: number[]) => Promise<StatsType[]>;
  $validateSlippiFolder: (path: string) => Promise<{ files: number, folders: number, duplicates: number } | null>;
  $deleteCharacterNote: (id: number) => Promise<boolean>;
  $createCharacterNote: (characterId: number, content: string) => Promise<CharacterNote>;
  $updateCharacterNote: (id: number, note: CharacterNote | string) => Promise<boolean>;
  $getTotalMatches: () => Promise<number>;
  $getCharacterStats: (id: number) => Promise<CharacterStats>;
  $exportCharacterNotes: () => Promise<{ status: 'success' | 'canceled', path?: string }>;
  $importCharacterNotes: () => Promise<{ status: 'success' | 'canceled', succeeded?: number, failed?: number }>;
  $getPlayerResults: (playerUserId: string) => Promise<PlayerGameResults[]>;
  $getPlayerNotes: (playerUserId: string) => Promise<PlayerNote[]>;
  $startUpdate: () => void;
}
// Extend Vue's ComponentCustomProperties
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties extends CustomProperties {}
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

interface ElectronAPI {
  startUpdate: () => void;
  cancelUpdate: () => void;
  restartApp: () => void;
  invokeTrackerMethod: (v: string) => Promise<any>;
  initMatchTracker: (options: any) => void;
  onTrackerEvent: (callback: (d: { event: string, data: any }) => void) => void;
  onTrackerResponse: (callback: (data: any) => void) => void;
  onUpdaterEvent: (callback: (data: any) => void) => void;
  selectDir: () =>Promise<{ status: 'success' | 'canceled', path?: string }>;
  selectFile: () => Promise<{ status: 'success' | 'canceled', path?: string }>;
  selectJson: () =>Promise<{ status: 'success' | 'canceled', path?: string }>;
  getDownloadDirectory: () => Promise<string>;
  getDownloadFile: (fileName?: string) => Promise<{ status: 'success' | 'canceled', path?: string }>;
  getDownloadJson: (fileName?: string) => Promise<{ status: 'success' | 'canceled', path?: string }>;
  onDbImportEvent: (callback: (d: { event: string, data: any }) => void) => void;
  revealFile: (path: string) => Promise<void>;
}

export {}
