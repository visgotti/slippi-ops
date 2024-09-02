import { defineStore } from 'pinia'

export type UpdaterState = {
  checking: boolean,
  checked: boolean,
  hasUpdates: boolean,
  updating: boolean,
  finishedUpdate: boolean,
  updateError: string
}

const defaultState : () => UpdaterState = () => ({
  checking: false,
  checked: false,
  hasUpdates: false,
  updating: false,
  finishedUpdate: false,
  updateError: '',
})

// Define the actions type
export type UpdaterActions = {
  reset(): void;
  setValue(key: keyof UpdaterState, v: boolean);
  setError(v: string);
}

export const useUpdaterStore = defineStore<'updater', UpdaterState, {}, UpdaterActions>({
  id: "updater",
  state: () => {
    return defaultState();
  },
  actions: {
    reset() {
      const d = defaultState();
      for(const key in d) {
        this[key] = d[key];
      }
    },
    setError(error: string) {
      this.updateError = error;
    },
    setValue(key: keyof UpdaterState, value: boolean) {
      this[key as string] = value as any;
    }
  }
});