<template>
  <div class="loaded-state">
    <div class="record-rank-container">
      <div class="match-info-outer">
        <div class="match-info">
          <div class="match-info-section player-info-section">
            <div class="player-info your-info">
              <div class="character-image-wrapper large">
                <CharacterSelectImage 
                  :characterName="match.yourCharacterName"
                  :characterColor="match.yourCharacterColor"
                />
              </div>
              <div class="character-image-wrapper small">
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
              <div class="character-image-wrapper large">
                <CharacterSelectImage 
                  :characterName="match.opponentCharacterName"
                  :characterColor="match.opponentCharacterColor"
                />
              </div>
              <div class="character-image-wrapper small">
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
              :collapsable="false"
            />
            <div
              v-else
            >
              Loading history...
            </div>
          </div>
        </div>
      </div>
 
      <div class="right-side-wrapper">

        <div class="rank-info-container"
          :class="{
            collapsed: !showPlayerRanks
          }"
        >
          <div class="header-wrapper">
            <h3> Opponent Ranks ({{ latestRanks.length }}) </h3>
            <button @click="() => toggleSettingFlag('showPlayerRanks')"> {{ showPlayerRanks ? 'hide' : 'show' }} </button>    
            <button
              v-if="showPlayerRanks"
              :title="fetchedRanksAt ? `Last refreshed at ${formattedFetchedRankDate}` : 'Refreshing ranks...'"
              :disabled="isLoadingPlayer || isRefreshingRanks"
              @click="() => handleRefreshRanks()">
                {{ isRefreshingRanks ? 'Refreshing...' : 'Refresh' }}
            </button>
          </div>
        
          <div v-if="hasNoRankedHistory && showPlayerRanks"
          class="card"
          :style="{ height: '30px', display: 'flex', justifyContent: 'center', alignItems: 'center' }"
          >
            <div v-if="isLoadingPlayer">
              Loading Player Info...
            </div>
            <div v-else-if="isRefreshingRanks">
              Refreshing ranks...
            </div>
            <div v-else
            >
              <div>
                No Ranked Info
              </div>
              <div :style="{fontSize: '10px', paddingTop: '5px'}">
                {{ `Last refresh: ${formattedFetchedRankDate}`}}
              </div>
            </div>
          </div>

          <div v-else-if="showPlayerRanks" class="ranks">
            <div v-if="rankDuringMatch" class="card during-match-rank-card"
              title="Rank at the time of playing"
            >
              <div class="rank-data">
                <h4 class="during-match"> {{ rankDuringMatch!.seasonName }} </h4>
                <div class="rank-data-stats">
                  <div class="rank-data-stat-item"
                  >
                    <div class="rank-icon-container">
                      <img class="rank-icon" :src="getRankIcon(rankDuringMatch)">
                      <div>
                        <p> {{ getRankFromElo(rankDuringMatch!.elo, rankDuringMatch!.regionalPlacement as number) }}</p>
                        <p> {{ rankDuringMatch!.elo.toFixed(2) }}</p>
                      </div>
                    </div>
                    <p>W-L {{  rankDuringMatch!.wins || 0  }}-{{ rankDuringMatch!.losses || 0 }}</p>
                  </div>
                </div>
                
              </div>
              <div class="character-data">
                  <div v-for="(character, charIdx) in rankDuringMatch!.characters" :key="character.name"
                    class="player-character"
                    :class="`character-${charIdx}`"
                  >
                    <CharacterStockIcon 
                      :totalPercentage="getCharacterPercentage(character, rankDuringMatch)"
                      :scale=".6"
                      :characterName="character.name"
                      :characterColor="0"
                    />
                </div>
              </div>
            </div>
            <div v-for="(rank, i) in latestRanks" class="card"
              :class="{'active-season-rank-card': rank?.wasActiveSeason}"
              :title="rank?.wasActiveSeason ? `Current season rank updated on ${formattedFetchedRankDate}` : 'Rank from a previous season'"
            >
              <template v-if="!!rank"> 
                <div class="rank-data">
                  <h4> {{ rank!.seasonName }} </h4>
                  <div class="rank-data-stats">
                    <div class="rank-data-stat-item"
                      :title="fetchedRanksAt ? `Rank refreshed at ${formattedFetchedRankDate}` : 'Refreshing ranks...'"
                    >
                      <div class="rank-icon-container">
                        <img class="rank-icon" :src="getRankIcon(rank)">
                        <div>
                          <p> {{ getRankFromElo(rank!.elo, rank!.regionalPlacement as number) }}</p>
                          <p> {{ rank!.elo.toFixed(2) }}</p>
                        </div>
                      </div>
                      <p>W-L {{  rank!.wins || 0  }}-{{ rank!.losses || 0 }}</p>
                    </div>
                  </div>
                  
                </div>
                <div class="character-data">
                    <div v-for="(character, charIdx) in rank!.characters" :key="character.name"
                      class="player-character"
                      :class="`character-${charIdx}`"
                    >
                      <CharacterStockIcon 
                        :totalPercentage="getCharacterPercentage(character, rank)"
                        :scale=".6"
                        :characterName="character.name"
                        :characterColor="0"
                      />
                  </div>
                </div>
              </template>
              <template v-else>
                <div class="rank-data">
                  <h4> No Season Info</h4>
                  <p></p>
                  <span></span>
                  <p></p>
                  <img class="rank-icon" :src="noRankIconPath">
                </div>
              </template>
            </div>
          </div>
        </div>
      
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
import { defineComponent,} from 'vue';
import { getRankIconFromElo, getRankFromElo, hasValidRank, jsonCopy, getCharacterPercentage, getMostPlayedCharacterAndPercentFromRank} from '@slippiops/utils';
import CharacterSelectImage from '@/components/CharacterSelectImage.vue';
import CharacterStockIcon from '@/components/icons/CharacterStockIcon.vue';
import StageSelectImage from '@/components/StageSelectImage.vue';
import HistoryDisplayList from '@/components/HistoryDisplayList.vue';
import Notes from '@/components/Notes.vue';
import LiveCharacterNotes from '@/components/LiveCharacterNotes.vue';
import matchDisplayPropsMixin from './matchDisplayPropsMixin';

export default defineComponent({
  name: 'MatchDisplayLarge',
  mixins: [matchDisplayPropsMixin],
  components: {
    LiveCharacterNotes,
    Notes,
    HistoryDisplayList,
    StageSelectImage,
    CharacterSelectImage,
    CharacterStockIcon
  },
});
</script>

<style scoped lang="scss">
@import "@/scss/mixins.scss";
@import "@/scss/variables.scss";

.rank-display-toggle {
  position: absolute;
  top: 10px;
  right: 17%;
  display: flex;
  flex-direction: row;
  align-items: center;
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
.notes-section {
  display: flex;
  flex-direction: column-reverse;
  justify-content: flex-end;
  height: 100%;
  flex: 1;
  :deep(.notes-container) {
    margin-top: 0px;
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
  width: calc(100% - 40px);
  height: calc(100% - 40px);
  min-width: calc(100% - 40px);
  min-height: calc(100% - 40px);
  max-width: calc(100% - 40px);
  max-height: calc(100% - 40px);
  overflow: hidden;
  font-family: Arial, sans-serif;
  color: var(--text-color);
  padding: 20px;
  background-color: var(--background-color);
}
.match-info-outer {
  max-height: 100%;
  display: flex;
  width: 100%;
  flex-direction: row;
  flex: 1;
  max-width: 350px;
  margin-right: 25px;
  margin-bottom: 20px;
  margin-bottom: 20px;
  > .match-info {
    overflow: hidden;
    height: auto !important;
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
      &.small {
        display: none;
      }
      max-height: 120px;
      border-radius: 10%;
      overflow: hidden;
    }
    &.your-info {
      .character-image-wrapper.large {
        transform: scaleX(-1)
      }
    }
  }
  .opponent-info {
    .character-image-wrapper.small {
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
  min-height: 300px;
  height: 100%;
  max-height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  .match-info {
    min-height: 100%;
    height: 100%;
    max-height: 100%;
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
    margin: 0px;
    font-size: 10px;
    position: absolute;
    bottom: 0px;
  }
}


.right-side-wrapper {
  display: flex;
  flex-direction: column;
  flex: 2;
  height: calc(100% - 30px);
  max-height: calc(100% - 30px);
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
  max-width: 100%;
  h3 {
    padding-left: 10px;
  }
  &.collapsed {
    height: auto;
  }
  &.no-rank-info, .hide-rank-info {
    font-size: 10px;
    height: 12px;
    max-height: 12px;
  }
}

.ranks {
  gap: 5px;
  > div {
    width: 100%;
    height: 100%;
    display: flex;
  }
  .card {
    display: flex;
    flex-direction: column;
    max-width: 144px;
    min-width: 124px;
  }
  display: flex;
  flex-wrap: nowrap;
  flex-direction: row;
  justify-content: baseline;
  height: 140px;
  min-height: 140px;
  max-width: 100%;
}

.rank-icon {
  width: 30px;
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
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    overflow-x: auto;
    gap: 0;
    padding: 0px;
    li {
      margin: 2px;
      width: 50%;
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
.during-match-rank-card {
  @include inner-outline(1px, $highlight-blue);
}
.active-season-rank-card {
  @include inner-outline(1px, $highlight-yellow);
}
.character-data {
  min-height: 70px;
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  > div.player-character {
    position: absolute;
    display: inline-block;
    &.character-0, &.character-1, &.character-2, &.character-3 {
      top: 0px;
    }
    &.character-4, &.character-5, &.character-6, &.character-7 {
      top: 30px;
    }

    &.character-0, &.character-4 {
      left: -6px;
    }
    
    &.character-1, &.character-5 {
      left: calc(25% - 6px);
    }
 
    
    &.character-2, &.character-6 {
      left: calc(50% - 6px);
    }
 
    &.character-3, &.character-7 {
      left: calc(75% - 6px);
    }
 
    width: 25%;
    img {
      top: 0px;
      left: 0px;
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
  display: flex;
  flex-direction: row;
  gap: 1px;
  max-height: 100%;
  height: 100%;
  overflow-y: auto;
}
.ranks {
  .card {
    margin: 0px;
    padding: 0px;
  }
}
.rank-data {
  .rank-data-stats {
    display: flex;
  }
  .during-match {
    color: var(--highlight-blue);
  }
  .rank-icon-container {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: 5px;
  }
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  h4 {
    margin: 5px;
    font-size: 12px;
  }
  p {
    font-size: 10px;
    margin: 1px;
  }
  img {

  }
}

.rank-cards {
  .character-data {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0px;
  }
  .card.small-card {
    flex: 1 1 200px;
    display: flex;
    flex-direction: row;
    max-width: 200px;
    max-height: 200px;
    padding: 10px;
    font-size: 0.8em;
    overflow: hidden;
    .rank-data {
      align-items: flex-start;
      display: flex;
      flex-direction: column;
    }
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

/*
.rank-info-container {
  .ranks {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
  }
}*/

</style>