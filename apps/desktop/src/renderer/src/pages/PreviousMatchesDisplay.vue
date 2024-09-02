<template>
  <div class="outer">
    <div class="filter-container"
      :class="{ 'show-filters': showFilters }"
    >
      <FilterAndSort
        @filter="handleFilterChange"
        @sort="handleSortChange"
        @close="showFilters = false"
      />
    </div>
    <div class="previous-matches-container">
      <div class="filter-and-result-wrapper">
        <button class="primary" @click="showFilters = !showFilters">
          {{ showFilters ? 'Hide Filters' : 'Show Filters' }}
        </button>
        <div v-if="!isLoadingCount">
          {{ totalResults }} Results
        </div>
        <button class="refresh-btn" v-if="showRefreshButton" @click="doInitialLoad(true)" :disabled="!canRefreshButton">
          Refresh
        </button>
      </div>
      <div v-if="showLoader"> 
        Loading results...
      </div>
      
      <LazyVirtualList
        v-else
        class="previous-matches-list"
        :itemBuffer="5"
        :scroll-start="startingScroll"
        :scrollThrottle="60"
        :emit-update="true"
        :dynamicSizes="{}"
        :autoDetectSizes="true"
        :datasets="resultDatasets"
        :itemSize="100"
        :minItemSize="100"
        :totalItems="totalResults"
        @load="onLazyLoad"
        @scroll="onScroll"
      >
        <template #default="{ item, index }">
          <MatchListItem
            :show-open-file-option="true"
            :key="item.startAt"
            :selected="false"
            :match="item"
          />
        </template>
      </LazyVirtualList>
    </div>
  </div>
</template>

<script lang="ts">
import type { PlayerGameResults, QueryFilters, QuerySort } from '@slippiops/types';
import { computed, getCurrentInstance, onMounted, ref, watch } from 'vue';
import type { ComputedRef, Ref } from 'vue';
import { useMatchHistoryStore, useTrackerStore, useSettingsStore } from '@/store';
import { storeToRefs } from 'pinia';
import MatchListItem from '@/components/MatchListItem.vue';
import CharacterStockIcon from '@/components/icons/CharacterStockIcon.vue';
import FilterAndSort from '@/components/FilterAndSort.vue';
import { getTimeAgoString, jsonCopy } from '@slippiops/utils';
import LazyVirtualList from '@/components/LazyVirtualList';
import { onBeforeMount, onUnmounted } from 'vue';
import useGlobals from '../composables/useGlobals';
import { inflateRawSync } from 'zlib';
import { decode } from 'punycode';

type GroupedResult = { 
  id: string;
  characterCounts: Array<{
    key: string,
    opponentCharacterName: string,
    opponentCharacterColor: number,
    overallPercentage: number,
    colorPercentage: number,
    winPercentage: number,
    wins: number,
    losses: number,
  }>
  opponentId: string, 
  results: Array<PlayerGameResults>, 
}

export default {
  components: {
    LazyVirtualList,
    CharacterStockIcon,
    MatchListItem,
    FilterAndSort,
  },
  name: 'PreviousMatchesDisplay',
  setup() {
    const trackerStore = useTrackerStore();
    const settingsStore = useSettingsStore();
    const matchHistoryStore = useMatchHistoryStore();

    const { resultDatasets, serializedQuery, totalResults, loadingInitial, sort, filters } = storeToRefs(matchHistoryStore);
    const startingScroll = ref(matchHistoryStore.currentScroll);
    const currentScroll = computed(() => matchHistoryStore.currentScroll);

    onMounted(() => {
      startingScroll.value = matchHistoryStore.currentScroll;
    });
    const { parsing, parsedFiles } = storeToRefs(trackerStore);
    const newCodesDetected = ref(false);

    const lastRefreshedAt = ref(0);

    const newParsedFilesDetected = computed(() => {
      return parsedFiles.value > lastRefreshedAt.value;
    });
    
    const showRefreshButton = computed(() => {
      return parsing.value || newCodesDetected.value;
    });

    const canRefreshButton = computed(() => {
      return showRefreshButton.value && (newParsedFilesDetected.value || newCodesDetected.value) && !loadingForRefresh.value && !loadingInitial.value;
    });

    const showLoader = computed(() => {
      return loadingInitial.value && !loadingForRefresh.value;
    })

    const { options } = storeToRefs(settingsStore) as any;
    const yourCodes = computed(() => options.value.currentCodes);
    watch(yourCodes, (newV, oldV) => {
      if(!!newV !== !!oldV || newV && oldV && JSON.stringify(newV) !== JSON.stringify(oldV)) {
        newCodesDetected.value = true;
      }
    });

    watch(parsedFiles, (newV, oldV) => {
      const diff = newV - lastRefreshedAt.value;
      if((!oldV && newV) || ((diff > 10 || totalResults.value < 10) && currentScroll.value === 0)) {
        doInitialLoad(true);
      }
    });

    const showStats = ref(false);
    const showFilters = ref(false);

    const alreadyLoading : Ref<{[startIndex: number]: boolean }> = ref({});

    
    const { $queryResults, $queryResultCount, $getMatchStats, $revealFile } = useGlobals();

    const currentQuerySequence = ref<number>(0);
  

    const handleFilterChange = (newFilters: QueryFilters) => {
      matchHistoryStore.applyFilters(newFilters);
    }

    const handleSortChange = (newSort: QuerySort) => {
      matchHistoryStore.applySort(newSort);
    }

    const pageSize = 30;
    const loadedPages = ref<{[page: string]: boolean}>({});
    const loadingPages = ref<{[page: string]: boolean}>({});
    
    const needToLoadPage = (page: number) => {
      if(page < 0) return false
      return !loadedPages.value[page] && !loadingPages.value[page];
    }
    
    const onLazyLoad = async ({ startIndex, endIndex }: { startIndex: number, endIndex: number }) => {
      const startIndexPage = Math.floor(startIndex / pageSize);
      const endIndexPage = Math.floor(endIndex / pageSize);  

      if(startIndexPage < 0 || startIndex < 0 || endIndex < 0 || endIndexPage < 0) {
        return;
      }

      const diff = endIndexPage - startIndexPage
      if(diff > 1) {
        const middle = Math.floor((endIndex - startIndex) / 2);
        onLazyLoad({ startIndex: startIndex, endIndex: startIndex + middle });
        onLazyLoad({ startIndex: startIndex + middle, endIndex: endIndex });
        return;
      }
      
      let queryOffset = -1;
      let querySize = pageSize;
      let actualStartingIndex = 0;
      if(needToLoadPage(startIndexPage)) {
        actualStartingIndex = startIndexPage * pageSize;
        loadingPages.value[startIndexPage] = true;
        queryOffset = pageSize * startIndexPage;
        if(endIndexPage !== startIndexPage && needToLoadPage(endIndexPage)) {
          loadingPages.value[endIndexPage] = true;
          querySize += pageSize;
        }
      } else if (needToLoadPage(endIndexPage)) {
        loadingPages.value[endIndexPage] = true;
        actualStartingIndex = endIndexPage * pageSize;
        queryOffset = pageSize * endIndexPage;
      } else {
        return;
      }
      const querySequenceWhenStarted = currentQuerySequence.value;
  
      let results : Array<PlayerGameResults> = [];
      $queryResults({
        sort: sort.value,
        filters: filters.value,
        pagination: {
          size: querySize,
          offset: queryOffset
        }
      }).then((r) => {
        results = r;
      }).finally(() => {
        if(querySequenceWhenStarted !== currentQuerySequence.value) {
          return;
        }
        loadedPages.value[startIndexPage] = true;
        loadedPages.value[endIndexPage] = true;
        delete loadingPages.value[startIndexPage];
        delete loadingPages.value[endIndexPage];
        matchHistoryStore.addDataset(actualStartingIndex, results);
        const pruned = matchHistoryStore.pruneDatasets(startIndex, endIndex, 200);

        pruned.forEach(p => {
          const [pStart, pEnd] = p;
          const startPage = Math.floor(pStart / pageSize);
          const endPage = Math.floor(pEnd / pageSize);
          for (let page = startPage; page <= endPage; page++) {
            delete loadedPages.value[page];
          }
        });
      });
    };

    const isLoadingCount = ref(false);
    const loadingForRefresh = ref(false);

    const doInitialLoad = (isRefresh=false) => {
      loadingForRefresh.value = isRefresh;
      newCodesDetected.value = false;
      lastRefreshedAt.value = parsedFiles.value;
      isLoadingCount.value = true;
      loadedPages.value = {};
      loadingPages.value = {};
      matchHistoryStore.resetHistoryResults();
      const seqWhenStarted = ++currentQuerySequence.value;
      alreadyLoading.value = {};
      $queryResultCount({
        sort: sort.value,
        filters: filters.value,
      }).then(c => {
        loadingForRefresh.value = false;
        isLoadingCount.value = false;
        matchHistoryStore.setTotal(c);
      });
   
      onLazyLoad({ startIndex: 0, endIndex: (pageSize * 2) - 1});
    }
    doInitialLoad();

    watch([serializedQuery], () => {
      matchHistoryStore.setCurrentScroll(0);
      doInitialLoad();
    });

    const showNoMatches = computed(() => {
      return totalResults.value === 0 && !loadingInitial.value;
    });

    return {
      doInitialLoad,
      showRefreshButton,
      canRefreshButton,
      isLoadingCount,
      handleSortChange,
      startingScroll,
      handleFilterChange,
      onLazyLoad,
      onScroll: matchHistoryStore.setCurrentScroll,
      matchHistoryStore,
      showStats,
      showFilters,
      getTimeAgoString,
      showNoMatches,
      resultDatasets, 
      serializedQuery, 
      totalResults, 
      showLoader
    };
  },
};
</script>

<style lang="scss" scoped>
:deep(.scroll-outer) {
}
.outer {
  width: 100%;
  height: 100%;
  max-height: 100%;
  display: flex;
  flex-direction: row;
}
.filter-container {
  display: none;
  min-width: 0px;
  width: 0px;
  max-width: 0px;
  &.show-filters {
    display: flex;
    min-width: 300px;
    width: 300px;
    max-width: 300px;
  }
}
.previous-matches-container {
  flex: 1;
  background-color: #2c2c2c;
  border-radius: 8px;
  color: white;
  max-height: 100%;
  height: 100%;
  min-height: 100%;
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
  > :first-child {
    flex: 0;
  }
  >:nth-child(2){
    flex: 1;
  }
}
.filter-and-result-wrapper {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 5px;
  button {
   
    &:not(.refresh-btn) {
      flex: 1;
    }
  }
  div {
    font-size: 12px;
    color: rgb(155, 211, 155);
    margin-left: 5px;
    margin-right: 5px;
  }
}
.previous-matches-list {
  min-height: auto !important;
  width: 100%;
  :deep(.list-item) {
    .match-details {
      padding-bottom: 0px;
      padding-top: 0px;
      margin-bottom: 3px;
      max-height: 97px;
      min-height: 97px;
      height: 97px;
    }
  }
}

.match-group {
  min-height: 65px;
  padding-bottom: 10px;
  overflow: hidden;
  height: 65px;
  max-height: 65px;
  
  .match-group-inner {
    background-color: #3c3c3c;
    width: 100%;
    height: 100%;
    max-height: 100%;
    border: 1px solid #444;
    border-radius: 8px;
    overflow: hidden;
    &:hover {
      background-color: #4c4c4c;
    }
  }
}

.group-header {
  padding: 10px;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;

  .group-info {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-content: flex-start;
    > div:nth-child(2) {
      font-size: 10px;
    }
  }

  .character-icons {
    margin-left: 6px;
  }
  > :last-child {  
    margin-left: auto;
  }
}

.character-icons {
  display: flex;
  gap: 5px;
}

.match-details {
  background-color: #2c2c2c;
  padding: 10px;
}

.match-item {
  padding: 5px;
  cursor: pointer;
}

.match-item:hover {
  background-color: #3c3c3c;
}

.match-item:not(:last-child) {
  border-bottom: 1px solid #444;
}
</style>
