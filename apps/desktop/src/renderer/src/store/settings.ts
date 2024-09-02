import { defineStore } from 'pinia'
import { MatchTrackerOptions } from  '@slippiops/types';
import { watch } from 'vue';
import { useGlobals } from '@/composables';
import { defaultTrackerOptions } from '@slippiops/utils';

export type SettingsState = {
  lastSelectedPlayAsCharacters: number[],
  options: MatchTrackerOptions,
  maxCpus: number | null,
  autoUpdate: boolean,
  showPlayerNotes: boolean,
  showPlayerRanks: boolean,
  showCharacterNotes: boolean,
  showLoadingProgress: boolean,
  optIntoChat: boolean,
  showChat: boolean,
  showOnlyCharacterNotes: boolean,
  showMatchStats: boolean,
  doLivePercentChecks: boolean,
  yk: boolean
}

const defaultState : () => SettingsState = () => ({
  options: defaultTrackerOptions(),
  lastSelectedPlayAsCharacters: [],
  showOnlyCharacterNotes: false,
  optIntoChat: false,
  showLoadingProgress: true,
  showChat: true,
  showMatchStats: false,
  showPlayerNotes: true,
  showCharacterNotes: true,
  showPlayerRanks: true,
  autoUpdate: true,
  doLivePercentChecks: true,
  maxCpus: null,
  yk: false
})
type OptionFlagProp = 'autodetectCodes' | 'processParallel' | 'recursivelyAllPaths';

// Define the actions type
export type SettingsActions = {
  confirmYk(): void;
  setOptionValue(prop: keyof MatchTrackerOptions, value: any): void;
  setOptionFlag(flag: OptionFlagProp, value: boolean): void;
  setStateValue<K extends keyof SettingsState>(prop: K, value: SettingsState[K]): void;
  setMaxCpus(v: number): void;
  reset(): void;
}

export const useSettingsStore = defineStore<'settings', SettingsState, {}, SettingsActions>({
  id: "settings",
  state: () => {
    const persisted = localStorage.getItem('settings-state');
    if(persisted) {
      const persistedState = JSON.parse(persisted);
      const d = defaultState();
      return {
        ...d,
        ...persistedState,
        options: {
          ...d.options,
          ...persistedState.options,
        }
      }
    } else {
      return defaultState();
    }
  },
  actions: {
    reset() {
      const d = defaultState();
      d.maxCpus = this.maxCpus;
      for(const key in d) {
        this[key] = d[key];
      }
    },
    confirmYk() {
      this.yk = true;
    },
    setOptionValue(prop: string, value: any) {
      this.options[prop] = value;
    },
    setOptionFlag(flag: OptionFlagProp, value: boolean) {
      this.options[flag] = value;
    },
    setStateValue(prop: string, value: any) {
      this[prop] = value;
    },
    setMaxCpus(v: number) {
      this.maxCpus = v;
    },
  }
});