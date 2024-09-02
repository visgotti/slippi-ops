<template>
  <div class="match-details match-item"
    @click="trackerStore.setSelectedMatch(match)"
    :class="{
      win: match.youWon,
      loss: !match.youWon,
      selected,
    }"
  >
    <button class="reveal-btn" v-if="match.slpFile" @click.stop.prevent="revealFile(match.slpFilePath)">
      Reveal file
    </button>
    <div class="win-loss-indicator"
      v-if="match.youWon || match.opponentWon"
    > 
      <div :class="{'you-won': match.youWon, 'you-loss': !match.youWon }"
        :title="winLossTooltip"
      >
        <span>
          {{ match.youWon ? 'W' : 'L' }}
        </span>
      <span :title="match.youQuit ? 'You quit out before the game ended' : 'Opponent quit out before the game ended'" v-if="match.youQuit || match.opponentQuit">Q</span>
      </div>
      
    </div>
    <div :title="formattedDateLong" class="match-dates">
      <p><strong></strong> {{ formattedDateShort }}</p>
      <p>{{ timeAgo }}</p>
    </div>
  
    <div>
      <div class="player-details your-player-details"
        :title="match.yourNickname"
      >
        <div class="stock-image-wrapper your-icon"
          :class="{'unknown': !match.youWon && !match.opponentWon, 'won': match.youWon, 'loss': !match.youWon }"
        >
          <CharacterStockIcon :characterName="match.yourCharacterName" :characterColor="match.yourCharacterColor"/>
          <span>{{ match.yourStocks }}</span>

        </div>
        <div class="player-nick your-nick"
        >
            <div>{{ match.yourCode }}</div>
            <span> {{ match.yourNickname }}</span>
          </div>
      </div>
    

      <div class="player-details"
      :title="match.opponentNickname"
      >
        <div class="stock-image-wrapper"
          :class="{'unknown': !match.youWon && !match.opponentWon, 'won': match.opponentWon, 'loss': !match.opponentWon || match.youWon }"
        >
          <CharacterStockIcon :characterName="match.opponentCharacterName" :characterColor="match.opponentCharacterColor"/>
          <span>{{ match.opponentStocks }}</span>
        </div>
        <div class="player-nick">
          <div>{{ match.opponentCode }}</div>
          <span> {{ match.opponentNickname }}</span>
        </div>
      </div>
    
    </div>
    <div class="match-info">
      <StageSelectImage :width="'56px'" :height="'56px'" :stageId="match.stageId" :stageName="match.stageName"/>
    </div>
   
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';
import type { PlayerGameResults } from '@slippiops/types';
import CharacterStockIcon from '@/components/icons/CharacterStockIcon.vue';
import StageSelectImage from '@/components/StageSelectImage.vue';
import { useTrackerStore } from '@/store';
import { getTimeAgoString } from '@slippiops/utils';
import { useGlobals } from '@/composables';

export default defineComponent({
name: 'MatchListItem',
components: {
  CharacterStockIcon,
  StageSelectImage,
},
props: {
  showOpenFileOption: {
    type: Boolean,
    default: false
  },
  match: {
    type: Object as () => PlayerGameResults,
    required: true,
  },
  selected: {
    type: Boolean,
    default: false,
  },
},
setup(props) {
  const { $revealFile } = useGlobals();
  const winLossTooltip = computed(() => {
    if (props.match.youQuit) {
      return 'You quit out before the game ended';
    }
    if (props.match.opponentQuit) {
      return 'Opponent quit out before the game ended';
    }
    return props.match.youWon ? 'You won' : 'You lost';
  });
  const trackerStore = useTrackerStore();
  const formattedDateShort = computed((): string => {
    const date = new Date(Number(props.match.startAt));
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options as any);
  });

  const formattedDateLong = computed((): string => {
    const date = new Date(new Date(Number(props.match.startAt)));
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  });

  const timeAgo = computed((): string => {
    return getTimeAgoString(new Date(Number(props.match.startAt)));
  });


  const selected = computed(() => props.selected);
  return {
    revealFile: $revealFile,
    selected,
    timeAgo,
    winLossTooltip,
    formattedDateLong,
    formattedDateShort,
    trackerStore,
  };
},
});
</script>

<style lang="scss" scoped>
@import "@/scss/variables.scss";
.win-loss-indicator {
position: absolute;
top: 1px;
left: 3px;
font-size: 10px;
font-weight: bolder;
.you-won {
  color: $win-green;
}
.you-loss {
  color: $lose-red;
}
}
.match-details {
cursor: pointer;
list-style-type: none;
color: var(--text-color);
&:hover {
  background-color: var(--card-background-color-hover);
  &.match-item {
    background-color: var(--card-background-color-hover);
  }
}
&.selected {
  box-shadow: 2px 3px 3px 0px var(--highlight-yellow);
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
border-left: 5px solid $win-green;
}

.match-item.loss {
border-left: 5px solid red;
}

.match-details {
position: relative;
display: flex;
flex-direction: row;
align-items: center;
.match-dates {
  position: absolute;
  top: 0px;
  right: 2px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  > p {
    margin: 0px;
    font-size: 12px;
    top: 0px;
    right: 2px;
    &:first-child {
      margin-bottom: 4px;
    }
    &:nth-child(2) {
      font-size: 10px;
    }
  }
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
.reveal-btn {
box-sizing: border-box;
padding-left: 5px;
padding-right: 5px;
display: flex;
justify-content: center;
align-items: center;
height: 17px;
min-height: 17px;
max-height: 17px;
text-wrap: nowrap;
right: 75px;
top: 0px;
border-radius: 3px;
position: absolute;
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

@media (max-width: 200px) {
.reveal-btn {
  right: unset;
  left: 30px;
}
}

</style>

