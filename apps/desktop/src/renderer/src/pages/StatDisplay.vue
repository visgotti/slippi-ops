<template>
  <div>
    <div class="stats-cart-group">
      <label> Overall stats</label>

      <div class="stats-chart">
        <label> Win percentage</label>
      </div>

      <div class="stats-chart">
        <label> L-Cancel rate (overall)</label>
      </div>

      <div class="stats-chart">
        <label> Elo </label>
      </div>
    </div>
   

    <div class="stats-cart-group">
      <label> Win percent by character (vs all characters) </label>
      <div v-for="character in yourUniqueCharacters">
        <div class="stats-chart">
          <label> Win percentage ({{character}})</label>
        </div>
        <div v-if="expanded()">
          <div v-for="opCharacter in opponentCharacters">
            <div class="stats-chart">
              <label> Win percentage vs ({{opCharacter}})</label>
            </div>
          </div>
          <div v-for="stage in playedStages">
            <div class="stats-chart">
              <label> Win percentage on stage ({{stage}})</label>
            </div>
            <div v-for="opCharacter in opponentCharacters">
              <div class="stats-chart">
                <label> Win percentage on stage vs ({{opCharacter}})</label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>


    <div class="stats-chart">

    </div>

    <div class="stats-chart">

    </div>
      <div v-if="stats">
        {{ stats }}
      </div>
      <div v-else>
        Loading...
      </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';
import CharacterStockIcon from '@/components/icons/CharacterStockIcon.vue';
import StageSelectImage from '@/components/StageSelectImage.vue';
import { useTrackerStore } from '../store/tracker';
import { unique } from '@slippiops/utils';
import type { PlayerGameResults } from '@slippiops/types';
import type { StatsType } from '@slippi/slippi-js';


type ResultAndStats = { result: PlayerGameResults, stats: StatsType };

export default defineComponent({
  name: 'StatDisplay',
  components: {
    CharacterStockIcon,
    StageSelectImage,
  },
  props: {
    results: {
      type: Array as PropType<PlayerGameResults[]>,
      required: true,
    },
    stats: {
      type: Array as PropType<StatsType[]>,
      required: true,
    },
  },
  setup(props) {
    const isLoadingStats = computed(() => {
      return props.stats.length !== props.results.length;
    })
    const opponentCharacters =computed(() => {
      return unique(props.results.map(r => r.opponentCharacterName));
    })
    const playedStages = computed(() => {
      return unique(props.results.map(r => r.stageName));
    })
    const yourUniqueCharacters = computed(() => {
      return unique(props.results.map(r => r.yourCharacterName));
    })
    const expanded = () => {
      return false;
    }

    const gamesByStage = computed(() => {
      const obj : {[stageName: string]: ResultAndStats[] } = {};
      props.results.forEach((r, i) => {
        if(!(r.stageName in obj)) {
          obj[r.stageName] = [];
        }
        obj[r.stageName].push({ result: r, stats: props.stats[i] })
      })
      return obj;
    })

    const gamesByCharacterYouPlayedAs = computed(() => {
      const obj : {[characterName: string]: ResultAndStats[] } = {};
      props.results.forEach((r, i) => {
        if(!(r.yourCharacterName in obj)) {
          obj[r.yourCharacterName] = [];
        }
        obj[r.yourCharacterName].push({ result: r, stats: props.stats[i] })
      })
      return obj;
    });

    const gamesByCharacterYouPlayedAgainst = computed(() => {
      const obj : {[characterName: string]: ResultAndStats[] } = {};
      props.results.forEach((r, i) => {
        if(!(r.opponentCharacterName in obj)) {
          obj[r.opponentCharacterName] = [];
        }
        obj[r.opponentCharacterName].push({ result: r, stats: props.stats[i] })
      })
      return obj;
    });

    const gamesYourCharacterPlayedAsMappedToAgainst = computed(() => {
      const obj: { [characterName: string]: { [characterName: string]: ResultAndStats[] } } = {};
      props.results.forEach((r, i) => {
        if (!(r.yourCharacterName in obj)) {
          obj[r.yourCharacterName] = {};
        }
        if (!(r.opponentCharacterName in obj[r.yourCharacterName])) {
          obj[r.yourCharacterName][r.opponentCharacterName] = [];
        }
        obj[r.yourCharacterName][r.opponentCharacterName].push({ result: r, stats: props.stats[i] });
      });
      return obj;
    });

    const gamesYourCharacterPlayedAsMappedToStages = computed(() => {
      const obj: { [characterName: string]: { [stageName: string]: ResultAndStats[] } } = {};
      props.results.forEach((r, i) => {
        if (!(r.yourCharacterName in obj)) {
          obj[r.yourCharacterName] = {};
        }
        if (!(r.stageName in obj[r.yourCharacterName])) {
          obj[r.yourCharacterName][r.stageName] = [];
        }
        obj[r.yourCharacterName][r.stageName].push({ result: r, stats: props.stats[i] });
      });
      return obj;
    });

    const gamesYourCharacterPlayedAsMappedToAgainstMappedToStages = computed(() => {
      const obj: { [characterName: string]: { [characterName: string]: { [stageName: string]: ResultAndStats[] } } } = {};
      props.results.forEach((r, i) => {
        if (!(r.yourCharacterName in obj)) {
          obj[r.yourCharacterName] = {};
        }
        if (!(r.opponentCharacterName in obj[r.yourCharacterName])) {
          obj[r.yourCharacterName][r.opponentCharacterName] = {};
        }
        if (!(r.stageName in obj[r.yourCharacterName][r.opponentCharacterName])) {
          obj[r.yourCharacterName][r.opponentCharacterName][r.stageName] = [];
        }
        obj[r.yourCharacterName][r.opponentCharacterName][r.stageName].push({ result: r, stats: props.stats[i] });
      });
      return obj;
    });

    const gamesYourCharacterPlayedAgainstMappedToStages = computed(() => {
      const obj: { [characterName: string]: { [stageName: string]: ResultAndStats[] } } = {};
      props.results.forEach((r, i) => {
        if (!(r.opponentCharacterName in obj)) {
          obj[r.opponentCharacterName] = {};
        }
        if (!(r.stageName in obj[r.opponentCharacterName])) {
          obj[r.opponentCharacterName][r.stageName] = [];
        }
        obj[r.opponentCharacterName][r.stageName].push({ result: r, stats: props.stats[i] });
      });
      return obj;
    });

    return {
      isLoadingStats,
      gamesByStage,
      gamesByCharacterYouPlayedAs,
      gamesByCharacterYouPlayedAgainst,
      playedStages,
      expanded,
      opponentCharacters,
      yourUniqueCharacters,
      gamesYourCharacterPlayedAsMappedToAgainst,
      gamesYourCharacterPlayedAsMappedToStages,
      gamesYourCharacterPlayedAsMappedToAgainstMappedToStages,
    }
  }
});
</script>