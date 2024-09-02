<template>
  <div class="tracker-container" v-if="finishedReset">
    <div>
      <h3> Reset complete, restart the application to see changes. </h3>
    </div>
  </div>
  <div class="tracker-container" v-else>
    <div v-if="isResetting" class="full-screen flex-center resetting-overlay">
      <LoadingText
        tag="h1"
        label="Resetting"
      />
    </div>
    <nav class="navbar"
      v-if="!isResetting"
    >
      <button 
        v-if="shouldShow.backButton"
        class="primary back-btn" @click="onGoBack">
         Back 
      </button>
      <button v-if="shouldShow.goToSettings"
        @click="viewingSettings=true"
        class="primary"
      >
        Settings
      </button>

      <button v-if="shouldShow.goToCharacters"
        class="primary"
        @click="viewingCharacters=true"
      >
        Characters
      </button>
      <div class="loading-nav-wrapper"
        v-if="shouldShow.navbarLoadingProgress"
      >
        <div>
          <div class="progress-bar-wrapper">
            <progress :value="parsedFiles" :max="needToParse"></progress>
          </div>
          <p class="files-parsed">{{ parsedFiles }} / {{ needToParse }} files parsed</p>
        </div>
        <button @click="settingsStore.setStateValue('showLoadingProgress', true)"> 
          ! 
        </button>
      </div>    
    </nav>

    <Settings
      v-if="isResetting || shouldShow.editSettingsPage || shouldShow.initializeSettingsPage"
      :initialized="shouldShow.editSettingsPage"
      @init="handleInit"
      @before-reset="handleBeforeReset"
      @after-reset="handleReset"
    />

    <LoadingText
      v-else-if="!optionsInitialized || loading"
      tag="h2"
      label="Initializing tracker"
    />

    <StatDisplay
      v-else-if="shouldShow.statsPage"
      :stats="stats!"
      :results="allResults"
    />

    <Characters v-else-if="shouldShow.charactersPage" />

    <div v-else-if="!!focusedMatch">
      <h2 v-if="!!isCurrentMatch"> Current Opponent: </h2>
      <button v-else-if="focusedMatch.slpFilePath"
        class="reveal-file-btn"
        :class="{floatleft: shouldShow.navbarLoadingProgress}"
        @click="$revealFile(focusedMatch.slpFilePath)">
  
        Reveal File
      </button>
      <MatchDisplay
        :isCurrentMatch="isCurrentMatch"
        :match="focusedMatch"
      />
    </div>

    <div v-else-if="shouldShow.matchHistoryPage">
      <PreviousMatchesDisplay />
    </div>

    <section v-if="!isResetting && ((loading || parsing) && showLoadingProgress)"
      class="loading-progress-wrapper"
    >
      <p v-if="trackerLoadingMessage"> {{ trackerLoadingMessage }} </p>
      <LoadingText
        tag="h4"
        left
        startingEllipses=2
        label="Parsing slippi files"
        className="slipp-parser-message" 
        v-if="parsing"
      />
      <p v-if="trackerParsingMessage"> {{ trackerParsingMessage }} </p>
      <p class="secondary-parser-message" v-if="secondaryParsingMessage"> {{ secondaryParsingMessage }} </p>
      <progress :value="parsedFiles" :max="needToParse"></progress>
      <p>{{ parsedFiles }} / {{ needToParse }} files parsed</p>
      <p v-if="estimatedTimeRemaining !== null">Estimated time remaining: {{ estimatedTimeRemaining }}</p>
      <button @click="settingsStore.setStateValue('showLoadingProgress', !showLoadingProgress)"> Hide </button>    
    </section>

    <CodeConfirmationPopup />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { useSettingsStore, useTrackerStore, useUpdaterStore } from '@/store';
import { storeToRefs } from 'pinia';

import PreviousMatchesDisplay from '@/pages/PreviousMatchesDisplay.vue';
import Characters from '@/pages/Characters.vue';
import Settings from '@/pages/Settings.vue';
import MatchDisplay from '@/pages/MatchDisplay/MatchDisplay.vue';
import StatDisplay from '@/pages/StatDisplay.vue';
import useGlobals from '@/composables/useGlobals';
import CodeConfirmationPopup from '@/components/CodeConfirmationPopup.vue';
import LoadingText from './components/LoadingText.vue';
import { setMultipleTimeouts } from '@slippiops/utils';

const startTime = ref<number | null>(null);
const timeDeltas = ref<number[]>([]);
const maxDeltaCount = 100;
const updateEvery = 10;
const minTime = ref<number | null>(null);
const isInitializing = ref(false);
const viewingSettings = ref(false);
const viewingCharacters = ref(false);
const trackerStore = useTrackerStore();
const settingsStore = useSettingsStore();

const settingsStoreRefs = storeToRefs(settingsStore);
const { showLoadingProgress, options, maxCpus } = settingsStoreRefs;  

const numOfCpus = computed(() => options.value.useCpus);

const { 
  $initTracker,
  $revealFile,
  $setOptions,
  $validateSlippiFolder,
  $startUpdate 
} = useGlobals();

const handleStartUpdate = () => {
  $startUpdate();
}

const { 
  checking,
  checked,
  hasUpdates,
  updating,
  finishedUpdate,
 } = storeToRefs(useUpdaterStore());

const handleInit = () => {
  if(!isInitializing.value) {
    isInitializing.value = true;
    $initTracker(options.value);
  }
}

if(options.value.pathToReplays) {
  $validateSlippiFolder(options.value.pathToReplays).then(valid => {
    if(!valid) { return; }
    handleInit();
  })
}
const {
    optionsInitialized,
    currentMatch, 
    parsedFiles, 
    parsed,
    parsing,
    loaded,
    loading,
    needToParse, 
    selectedResult, 
    viewingStatsFile, 
    allResults
} = storeToRefs(trackerStore);

const stats = ref(null);
watch(viewingStatsFile, (v: string) => {
  if(v) {
    /*
    $getMatchStats(v).then(s => {
      stats.value = s;
    });*/
  } else {
    stats.value = null;
  }
});

const trackerLoadingMessage = computed(() => {
  if(loading.value) {
    return 'Loading...';
  }
  return '';
})

const trackerParsingMessage = computed(() => {
   if(parsing.value) {
    if(needToParse.value > 500) {
      return 'There are a lot of files to parse, this is likely the first time opening the application and may take awhile.';
    } 
    if(needToParse.value > 200) {
      return 'This shouldn\'t take too long but you should wait till it\'s finished before playing any slippi games.';
    }
    if(needToParse.value > 50) {
      return 'This should only take a couple minutes.';
    }
  }
  return '';
});

const secondaryParsingMessage = computed(() => {
  if(parsing.value && numOfCpus.value > 1 && options.value.processParallel) {
    return 'Since you are using multiple cpus and parallel processing, it\'s not recommended to play slippi games while parsing.';
  }
  return '';
})

watch([parsed, parsing], () => {
  if(parsed.value && !parsing.value) {
    timeDeltas.value.length = 0;
  }
});

const formatTime = (seconds: number) => {
  let sec = Math.floor(seconds);

  // sample size should be big enough so we know
  if(parsedFiles.value >= 500) {
    if(minTime.value === null) {
      minTime.value = sec;
    } else {
      minTime.value = Math.min(minTime.value, sec);
    }
    sec = minTime.value;
  }

  const min = Math.floor(sec / 60);
  const hour = Math.floor(min / 60);
  
  if (hour > 0) {
    return `${hour}h ${min % 60}m`;
  } else if (min > 0) {
      return `${min}m`;
  } else {
    return `${sec}s`;
  }
};

const calculateAverageDelta = () => {
  if (timeDeltas.value.length === 0) return null;
  const sum = timeDeltas.value.reduce((acc, val) => acc + val, 0);
  return sum / timeDeltas.value.length;
};

watch(parsedFiles, (newVal) => {
  if (newVal === 1) {
    startTime.value = Date.now();
  } else if (!(newVal % updateEvery)) {
    // Calculate the time delta and update the array
    const currentTime = Date.now();
    const delta = (currentTime - startTime.value!) / 1000; // Convert to seconds
    timeDeltas.value.push(delta);
    if (timeDeltas.value.length > maxDeltaCount) {
      timeDeltas.value.shift(); // Keep only the last `deltaCount` deltas
    }
    // Update the start time for the next interval
    startTime.value = currentTime;
  }
});

const estimatedTimeRemaining = computed(() => {
  if (timeDeltas.value.length === 0 || parsedFiles.value === 0) {
    return null;
  }
  const averageDelta = calculateAverageDelta();
  if (averageDelta !== null) {
    const remainingFiles = needToParse.value - parsedFiles.value;
    const remainingTime = Math.max(0, (remainingFiles / updateEvery) * averageDelta);
    return formatTime(remainingTime);
  }
  return null;
});

const isOnSettingsPage = computed(() => {
  return !isInitializing.value || viewingSettings.value;
});
const finishedInit = computed(() => {
  return isInitializing.value && loaded.value;
});
const isInExplicitPage = computed(() => {
    return viewingSettings.value ||
      viewingCharacters.value ||
    viewingStatsFile.value;
});

// yea i know should use routing but this app was supposed to be small
const shouldShowPages = computed(() => {
  return {
    initializeSettingsPage: !isInitializing.value,
    editSettingsPage: finishedInit.value && viewingSettings.value,
    charactersPage: viewingCharacters.value,
    statsPage: !!viewingStatsFile.value,
    selectedResultPage: !!selectedResult.value && !isInExplicitPage.value,
    matchHistoryPage: !isInExplicitPage.value
  }
});

const shouldShow = computed(() => {
  return {
    ...shouldShowPages.value,
    navbarLoadingProgress: !showLoadingProgress.value && parsing.value,
    goToSettings: !isOnSettingsPage.value,
    goToCharacters: loaded.value && !shouldShowPages.value.charactersPage,
    navBar: isInitializing.value,
    backButton: loaded.value && (shouldShowPages.value.editSettingsPage ||
                  shouldShowPages.value.statsPage || 
                  shouldShowPages.value.selectedResultPage ||
                  shouldShowPages.value.charactersPage),
  }
});

const onGoBack = () => {
  if(shouldShow.value.editSettingsPage) {
    viewingSettings.value = false;
  } else if (shouldShow.value.statsPage) {
    viewingStatsFile.value = "";
  } else if (shouldShow.value.selectedResultPage) {
    trackerStore.setSelectedMatch(null)
  } else if (shouldShow.value.charactersPage) {
    viewingCharacters.value = false;
  }
}

watch(viewingSettings, (v) => {
  if(v) {
    viewingCharacters.value = false;
  }
});

watch(viewingCharacters, (v) => {
  if(v) {
    viewingSettings.value = false;
  }
});

watch(settingsStore, () => {
    const newObj = {};
    for(let key in settingsStoreRefs) {
      (<any>newObj)[key] = (<any>settingsStoreRefs)[key].value;
    }
    localStorage.setItem('settings-state', JSON.stringify(newObj));
  },
  { deep: true, immediate: true } // Deep watch to track changes within nested objects
);

watch(options, () => {
  $setOptions(options.value);
}, { deep: true, immediate: true});

const focusedMatch = computed(() => {
  if(currentMatch.value) {
    return { ...currentMatch.value }
  }
  if(selectedResult.value) {
    return { ...selectedResult.value.match }
  }
  return null;
});

const isCurrentMatch = computed(() => !!currentMatch.value);
watch(isCurrentMatch, (newV, oldV) => {
  if(newV && !oldV) {
    viewingCharacters.value = false;
    viewingSettings.value = false;
    viewingStatsFile.value = "";
  }
});

const isResetting = ref(false);
const handleBeforeReset = () => {
  isInitializing.value = false;
  isResetting.value = true;
  localStorage.clear();
}
const finishedReset = ref(false);
const handleReset = () => {
  /*
  startTime.value = null;
  timeDeltas.value = [];
  minTime.value = null;
  isInitializing.value = false;
  viewingSettings.value = false;
  viewingCharacters.value = false;
  viewingStatsFile.value = "";
  stats.value = null;
  isResetting.value = false;
  */
  finishedReset.value = true;
}

</script>
<style src="@vueform/toggle/themes/default.css"></style>
<style lang="scss">

button {
  appearance: none;
  background-color: #000000;
  border: 2px solid #1A1A1A;
  border-radius: 10px;
  box-sizing: border-box;
  color: #FFFFFF;
  cursor: pointer;
  display: inline-block;
  font-family: Roobert,-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol";
  font-size: 12px;
  font-weight: 600;
  height: 34px;
  min-height: 34px;
  padding-right: 8px;
  padding-left: 8px;
  line-height: normal;
  outline: none;
  text-align: center;
  text-decoration: none;
  transition: background-color 300ms cubic-bezier(.23, 1, 0.32, 1), 
              box-shadow 300ms cubic-bezier(.23, 1, 0.32, 1), 
              color 300ms cubic-bezier(.23, 1, 0.32, 1);  /* Targeted properties */
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  will-change: transform;
  &:disabled {
    pointer-events: none;
    cursor: not-allowed;
    opacity: .5;
  }
  &:hover {
    box-shadow: rgba(0, 0, 0, 0.25) 0 1px 8px;
    &:not(:active) {
      background-color: lighten(#000000, 6%);
      color: darken(#FFFFFF, 10%);
    }
 
  }  
  &:active {
    box-shadow: none;
  }
  
}
</style>

<style scoped>
form button:hover {
  background-color: darken(var(--highlight-blue), 10%);
}

</style>
<style lang="scss" scoped>
.resetting-overlay {
  z-index: 100000;
  background-color: var(--background-color) !important;
  pointer-events: none;
}
.loading-progress-wrapper {
  z-index: 100;
  position: absolute;
  top: 0px;
  right: 0px;
  width: 300px;
  min-width: 300px;
  max-width: 300px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  background-color: var(--card-background-color);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 5px;
  > .secondary-parser-message {
    font-size: 10px;
  }
}
@import "@/scss/mixins.scss";
.reveal-file-btn {
  display: none;
  position: absolute;
  top: 20px;
  right: 20px;
  @include responsive-scale-by-width(1, 0.3, 400px, 100px, 20px);
  &.floatleft {
    right: 50px;
  }
}
.tracker-container {
  flex-direction: column;
  height: calc(100% - 40px);
  max-height: calc(100% - 40px);
  padding: 20px;
  background-color: var(--background-color);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  > :nth-child(2) {
    flex: 1;
    max-height: calc(100% - 30px);
    height: calc(100% - 30px);
    min-height: calc(100% - 30px);
  }
  h2 {
    padding: 0px;
    margin: 4px;
  }
}

.navbar {
  display: flex;
  flex-direction: row;
  position: relative;
  min-height: 35px;
  height: 35px;
  max-height: 35px;
  @include responsive-scale-by-width(1, 0.5, 400px, 100px, 20px);
}

.loading-nav-wrapper {
  overflow: visible;
  right: 0px;
  position: absolute;
  display: flex;
  flex-direction: row;
  > div {
    margin-top: -20px;
    .progress-bar-wrapper {
      width: 150px;
    }
    p.files-parsed {
      font-size: 14px;
    }
  }
  button {
    &:hover {
      background-color: var(--highlight-blue-hover);
    }
    border-radius: 50%;
    background-color: var(--highlight-blue);
    width: 20px;
    height: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 20px;
    font-size: 12px;
    margin-left: -5px;
    margin-top: 0px;
    border: none;
  }
}

form {
  margin-bottom: 20px;
}

form div {
  margin-bottom: 10px;
}

form label {
  display: block;
  margin-bottom: 5px;
}

form input[type="text"] {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
  background-color: var(--card-background-color);
  color: var(--text-color);
  border: 1px solid var(--border-color);
}

form input[type="checkbox"] {
  margin-right: 5px;
}

form button {
  padding: 10px 20px;
  background-color: var(--highlight-blue);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.loading-progress {
  text-align: center;
}

.loaded-state {
  margin-top: 10px;
}

progress {
  width: 100%;
  height: 20px;
  margin-top: 10px;
  background-color: var(--card-background-color);
  color: var(--primary-color);
}

h2 {
  margin-top: 20px;
  font-size: 1.5em;
  color: var(--text-color);
}

p {
  margin: 5px 0;
  color: var(--text-color);
}

@media (max-width: 500px) {
  .reveal-file-btn {
    display: none;
    right: 0px;
    top: 0px;
  }
  .tracker-container {
    height: 100%;
    max-height: 100%;
    padding-top: 0px;
    padding-bottom: 0px;
    padding-left: 0px;
    padding-right: 0px;
  }
  
  .loading-nav-wrapper {
    top: 5px;
    .progress-bar-wrapper {
      > div {
        height: 10px;
      }
    }
    p {
      font-size: 12px;
    }
  }
}


@media (max-width: 400px) {
  .loading-nav-wrapper {
    > div {
      .progress-bar-wrapper {
        margin-left: 50px;
        width: 100px;
      }
      button {
        margin-left: -5px;
      }
    }
  }
}

@media (max-width: 310px) {
  .navbar {
    margin-right: 170px;
  }
  .loading-nav-wrapper {
    top: 8px;
    left: 27vh;
    > div {
      button {
        margin-left: -5px;
      }
    }
  }
}

@media (max-width: 270px) {
  .navbar {
    margin-right: 220px;
  }
  .reveal-file-btn {
    position: absolute;
    right: -5px;
    top: -5px;
  }
}

@media (max-width: 220px) {
  .reveal-file-btn {
    position: absolute;
    right: -15px;
    top: -5px;
  }
}


@media (max-width: 220px) {
  .loading-nav-wrapper {
    > div {
      .progress-bar-wrapper {
        margin-left: 30px;
        width: 100px;
      }
      button {
        margin-left: -5px;
      }
    }
  }
}

</style>

