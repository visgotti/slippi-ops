<template>
  <div class="loaded-state">
    <div class="record-rank-container">

      <div class="match-info-outer">
      <div class="match-info">
        <div class="match-info-section player-info-section">
          <div class="player-info your-info">

            <div class="character-image-wrapper">
              <CharacterStockIcon 
                :characterName="match.yourCharacterName"
                :characterColor="match.yourCharacterColor"
              />
            </div>
            <div class="player-names">
              <p class="code"> {{ match.yourCode }} </p>
              <p class="nickname"> {{ match.yourNickname }} </p>
            </div>
          </div>
        
          <div class="stage-section">
            <p>{{  match.stageName }}</p>
            <StageSelectImage
              :stageId="match.stageId"
              :stageName="match.stageName"
            />
          </div>

          <div v-if="isCurrentMatch && false"
            @click="setViewingStats(match.slpFile)"
          >
            Show Stats
          </div>

          <div class="player-info opponent-info">

            <div class="character-image-wrapper">
              <CharacterStockIcon 
               :characterName="match.opponentCharacterName"
                :characterColor="match.opponentCharacterColor"
              />
            </div>
            <div class="player-names opponent">
              <p class="code"> {{ match.opponentCode }} </p>
              <p class="nickname"> {{ match.opponentNickname }} </p>
            </div>

          
          </div>
          
        </div>
        <div class="match-info-section history-info-section"
        >
          <HistoryDisplayList
            v-if="history"
            :history="history"
            :selectedMatchStartAt="match.startAt"
            :collapsable="true"
          />
          <div
            v-else
          >
            Loading history...
          </div>
        </div>
      </div>

      <div
        class="inline-ranks"
      >
        <div
          v-for="(rank, i) in last4Ranks"
          :title="getRankTooltip(rank)"
          :key="`rank_${i}`"
          class="inline-rank"
          :class="{
            'no-rank-info': !rank,
            'active-rank-inline': i === 0
          }"
        >
        <img 
          class="rank-icon" 
          :src="getRankIcon(rank)"
        />
        <CharacterStockIcon 
          v-if="rank?.mostPlayed"
          :scale=".35"
          :totalPercentage="rank.mostPlayed.percentage"
          :characterName="rank.mostPlayed.character"
          :characterColor="0"
          />
        </div>
      </div>
    </div>
 
      <div class="right-side-wrapper">
        <div class="notes-section"
          :class="{collapsed: !showPlayerNotes}"
        >
          <div class="notes-wrapper player-notes">
            <div class="header-wrapper">
              <h3> Player Notes  ({{allNotes.length}}) </h3>
              <button @click="() => toggleSettingFlag('showPlayerNotes')"> {{ showPlayerNotes ? 'hide' : 'show' }} </button>
            </div>
            <Notes
              v-if="showPlayerNotes"
              :notes="allNotes"
              @edit="onEditNote as any"
              @add="onAddNote as any"
              @delete="onDeleteNote as any"
              :disabled="disableNoteEditing as any"
              :title="disableNoteEditing ? 'Adding notes is disabled until match is finished' : ''"
            />
          </div>
          <LiveCharacterNotes
            :notes="percentFilteredCharacterNotes"
          />
        </div>
      </div>
    </div>

     <div class="stats-container" v-if="!isCurrentMatch && showMatchStats">
        <div v-if="loadingStats">
          loading stats...
        </div>
        <div v-else>
          {{ stats }}
        </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, } from 'vue';
import { getRankIconFromElo, } from '@slippiops/utils';
import CharacterSelectImage from '@/components/CharacterSelectImage.vue';
import CharacterStockIcon from '@/components/icons/CharacterStockIcon.vue';
import StageSelectImage from '@/components/StageSelectImage.vue';
import HistoryDisplayList from '@/components/HistoryDisplayList.vue';
import Notes from '@/components/Notes.vue';
import LiveCharacterNotes from '@/components/LiveCharacterNotes.vue';
import matchDisplayPropsMixin from './matchDisplayPropsMixin';
export default defineComponent({
  name: 'MatchDisplaySmall',
  mixins: [matchDisplayPropsMixin],
  components: {
    LiveCharacterNotes,
    Notes,
    HistoryDisplayList,
    StageSelectImage,
    CharacterSelectImage,
    CharacterStockIcon
  },
  computed: {
    last4Ranks() {
      return this.latestRanks.slice(0, 4).filter(r => !!r);
    },
  }

});
</script>

<style scoped lang="scss">


.notes-section {
  display: flex;
  flex-direction: column-reverse;
  justify-content: flex-end;
  height: 100%;
  flex: 1;
  :deep(.notes-container) {
    margin-top: 0px;
  }
  .header-wrapper {
    h3 {
      margin: 5px;
    }
    display: flex;
    flex-direction: row;
    align-items: center;
    button {
      margin-left: 5px;
      max-height: 20px;
      cursor: pointer;
    }
  }
}
.notes-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  h3 {
    margin: 5px;
  }
}
.note-content {
  padding: 5px;
  font-size: 14px;
  color: #f0f0f0; /* Light text color */
}



.loaded-state {
  width: calc(100% - 20px);
  height: calc(100% - 20px);
  min-width: calc(100% -  20px);
  min-height: calc(100% -  20px);
  max-width: calc(100% -  20px);
  max-height: calc(100% - 20px);
  overflow: hidden;
  font-family: Arial, sans-serif;
  color: var(--text-color);
  padding: 10px;
  background-color: var(--background-color);
}

.match-info-outer {
  max-height: 100%;
  display: flex;
  width: 100%;
  max-width: 100%;
  flex-direction: row;
  flex: 1;
  overflow: unset;
  margin-right: 0px;
  margin-bottom: 0px;

  > .match-info {
    overflow: hidden;
    height: 100% !important;
    width: calc(100% - 35px) !important;
    max-width: calc(100% - 35px) !important;
    min-width: calc(100% - 35px) !important;
    align-self: baseline;
    margin-right: 0px;
    margin-bottom: 0px;
  }
  .inline-ranks {
    padding-left: 4px;
    max-width: 35px;
    width: 35px;
    display: flex;
    flex-direction: column;
    align-items: center;
    .inline-rank {
      max-width: 35px;
      width: 35px;
      display: flex;
      flex-direction: row;
      align-items: center;
      max-height: 20px;
      min-height: 20px;
      :deep() {
        .show-percent {
          margin-left: 0px;
        }
      }
    }
    img.rank-icon {
      margin-left: 0px;
      max-height: 14px;
      width: auto;
    }
  }
}
.match-info {
  max-height: 100%;
  min-height: 100%;
  max-width: 350px;
  border-radius: 8px;
  color: var(--text-color);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  background-color: var(--card-background-color);
  color: var(--text-color);
  .match-info-section {
    display: flex;
    flex-direction: row;
    width: 100%;
    &:first-child() {
      height: 230px;
      min-height: 230px;
    }
    &.player-info-section {
      &:nth-child(2) {
        overflow-y: auto;
        max-height: 100%;
      }
    }
  }
  .player-info {
    display: flex;
    flex: 1;
    flex-direction: column;
    .character-image-wrapper {
      border-radius: 10%;
      overflow: hidden;
      max-height: 20px;
      display: inline-block !important;
      max-height: 24px !important;
      min-height: 24px !important;
      height: 24px !important;
      width: 24px !important;
      max-width: 24px !important;
      min-width: 24px !important;
    }
    &.your-info {
    }
  }
  .opponent-info {
    justify-self: flex-end;
    .character-image-wrapper {
      transform: scaleX(-1);
    }
  }
}

.history-info-section {
  flex: 1;
  max-height: 100%;
  overflow: hidden;
}

.record-rank-container {
  border-radius: 8px;
  height: 100%;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  min-height: auto;
  margin-bottom: 20px;
  .match-info {
    min-height: 100%;
    min-height: 100%;
    height: 100%;
  }
  > .match-info {
    min-height: auto;
    flex: 0 1 auto !important;
  }
  > .right-side-wrapper {
    width: 100%;
    overflow-y: auto;
    flex: 1 1 auto !important;
    .notes-section {
      &.collapsed {
        overflow: hidden !important;
      }
      :deep(h3) {
        margin: 0px;
        font-size: 12px
      }
      &:not(.collapsed) {
        overflow-y: auto;
        :deep(.notes-wrapper) {
          overflow-y: auto;
          .notes-list-wrapper {
            overflow-y: auto;
            overflow-x: hidden;
          }
        }
      }
    }
  }
}

.header {
    margin: 20px;
}

.player-names {
  display: flex;
  flex-direction: column;
  align-items: baseline;
  height: 40px;
  position: relative;
  &:not(.opponent) {
    margin-left: 5px;
  }
  &.opponent {
    margin-right: 5px;
    align-items: flex-end;
  }
  .code {
    margin: 0px;
    margin-top: 10px;
    padding: 0px;
  }
  .nickname {
    text-wrap: nowrap;
    top: 26px;
    margin: 0px;
    margin-top: 3px;
    font-size: 10px;
    position: absolute;
    bottom: 0px;
  }
}


.right-side-wrapper {
  display: flex;
  flex-direction: column;
  flex: 2;
  height: calc(100%);
  max-height: calc(100% );
  .notes-section {
    overflow-y: auto;
    .notes-wrapper {
      overflow-y: auto;
      :deep(.notes-wrapper) {
        overflow-y: auto;
        .notes-list-wrapper {
          overflow-y: auto;
          overflow-x: hidden;
        }
      }
    }
  }
  
}
.rank-info-container {
  height: 50%;
  max-height: 50%;
  min-height: 50%;
  display: flex;
  flex-direction: row;
  flex: 2;
  > div {
    width: 50%;
    &:nth-child(2) {
      width: calc(50% - 20px);
      margin-left: 20px;
    }
  }
  &.shrink-height {
    height: 200px;
    max-height: 200px;
    min-height: 200px;
  }
  &.no-rank-info {
    > div {
      width: 100%;
    }
  }
}

.rank-info {
  > div {
    width: 100%;
    height: 100%;
    display: flex;
  }
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  min-height: 100%;
  max-height: 100%;
  
}

.no-ranked-history, .no-active-rank, .no-other-ranks {
  display: flex;
  align-items: center;
  width: 100%;
  background-color: var(--card-background-color);
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.5);
  flex-direction: column;
  justify-content: center;
  align-content: center;
  text-align: center;
  max-height: 200px;
  > p {
    margin-right: 20px;
    margin-left: 20px;
  }
}

.rank-icon {
  width: 50px;
  margin-left: 10px;
}

.card {
  background-color: var(--card-background-color);
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.5);
  padding: 20px;
  text-align: center;
  color: var(--text-color);
  ul {
    margin: 0px;
    flex-wrap: wrap;
    display: flex;
    li {
      margin: 2px;
      max-width: 40px;
      min-width: 40px;
      list-style-type: none;
      color: var(--text-color);
      display: flex;
      list-style-type: none;
      color: var(--text-color);
      flex-direction: column;
      align-items: center;
    }
  }
}

.stage-section {
  max-width: 80px;
  min-width: 80px;
  width: 80px;
}

.active-rank {
  width: 100%;
  // border: 2px solid var(--highlight-blue);
}

.rank-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
  max-height: 100%;
  height: 100%;
  overflow-y: auto;
}

.rank-cards {
  .card.small-card {
    flex: 1 1 200px;
    display: flex;
    flex-direction: row;
    max-width: 200px;
    max-height: 200px;
    padding: 10px;
    font-size: 0.8em;
    overflow: hidden;
    .rank-data, .character-data {
      display: flex;
      align-items: baseline;
      flex-direction: column;
      max-height: 100%;
      max-width: 50%;
      width: 50%;
      h4 {
        padding: 0px;
        margin: 0px;
      }
      p {
        padding: 0px;
        margin: 0px;
      }
      ul {
        display: flex;
      }
    }
    p {
      &:first {
        font-size: 6px;
      }
    }
    img {
      width: 25px;
    }
  }
} 
.player-info {
  max-width: calc(50% - 40px) !important; 
  flex-direction: row !important;
  &.opponent-info {
    flex-direction: row-reverse !important;
  }
}

@media (max-width: 500px) {
  
  .match-info-section {
    width: 100%;
    max-width: 100% !important;
  }


  .match-info-section.history-info-section {
    align-items: center;
    .history-display {
      max-height: 100%;
      > div {
        align-items: center;
      }
    }
  }
  
  .history-info-section {
    flex: 1;
    max-height: 100%;
    overflow: unset;
  }
  
  .match-info-section {
    :deep(.history-display) {
      h3 {
        font-size: .7em;
      }
    }
  }

  .stage-section {
    p {
      display: none;
    }
  }

}

@media (max-width: 390px) {
  .player-names {
    p.code {
      font-size: 14px !important;
    }
  }
  .stage-section {
    :deep() {
      img {
        transform: scale(.9);
      }
    }
  }
}


@media (max-width: 370px) {
  .stage-section {
    :deep() {
      img {
        transform: scale(.8);
      }
    }
  }
}


@media (max-width: 350px) {
  .player-names {
    p.code {
      font-size: 12px !important;
    }
    .nickname {
      top: 21px;
    }
  }
  .stage-section {
    :deep() {
      img {
        transform: scale(.7);
      }
    }
  }
}


@media (max-width: 335px) {
  .stage-section {
    :deep() {
      img {
        transform: scale(.65);
      }
    }
  }
}


@media (max-width: 320px) {
  .player-names {
    p.code {
      font-size: 10px !important;
    }
  }
  .stage-section {
    :deep() {
      img {
        transform: scale(.6);
      }
    }
  }
  
}

@media (max-width: 300px) {
  .player-names {
    p.code {
      font-size: 10px !important;
    }
  }
  .stage-section {
    :deep() {
      img {
        transform: scale(0);
      }
    }
  }
}

@media (max-width: 260px) {
  .loaded-state {
    padding-left: 0px;
    padding-right: 0px;
    width: 100%;
    height:100%;
    min-width:100%;
    min-height:100%;
    max-width:100%;
    max-height:100%;
  }
  .stage-section {
    :deep() {
      img {
        transform: scale(0);
      }
    }
  }
}


</style>