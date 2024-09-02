import { defineStore } from 'pinia'
import type { QuerySort, QueryFilters, PlayerGameResults } from  '@slippiops/types';
import { deepEqual, jsonCopy, removeFromArray, sortedStringify } from  '@slippiops/utils';

export type SavedFilter = { filters: QueryFilters, sort: QuerySort, name: string}

export type MatchHistoryState = {
  resultDatasets: Array<{ startingIndex: number, data: PlayerGameResults[] }>,
  filters: QueryFilters,
  sort: QuerySort,
  savedFilters:  Array<SavedFilter>,
  loadedSavedFilter: SavedFilter | null,
  changedLoadedFilter: boolean,
  currentScroll: number,
  expandedRowIndexes: {[rowIndex: number]: boolean },
  totalResults: number,
  loadingInitial: boolean,
}

export const defaultFilters : QueryFilters = {
  ranks: [],
  startAtBefore: undefined,
	startAtAfter: undefined,
  opponentString: '',
	searchOnlyOpponentCodes: false,
	searchOnlyOpponentNicknames: false,
  opponentSearchExactMatch: false,
	yourString: '',
	searchOnlyYourCodes: false,
	searchOnlyYourNicknames: false,
  yourSearchExactMatch: false,
	yourStocks: undefined,
	opponentStocks: undefined,
	opponentCharacters: [],
	yourCharacters: [],
  stages: [],
	youQuit: true,
	opponentQuit: true,
  includeFinished: true,
  youWon: true,
  youLoss: true,
	ranked: true,
  unranked: true,
  direct: true
}

export const defaultSort : QuerySort = {
  sortBy: 'startAt',
  sortOrder: 'desc',
}

export const defaultState : () => MatchHistoryState = () => ({
  loadingInitial: true,
  resultDatasets: [],
  savedFilters: [],
  sort: {
   ...defaultSort,
  },
  filters: {
    ...defaultFilters
  },
  loadedSavedFilter: null,
  changedLoadedFilter: false,
  currentScroll: 0,
  totalResults: 0,
  expandedRowIndexes: {},
})


export const mergeAdjacentDatasets = (
  datasets: Array<{ startingIndex: number; data: any[] }>
): Array<{ startingIndex: number; data: any[] }> => {
  if (datasets.length === 0) return datasets;
  datasets.sort((a, b) => a.startingIndex - b.startingIndex);

  const mergedDatasets: { startingIndex: number; data: any[] }[] = [];
  let currentMerged: { startingIndex: number; data: any[] } = { startingIndex: datasets[0].startingIndex, data: [...datasets[0].data] };

  for (let i = 1; i < datasets.length; i++) {
    const current = datasets[i];

    if (currentMerged.startingIndex + currentMerged.data.length >= current.startingIndex) {
      const overlap = current.startingIndex - currentMerged.startingIndex;
      const nonOverlappingPart = current.data.slice(Math.max(0, currentMerged.data.length - overlap));
      currentMerged.data = currentMerged.data.concat(nonOverlappingPart);
    } else {
      mergedDatasets.push(currentMerged);
      currentMerged = { startingIndex: current.startingIndex, data: [...current.data] };
    }
  }
  mergedDatasets.push(currentMerged);
  return mergedDatasets;
};

export const useMatchHistoryStore = defineStore({
  id: "matchHistory",
  state: () => {
    const persisted = localStorage.getItem('match-history-filters');
    if(persisted) {
      return {
        ...defaultState(),
        savedFilters: JSON.parse(persisted),
      }
    } else {
      return defaultState();
    }
  },
  getters: {
    loadedFilterIndex() : number  {
      return this.savedFilters.indexOf(this.loadedSavedFilter!);
    },
    loadedFilterHasPendingChanges() : boolean {
      return !!(this.loadedSavedFilter &&  (
        !deepEqual(this.sort, this.loadedSavedFilter.sort) ||
        !deepEqual(this.sort, this.loadedSavedFilter.sort) 
      ));
    },
    // going to do something kind of hacky and put a watcher on this for determining a query changed. probably can just put a watcher on the filters and sort object though
    serializedQuery() : string {
      return `filters=${sortedStringify(this.filters)}&sort=${sortedStringify(this.sort)}`
    },
  },
  actions: {
    reset() {
      const d = defaultState();
      for(const key in d) {
        this[key] = d[key];
      }
    },
    toggleRowExpanded(index: number) {
      if(index in this.expandedRowIndexes) {
        delete this.expandedRowIndexes[index];
      } else {
        this.expandedRowIndexes[index] = true;
      }
    },
    setCurrentScroll(v: number) {
      this.currentScroll = v;
    },
    resetHistoryResults() {
      this.loadingInitial = true;
      this.expandedRowIndexes = {};
      this.resultDatasets = [];
      this.totalResults = 0;
    },
    addDataset(startIndex: number, data: PlayerGameResults[]) {
      this.resultDatasets.push({ startingIndex: startIndex, data });
      this.resultDatasets = mergeAdjacentDatasets(this.resultDatasets);
    },
    pruneDatasets(startIndex: number, endIndex: number, pruneThreshold=200): Array<[number, number]> {
      const newDatasets: { startingIndex: number, data: PlayerGameResults[] }[] = [];
      const prunedRanges: Array<[number, number]> = [];
  
      for (const dataset of this.resultDatasets) {
        const datasetEndIndex = dataset.startingIndex + dataset.data.length;
  
        if (datasetEndIndex < startIndex - pruneThreshold) {
          // Skip this dataset as it's entirely before the prune threshold
          prunedRanges.push([dataset.startingIndex, datasetEndIndex]);
          continue;
        }
  
        if (dataset.startingIndex > endIndex + pruneThreshold) {
          // Skip this dataset as it's entirely after the prune threshold
          prunedRanges.push([dataset.startingIndex, datasetEndIndex]);
          continue;
        }
  
        if (dataset.startingIndex < startIndex - pruneThreshold) {
          // Trim the beginning of this dataset
          const startTrimIndex = startIndex - pruneThreshold - dataset.startingIndex;
          prunedRanges.push([dataset.startingIndex, dataset.startingIndex + startTrimIndex]);
          dataset.startingIndex += startTrimIndex;
          dataset.data = dataset.data.slice(startTrimIndex);
        }
  
        if (datasetEndIndex > endIndex + pruneThreshold) {
          // Trim the end of this dataset
          const endTrimIndex = endIndex + pruneThreshold - dataset.startingIndex;
          prunedRanges.push([dataset.startingIndex + endTrimIndex, datasetEndIndex]);
          dataset.data = dataset.data.slice(0, endTrimIndex);
        }
  
        newDatasets.push(dataset);
      }
      this.resultDatasets = newDatasets;
      return prunedRanges;
    },
  
    loadSavedFilter(filterIndex: number) {
      this.loadedSavedFilter = this.savedFilters[filterIndex];
      this.filters = jsonCopy(this.loadedSavedFilter!.filters);
      this.sort = jsonCopy(this.loadedSavedFilter!.sort);
    },
    setTotal(v: number) {
      this.totalResults = v;
      this.loadingInitial = false;
    },
    saveFilter(saveAsNew: boolean, name: string) {
      const newFilter = jsonCopy({ filters: this.filters, sort: this.sort, name });
      let index = -1;
      if(saveAsNew || !this.loadedSavedFilter) {
        this.savedFilters.push(newFilter);
        index = this.savedFilters.length - 1;
      } else if (this.loadedSavedFilter) {
        index = this.savedFilters.indexOf(this.loadedSavedFilter);
        if(index < 0) { throw new Error(`Expected to have an index`)}
        this.savedFilters[index] = newFilter;
      } else {
        throw new Error(`Unhandled condition`)
      }
      this.loadSavedFilter(index);
      localStorage.setItem('match-history-filters', JSON.stringify(this.savedFilters));
    },
    deleteFilter(filterIndex: number) {
      if(this.savedFilters[filterIndex] === this.loadedSavedFilter) {
        this.loadedSavedFilter = null;
      }
      removeFromArray(this.savedFilters, this.savedFilters[filterIndex]);
      localStorage.setItem('match-history-filters', JSON.stringify(this.savedFilters));
    },
    applySort(v: QuerySort) {
      this.sort = v;
    },
    applyFilters(v: QueryFilters) {
      this.filters = v;
    },
  }
});