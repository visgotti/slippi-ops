import { defineStore } from 'pinia'
import { MatchTrackerOptions, RankedSeasonData } from '@slippiops/types';

export type SlippiState = {
  rankedSeasons: RankedSeasonData[],
}

const defaultState : () => SlippiState = () => ({
  rankedSeasons: []
})

export const useSlippiStore = defineStore({
  id: "slippi",
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
    setRankedSeasons(s: RankedSeasonData[]) {
      this.rankedSeasons = s;
    },
  }
});