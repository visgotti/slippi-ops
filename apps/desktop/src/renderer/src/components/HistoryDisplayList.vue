<template>
  <div class="history-display">
    <div>
      <h3>Match History ({{ history.length }})</h3> 
      <div class="long-win-loss">
        <p>Wins: {{ winLossRecord.wins }}</p>
        <p>Losses: {{ winLossRecord.losses }}</p>
      </div>
      <div class="short-win-loss">
        <p>{{ winLossRecord.wins }} - {{ winLossRecord.losses }} </p>
      </div>


      <div
        class="collapsable-buttons"
        v-if="collapsable"
      >
          <span @click.stop="expanded=false" v-if="expanded">▲</span>
          <span @click.stop="expanded=true" v-else>▼</span>
      </div>
    </div>
 
    <ul
      v-if="!collapsable || expanded"
    >
      <li v-for="match in history" :key="match.matchId">
        <MatchListItem
          :key="match.startAt"
          :selected="selectedMatchStartAt === match.startAt"
          :match="match" />
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, toRefs, ref } from 'vue';
import type { PlayerGameResults } from '@slippiops/types';
import CharacterStockIcon from '@/components/icons/CharacterStockIcon.vue';
import StageSelectImage from '@/components/StageSelectImage.vue';
import MatchListItem from '@/components/MatchListItem.vue';
import { useTrackerStore } from '@/store';
export default defineComponent({
  name: 'HistoryDisplayList',
  components: {
    MatchListItem,
    CharacterStockIcon,
    StageSelectImage,
  },
  props: {
    collapsable: {
      type: Boolean,
      default: false,
    },
    selectedMatchStartAt: {
      type: String,
      default: null,
    },
    history: {
      type: Array as PropType<PlayerGameResults[]>,
      required: true,
    },
  },
  setup(props) {
    const { collapsable, history } = toRefs(props);
    const expanded = ref(false);
    const trackerStore = useTrackerStore();
    const winLossRecord = computed(() => {
      let wins = 0;
      let losses = 0;
      history.value.forEach(match => {
        if (match.youWon) wins++;
        else losses++;
      });
      return { wins, losses };
    });

    const selectedMatchStartAt = computed(() => props.selectedMatchStartAt);

    return {
      history,
      expanded,
      collapsable,
      selectedMatchStartAt,
      trackerStore,
      winLossRecord,
    };
  },
});
</script>

<style lang="scss" scoped>
.collapsable-buttons {
  cursor: pointer;
}

ul {
  margin: 0px;
  margin-bottom: 5px;
}
li {
  cursor: pointer;
  list-style-type: none;
  color: var(--text-color);
  &:hover {
    background-color: var(--card-background-color-hover);
    &.match-item {
      background-color: var(--card-background-color-hover);
    }
  }
}
.history-display {
  min-width: 100%;
  width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  > div {
    display: flex;
    flex-direction: row;
    > div, h3 {
      justify-content: center;
      align-items: center;
      text-align: center;
      width: 50%;
      display: flex;
      flex-direction: column
    }
  }
}
ul {
  overflow-x: hidden;
  overflow-y: auto;
  padding: 0;
}
.match-item {
  border-bottom: 1px solid #ccc;
  padding-left: 10px;
  padding-right: 10px;
  padding-top: 3px;
  padding-bottom: 3px;
  display: flex;
  flex-direction: column;
  background-color: var(--card-background-color);
  border-radius: 8px;
  margin-bottom: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.match-item.win {
  border-left: 5px solid green;
}

.match-item.loss {
  border-left: 5px solid red;
}

.match-details {
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  > p {
    font-size: 12px;
    position: absolute;
    top: 0px;
    right: 2px;
  }
  > div {
    display: flex;
    flex-direction: row;
    max-width: calc(100% - 60px)
  }
}
.player-details {
  &.your-player-details {
    min-width: 100px;
    max-width: 100px;
  }
  max-width: 140px;
  min-width: 100px;
  position: relative;
  display: flex;
  flex-direction: column;
  .player-nick {
    max-width: 100%;
    div {
      font-size: 12px;
      opacity: .7;
    }
    span {
      font-size: 9px;
      opacity: .8;
      display: inline-block;
      white-space: nowrap; 
      overflow: hidden;
      white-space: nowrap; 
      max-width: 100%;
      text-overflow: ellipsis;
    }
    &.your-nick {
      span {
        white-space: nowrap; 
        max-width: 100%;
        text-overflow: ellipsis;
      }
    }
  }
}

.character-icons {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 20px;
}

.character-icons CharacterIcon {
  margin-bottom: 10px;
}

.match-info {
  display: flex;
  flex-direction: row;
  flex: 1;
  position: absolute;
  right: 0px;
  bottom: 0px;
}

.match-info p {
  margin: 0px;
}

.character-icons {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 20px;
}

.stock-image-wrapper {
  max-width: 24px;
  max-height: 24px;
  margin-top: 20px;
  margin-bottom: 10px;
  position: relative;
  > span {
    font-size: 10px;
    position: absolute;
    right: 0px;
    font-weight: bold;
    bottom: -5px;
  }
}

.character-icons .stock-image-wrapper {
  margin-bottom: 10px;
}
.stock-image-wrapper.your-icon {
  margin-right: 8px;
}

.stock-image-wrapper.won {
  background-color: green;
  box-shadow: 0 0 10px 5px green;
}

.stock-image-wrapper.loss {
  opacity: .5;
}

.stage-image {
  margin-bottom: 10px;
}


.short-win-loss {
  display: none !important;
}

@media (max-width: 500px) {
  .long-win-loss {
    display: none !important;
  }
  .short-win-loss {
    display: block !important;
  }
}
@media (max-width: 300px) {
  h3 {
    visibility: hidden;
    height: 0px;
  }
}

</style>