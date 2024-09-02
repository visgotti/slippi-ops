<template>
<div class="outer"> 
   <button
      @click="exportNotes"
    > 
      Export Notes
    </button>
    <button
      :disabled="isImporting"
      @click="startImport"
    > 
      Import Notes
    </button>
  <div class="list-section">
    <div class="list-wrapper">
      <h3>
        Select a character
      </h3>
      <div v-for="character in tieredCharacterArray"
        @click="focusedCharacter = character.id"
        class="character-icon-container"
        :class="{ 'selected': focusedCharacter === character.id }"
      >
        <CharacterStockIcon 
          :title="character.name"
          :characterName="character.name"
          :characterColor="0"
        />
      </div>
    </div>
  </div>
  <div class="character-section">
    <div class="character-info">
      <div v-if="focusedCharacter > -1" class="character-details">
        <div class="character-name">{{ characterArray[focusedCharacter].name }}</div>
      </div>

      <div class="character-image-wrapper">
        <CharacterSelectImage 
          v-if="focusedCharacter > -1"
          :characterName="characterArray[focusedCharacter].name"
          :characterColor="0"
        />
      </div>
    </div>
   
   <div class="note-section">
     <CharacterNotes :key="`character-notes-${focusedCharacter}`" :disabled="focusedCharacter < 0" :characterId="focusedCharacter" />
   </div>
  </div>
   <div 
    v-if="focusedCharacter > -1"
    class="character-stats"
  >
    <div v-if="!loadedStats">
      Loading
    </div>

    <div
      v-else
    > 
    <div class="overall-stats">
      <div class="stat">
          <div class="stat-label">Times played as</div>
          <div class="stat-value">{{ loadedStats.timesPlayedAs }}</div>
      </div>
      <div class="stat">
          <div class="stat-label">Times played against</div>
          <div class="stat-value">{{ loadedStats.timesPlayedAgainst }}</div>
      </div>
      <div class="stat">
          <div class="stat-label">Win % as</div>
          <div class="stat-value">
              <span v-if="loadedStats.timesPlayedAs === 0">N/A</span>
              <span v-else>{{ loadedStats.winRateAs }}%</span>
          </div>
      </div>
      <div class="stat">
          <div class="stat-label">Win % against</div>
          <div class="stat-value">
              <span v-if="loadedStats.timesPlayedAgainst === 0">N/A</span>
              <span v-else>{{ loadedStats.winRateAgainst }}%</span>
          </div>
      </div>
      <div class="stat">
          <div class="stat-label">Wins as</div>
          <div class="stat-value">
              <span v-if="!loadedStats.timesPlayedAs">N/A</span>
              <span v-else>{{ loadedStats.timesWonAs }}</span>
          </div>
      </div>
      <div class="stat">
          <div class="stat-label">Losses as</div>
          <div class="stat-value">
              <span v-if="!loadedStats.timesPlayedAs">N/A</span>
              <span v-else>{{ loadedStats.lossesAs }}</span>
          </div>
      </div>
      <div class="stat">
          <div class="stat-label">Wins against</div>
          <div class="stat-value">
              <span v-if="!loadedStats.timesPlayedAgainst">N/A</span>
              <span v-else>{{ loadedStats.winsAgainst }}</span>
          </div>
      </div>
      <div class="stat">
          <div class="stat-label">Losses against</div>
          <div class="stat-value">
              <span v-if="!loadedStats.timesPlayedAgainst">N/A</span>
              <span v-else>{{ loadedStats.timesLostAgainst }}</span>
          </div>
      </div>
      <div class="stat">
          <div class="stat-label">% played as</div>
          <div class="stat-value">{{ loadedStats.percentagePlayedAs }}%</div>
      </div>
      <div class="stat">
          <div class="stat-label">% played against</div>
          <div class="stat-value">{{ loadedStats.percentagePlayedAgainst }}%</div>
      </div>
    </div>

      <!-- Sort Options -->
      <div class="sort-options">
        <label>Sort by:</label>
        <div class="sort-buttons">
          <button 
            v-for="option in displayStatOptions" 
            :key="option.id" 
            :class="{'active': displayStat === option.id}"
            @click="displayStat = option.id"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <div class="stats-against">
        <CharacterStatItem 
          v-for="character in sortedCharacterStats"
          :totalGamesPlayed="totalGames"
          :key="character.characterId"
          :displayStat="displayStat"
          :stats="character.stats"
          :characterId="character.characterId"
        />
      </div>
    </div>
  </div>
</div>
</template>

<script lang="ts" setup>
import { characterArray, tieredCharacterArray, fixFloat, legalStageIds } from '@slippiops/utils';
import CharacterNotes from '@/components/CharacterNotes.vue';
import CharacterStockIcon from '@/components/icons/CharacterStockIcon.vue';
import CharacterStatItem from '@/components/CharacterStatItem.vue';
import CharacterSelectImage from '@/components/CharacterSelectImage.vue';
import CharacterStatImage from '@/components/CharacterStatImage.vue';
import StageSelectImage from '@/components/StageSelectImage.vue';
import { ref, watch, computed } from 'vue';
import type { ComputedRef, Ref } from 'vue';
import { useGlobals } from '@/composables';
import type { CharacterStats, ComputedCharacterStats, BaseCharacterStats } from '@slippiops/types';
import Stats from '@/components/Stats.vue';
const focusedCharacter = ref(-1);
const focusedStage = ref(-1);

const isImporting = ref(false)
const { $getTotalMatches, $getCharacterStats, $exportCharacterNotes, $importCharacterNotes, $toast } = useGlobals();

const exportNotes = () => {
  $exportCharacterNotes().then(r => {
    if(r.status === 'success') {
      $toast('Successfully exported notes', 'success');
    }
  }).catch(err => {
    $toast(`Failed to export notes: ${err}`, 'error');
  })
}

const startImport = () => {
  isImporting.value = true;
  $importCharacterNotes().then(r => {
    if(r.status === 'success') {
      $toast(`Successfully imported ${r.succeeded} notes`, 'success');
    }
  }).finally(() => {
    isImporting.value = false;
  });
}

const handleFocusedStage = (stageId: number) => {
  if(stageId === focusedStage.value) {
    focusedStage.value = -1;
  }
  focusedStage.value = stageId;
}

type ComputedStats = CharacterStats & {
  winRateAs: number,
  winRateAgainst: number,
  percentagePlayedAs: number,
  percentagePlayedAgainst: number,
  lossesAs: number,
  winsAgainst: number,
}

const totalGames = ref(-1);
$getTotalMatches().then((total) => {
   totalGames.value = total;
});

const loadingStats = ref(false);



watch(focusedCharacter, async (newVal) => {
  if (newVal > -1) {
    if(newVal in gotCharacterStats.value) return;
    console.time('get-stats')
    loadingStats.value = true;
    const stats = await $getCharacterStats(parseInt(`${newVal}`));
    loadingStats.value = false;
    console.timeEnd('get-stats')
    gotCharacterStats.value[newVal] = stats;
  }
})
const gotCharacterStats : Ref<{[characterId: string]: CharacterStats }> = ref({});

function computeFullStats (stat: CharacterStats, total: number): ComputedStats  {
  const winRateAs = stat.timesPlayedAs > 0 ? (stat.timesWonAs / stat.timesPlayedAs) * 100 : 0;
  const percentagePlayedAs = (stat.timesPlayedAs / total) * 100;
  const percentagePlayedAgainst = (stat.timesPlayedAgainst / total) * 100;
  const lossesAs = stat.timesPlayedAs - stat.timesWonAs;
  const winsAgainst = stat.timesPlayedAgainst - stat.timesLostAgainst;
  const winRateAgainst = stat.timesPlayedAgainst > 0 ? (winsAgainst / stat.timesPlayedAgainst) * 100 : 0;
  
  const byCharacter : any = {};
  for(let c in stat.byCharacter) {
    byCharacter[c] = {
      ...stat.byCharacter[c],
      percentagePlayedAgainst: fixFloat((stat.byCharacter[c].timesPlayedAgainst / total) * 100, 2),
    }
  }

  return {
      ...stat,
    byCharacter,
    winRateAs: fixFloat(winRateAs, 2),
    winRateAgainst: fixFloat(winRateAgainst, 2),
    percentagePlayedAs: fixFloat(percentagePlayedAs, 2),
    percentagePlayedAgainst: fixFloat(percentagePlayedAgainst, 2),
    lossesAs,
    winsAgainst,
  }
}

const loadedStats : ComputedRef<ComputedStats | null> = computed(() => {
  if(!gotCharacterStats.value[focusedCharacter.value] || totalGames.value === -1) {
    return null;
  }

  const stats = computeFullStats(gotCharacterStats.value[focusedCharacter.value], totalGames.value);
  return {
     ...stats,
  }
});

const mappedCharacterStats = computed<Array<{ characterId: number, stats: ComputedCharacterStats}>>(() => {
  if(!loadedStats.value) return [];
  return characterArray.map(({ id: characterId }) => {
    const byStage : any = {};
    Object.keys(loadedStats.value!.byStage).forEach(stageId => {
      if(loadedStats.value!.byStage[stageId].byCharacter[characterId]) {
        const stageStats = {...loadedStats.value!.byStage[stageId].byCharacter[characterId] }
          byStage[stageId] = {
          ...stageStats,
          lossRate: stageStats.timesPlayedAgainst > 0 ? (stageStats.timesLostAgainst / stageStats.timesPlayedAgainst) * 100 : 0,
          winRate: stageStats.timesPlayedAgainst > 0 ? (stageStats.timesWonAgainst / stageStats.timesPlayedAgainst) * 100 : 0,
        };
      } else {
        byStage[stageId] = {
          timesLostAgainst: 0,
          timesPlayedAgainst: 0,
          timesWonAgainst: 0,
          lossRate: 0,
          winRate: 0,
        }
      }
    });
    const charStats = loadedStats.value!.byCharacter?.[characterId] || {
      timesPlayedAgainst: 0,
      timesPlayedAs: 0,
      timesLostAgainst: 0,
      timesWonAgainst: 0,
      winRateAs: 0,
      winRateAgainst: 0,
      percentagePlayedAs: 0,
      percentagePlayedAgainst: 0,
      lossesAs: 0,
      winsAgainst: 0,
    };
    return {
      characterId,
      stats: {
        ...charStats,
        byStage,
        lossRate: charStats.timesPlayedAgainst > 0 ? (charStats.timesLostAgainst / charStats.timesPlayedAgainst) * 100 : 0,
        winRate: charStats.timesPlayedAgainst > 0 ? (charStats.timesWonAgainst / charStats.timesPlayedAgainst) * 100 : 0,
      } as ComputedCharacterStats
    }
  })
});

const displayStatOptions = [
  { id: 'timesPlayedAgainst', label: 'Times Played Againt'},
  { id: 'winRate', label: 'Win %'},
  { id: 'lossRate', label: 'Loss %'},
]

const displayStat = ref('timesPlayedAgainst');

const sortedCharacterStats = computed(() => {
    return ([...mappedCharacterStats.value]).sort((a, b) => {
      switch(displayStat.value) {
        case 'timesPlayedAgainst':
          return b.stats.timesPlayedAgainst - a.stats.timesPlayedAgainst;
        case 'winRate':
          return b.stats.winRate - a.stats.winRate;
        case 'lossRate':
          return b.stats.lossRate - a.stats.lossRate;
      }
      return 0;
    });
});
</script>

<style lang="scss" scoped>
.note-section {
  display: flex;
  flex-direction: column;
}
.stats-against {
  display: flex;
  flex-direction: column;
}
.outer {
  max-height: 100%;
  overflow: auto;
}
.character-icon-container {
  cursor: pointer;
  display: inline-block;
  margin: 0 8px 8px 0;
}
.selected {
  outline: 2px solid var(--primary-color);
}
.character-section {
  display: flex;
  flex-direction: row;
  > div:first-child {
    max-width: 210px;
    min-width: 210px;
    width: 210px;
  } 
  > div:last-child {
    flex: 1;
    height: 100%;
  }
}
.overall-stats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  padding: 20px;
  background-color: #1a1a1a;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background-color: #2a2a2a;
  padding: 10px;
  border-radius: 8px;
}

.stat-label {
  font-size: 14px;
  color: #ccc;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
}

.stat-value span {
  display: block;
}

.stat:hover {
  background-color: #3a3a3a;
  transform: scale(1.05);
  transition: transform 0.2s ease, background-color 0.2s ease;
}

/* Responsive adjustments */
@media (max-width: 800px) {
  .overall-stats {
      grid-template-columns: repeat(4, 1fr); /* 4 columns for medium screens */
  }
}

@media (max-width: 600px) {
  .overall-stats {
      grid-template-columns: repeat(3, 1fr); /* 3 columns for smaller screens */
  }
}

@media (max-width: 400px) {
  .overall-stats {
      grid-template-columns: repeat(2, 1fr); /* 2 columns for small screens */
  }
}

@media (max-width: 300px) {
  .overall-stats {
      grid-template-columns: 1fr; /* 1 column for extra small screens */
  }
}

.sort-options {
  display: flex;
  align-items: center;
  flex-wrap: wrap; /* Allow the buttons to wrap to a new line if necessary */
  margin-bottom: 20px;
}

.sort-options label {
  margin-right: 10px;
  font-size: 16px;
  color: #ccc;
}

.sort-buttons {
  display: flex;
  flex-wrap: wrap; /* Allow the buttons to wrap within the available space */
}

.sort-buttons button {
  background-color: #2a2a2a;
  color: #fff;
  border: 1px solid #444;
  padding: 8px 16px;
  margin-right: 10px;
  margin-bottom: 10px; /* Add margin for spacing when wrapping */
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease, color 0.3s ease, transform 0.2s ease;
  white-space: nowrap; /* Prevent text wrapping within the button */
  flex-grow: 1; /* Allow buttons to grow to fill available space */
  min-width: 100px; /* Prevent buttons from becoming too small */
  text-align: center; /* Center text */
}

.sort-buttons button:hover {
  background-color: #3a3a3a;
  transform: scale(1.05);
}

.sort-buttons button.active {
  background-color: var(--primary-color); /* Active color */
  color: #fff;
}

.sort-buttons button:last-child {
  margin-right: 0;
}
</style>