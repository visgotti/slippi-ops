<template>
  <div v-if="showOnlyCharacterNotes"
    class="character-notes-only-wrapper"
  >
    <LiveCharacterNotes
      :notes="percentFilteredCharacterNotes"
    />
  </div>
  <component
    v-else
    :isRefreshingRanks="isRefreshingRanks"
    :fetchedRanksAt="fetchedRanksAt"
    :isLoadingPlayer="isLoadingPlayer" 
    :persistedRanks="persistedRanks"
    :handleRefreshRanks="handleRefreshRanks"
    :loadedPlayer="loadedPlayer"
    :is="computedComponent"
    :history="history"
    :match="match"
    :isCurrentMatch="isCurrentMatch"
    :getMostPlayedCharacterAndPercentFromRank="getMostPlayedCharacterAndPercentFromRank"
    :getRankTooltip="getRankTooltip"
    :windowWidth="windowWidth"
    :percentFilteredCharacterNotes="percentFilteredCharacterNotes"
    :onEditNote="onEditNote"
    :onAddNote="onAddNote"
    :onDeleteNote="onDeleteNote"
    :disableNoteEditing="disableNoteEditing"
    :stats="stats"
    :loadingStats="loadingStats"
    :latestMatch="latestMatch"
    :isAddingNote="isAddingNote"
    :editingNoteIndex="editingNoteIndex"
    :localNoteText="localNoteText"
    :allNotes="allNotes"
    :getRankFromElo="getRankFromElo"
    :getRankIconFromElo="getRankIconFromElo"
    :hasNoRankedHistory="hasNoRankedHistory"
    :rankDuringMatch="rankDuringMatch"
    :latestRanks="latestRanks"
    :getCharacterPercentage="getCharacterPercentage"
  />
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, toRefs, onMounted } from 'vue';
import { Player, PlayerNote, type PlayerGameResults, type PlayerRank } from '@slippiops/types';
import { getRankIconFromElo, getRankFromElo, hasValidRank, jsonCopy, getCharacterPercentage, getMostPlayedCharacterAndPercentFromRank, formatLiveCharacterNote} from '@slippiops/utils';
import { useTrackerStore, useSettingsStore } from '@/store';
import { useWindowResize, useGlobals } from '@/composables';
import MatchDisplaySmall from './MatchDisplaySmall.vue';
import MatchDisplayLarge from './MatchDisplayLarge.vue';
import LiveCharacterNotes from '@/components/LiveCharacterNotes.vue';
export default defineComponent({
  name: 'MatchDisplay',
  components: {
    LiveCharacterNotes,
    MatchDisplaySmall,
    MatchDisplayLarge
  },
  props: {
    isCurrentMatch: {
      type: Boolean,
      default: false
    },
    match: {
      type: Object as () => PlayerGameResults,
      required: true
    },
  },
  setup(props) {
    const settingsStore = useSettingsStore();
    const trackerStore = useTrackerStore();
    const { $getPlayerRanks, $getPlayerResults, $getPlayerNotes, $createPlayerNote, $updatePlayerNote, $deletePlayerNote, $refreshPlayerRanks, $getPlayer, $upsertPlayer, $disablePercentCheckForCurrentGame } = useGlobals();
    const { match, isCurrentMatch } = toRefs(props);

    const yk = computed(() => settingsStore.yk);
    const showOnlyCharacterNotes = computed(() => settingsStore.showOnlyCharacterNotes);
    const editingNoteIndex = ref(-1);
    const isAddingNote = ref(false);
    const localNoteText = ref('');
    const { width: windowWidth } = useWindowResize();

    const useVerticalDisplay = computed(() => windowWidth.value < 700);
    const queriedHistoy = ref<PlayerGameResults[]>([]);

    const refreshQueriedHistory = (force=false) => {
      if(force || trackerStore.lastQueriedHistoryOpponentId !== match.value.opponentUserId) {
        $getPlayerResults(match.value.opponentUserId).then(results => {
          queriedHistoy.value = results;
          trackerStore.setLastQueriedHistory(match.value.opponentUserId, results);
        });
      } else {
        queriedHistoy.value = trackerStore.lastQueriedHistoryOpponentHistory;
      }
    }
    onMounted(() => {
      refreshQueriedHistory(true);
    });
    watch([isCurrentMatch, match], () => {
       refreshQueriedHistory(true);
    });

    const opponentPercent = computed(() => trackerStore.opponentPercent);
    const yourPercent = computed(() => trackerStore.yourPercent);

    const loadingStats = ref(!isCurrentMatch.value);
    const stats = ref({});
   
    const latestMatch = computed<PlayerGameResults>(() => {
      if(match.value) {
        return match.value;
      }
      if(queriedHistoy.value?.length) {
        return queriedHistoy.value[queriedHistoy.value.length-1];
      }
      throw new Error(`Expected at least one match.`);
    });
    
    const opponentUserId = computed(() => {
      return latestMatch?.value.opponentUserId;
    });

    const rankDuringMatch = computed(() => {
      if (!match.value.opponentRanks) return null;
      const r = match.value.opponentRanks?.find(rank => rank.wasActiveSeason);
      if(r && hasValidRank(r)) {
        const copiedRank = {
          ...jsonCopy(r),
          mostPlayed: getMostPlayedCharacterAndPercentFromRank(r),
        }
        copiedRank.mostPlayed = getMostPlayedCharacterAndPercentFromRank(copiedRank);
        copiedRank.characters.sort((a: {name: string, gameCount: number }, b: { name: string, gameCount: number }) => b.gameCount - a.gameCount)
        copiedRank.characters = r.characters.slice(0, 8);
        return copiedRank;
      }
      return null;
    });

    const latestRanks = computed(() => {
      const ranks = jsonCopy(persistedRanks.value) as PlayerRank[];
      
      match.value.opponentRanks?.forEach(rank => {
        if(rank.wasActiveSeason) return;
        const foundAlready = ranks.find(r => r.seasonName === rank.seasonName);
        if(!foundAlready || (!hasValidRank(foundAlready) && hasValidRank(rank))) {
          if(foundAlready) {
            const idx = ranks.indexOf(foundAlready);
            ranks[idx] = jsonCopy(rank);
          } else {
            ranks.push(jsonCopy(rank));
          }
        }
      });
      ranks.sort((a, b) => {
        const aDate = new Date(a.seasonDateStart).getTime();
        const bDate = new Date(b.seasonDateStart).getTime();
        return bDate - aDate;
      });
     
      return (ranks.map(r => {
        const mostPlayed = getMostPlayedCharacterAndPercentFromRank(r);
        r.characters.sort((a: {name: string, gameCount: number }, b: { name: string, gameCount: number }) => b.gameCount - a.gameCount)
        r.characters = r.characters.slice(0, 8);
        return {
          ...r,
          mostPlayed,
        }
      }).filter(hasValidRank))
    });

    const allMatches = computed(() => {
      const finalHistory = queriedHistoy.value ? [...queriedHistoy.value] : [];
      if(match.value) {
        const included = finalHistory.some(v => v.startAt === match.value.startAt);
        if(!included) {
          return [match.value, ...finalHistory]
        }
      }
      return finalHistory;
    });

    const disableNoteEditing = computed(() => allMatches.value.every(m => !('id' in m)));
    const allNotes = computed(() => trackerStore.playerNotes);
 

    const onAddNote = async (noteContent: string) => {
      const newNote : PlayerNote = {
        id: -Date.now(),
        userId: opponentUserId.value,
        content: noteContent,
      };
      trackerStore.addPlayerNote(newNote);
      const saved = await $createPlayerNote(opponentUserId.value, newNote.content);
      trackerStore.removePlayerNote(newNote);
      trackerStore.addPlayerNote({
        ...newNote,
        id: saved.id
      });
    };

    const onEditNote = ({ note }: { index: number, note: PlayerNote }) => {
      trackerStore.updatePlayerNote(note);
      $updatePlayerNote(note.id, note.content);
    };

    const onDeleteNote = ({ note }: { index: number, note: PlayerNote }) => {
      trackerStore.removePlayerNote(note);
      $deletePlayerNote(note.id);
    };

    const opponentCharacterId = computed(() => latestMatch.value?.opponentCharacter ?? -1);
    const characterNotes = computed(() => trackerStore.characterNotes || {});
    const opponentCharacterNotes = computed(() => characterNotes.value[opponentCharacterId.value] ?? []);

    const filteredNotesForCharacterAndStage = computed(() => {
      const filtered = opponentCharacterNotes.value.filter(note => {
        return !note.stageIds?.length || note.stageIds.includes(latestMatch.value.stageId);
      }).filter(note => {
        const keep = !note.yourCharacterIds?.length || note.yourCharacterIds.includes(latestMatch.value.yourCharacter);
        return keep;
      }).map(formatLiveCharacterNote);
      filtered.sort((a, b) => {
        const aStageMatch = !!a.stageIds?.length;
        const bStageMatch = !!b.stageIds?.length;

        if(isCurrentMatch.value) {
          if(aStageMatch && !bStageMatch) {
            return -1;
          } else if(!aStageMatch && bStageMatch) {
            return 1;
          }
        }

        const aOpponentPercent = !!a.opponentPercentConditionType;
        const bOpponentPercent = !!b.opponentPercentConditionType;

        const aYourPercent = !!a.yourPercentConditionType;
        const bYourPercent = !!b.yourPercentConditionType;

        // Sort logic:
        // 1. Items with both percent conditions and a stageId matching the current stage
        // 2. Items with opponent percent condition and a stageId matching the current stage
        // 3. Items with your percent condition and a stageId matching the current stage
        // 4. Items with both percent conditions but no stageId matching
        // 5. Items with opponent percent condition but no stageId matching
        // 6. Items with your percent condition but no stageId matching
        // 7. Items with stageId matching the current stage but no percent condition
        // 8. Remaining items
        if (aOpponentPercent && aYourPercent && aStageMatch && !(bOpponentPercent && bYourPercent && bStageMatch)) {
          return -1;
        } else if (!(aOpponentPercent && aYourPercent && aStageMatch) && bOpponentPercent && bYourPercent && bStageMatch) {
          return 1;
        } else if (aOpponentPercent && aStageMatch && !(bOpponentPercent && bStageMatch)) {
          return -1;
        } else if (!(aOpponentPercent && aStageMatch) && bOpponentPercent && bStageMatch) {
          return 1;
        } else if (aYourPercent && aStageMatch && !(bYourPercent && bStageMatch)) {
          return -1;
        } else if (!(aYourPercent && aStageMatch) && bYourPercent && bStageMatch) {
          return 1;
        } else if (aOpponentPercent && !(bOpponentPercent)) {
          return -1;
        } else if (!(aOpponentPercent) && bOpponentPercent) {
          return 1;
        } else if (aYourPercent && !(bYourPercent)) {
          return -1;
        } else if (!(aYourPercent) && bYourPercent) {
          return 1;
        } else if (aStageMatch && !(bStageMatch)) {
          return -1;
        } else if (!(aStageMatch) && bStageMatch) {
          return 1;
        } else {
          return 0;
        }
      });
      return filtered;
    });

    const shouldShowForPercent = (type: string, currentPercent: number, percentStart?: number | null, percentEnd?: number | null) => {
      if(!type) return true;
      switch(type) {
        case 'between':
          return currentPercent >= percentStart! && currentPercent <= percentEnd!;
        case 'greater':
          return currentPercent >= percentStart!;
        case 'less':
          return currentPercent <= percentEnd!;
      }
      return false;
    }

    const doPercentChecks = computed(() => settingsStore.doLivePercentChecks);
    const matchStartAt = computed(() => latestMatch.value?.startAt);

    watch([filteredNotesForCharacterAndStage, isCurrentMatch, matchStartAt, doPercentChecks], () => {
      if(!isCurrentMatch.value) return;
      if(!doPercentChecks.value) {
        $disablePercentCheckForCurrentGame()
        return;
      }
      const hasAnyPercentNotes = filteredNotesForCharacterAndStage.value.some(v => !!v.opponentPercentConditionType || !!v.yourPercentConditionType);
      if(!hasAnyPercentNotes) {
        $disablePercentCheckForCurrentGame()
      } // no need to re-anble since it will be enabled by default
    });


    const percentFilteredCharacterNotes = computed(() => {
      if(!isCurrentMatch.value) {
        return [...filteredNotesForCharacterAndStage.value];
      }
      return filteredNotesForCharacterAndStage.value.filter(v => {
        let fitsOpponentPercentCondition = shouldShowForPercent(v.opponentPercentConditionType, opponentPercent.value, v.opponentPercentStart, v.opponentPercentEnd);
        if(!fitsOpponentPercentCondition) {
          return false;
        }
        return shouldShowForPercent(v.yourPercentConditionType, yourPercent.value, v.yourPercentStart, v.yourPercentEnd);
      });
    });
   
    const getRankTooltip = (rank?: PlayerRank | null) => {
      if(rank) {
        const parts = [
          `Season: ${rank.seasonName}`,
          `Rating: ${rank.elo.toFixed(2)}`,
          `Wins: ${rank.wins}`,
          `Losses: ${rank.losses}`,
        ]
        return parts.join('\n')
      }
      return 'No rank available';
    }

    const computedComponent = computed(() => useVerticalDisplay.value ? MatchDisplaySmall : MatchDisplayLarge)
    
    const isLoadingPlayer = ref(true);
    const persistedRanks = ref<PlayerRank[]>([]);
    const loadedPlayer = ref<Player | null>(null);

    const isRefreshingRanks = ref(false);
    const handleRefreshRanks = async () => {
      if(isRefreshingRanks.value) return;
      isRefreshingRanks.value = true;
      persistedRanks.value = await $refreshPlayerRanks(opponentUserId.value);
      loadedPlayer.value = await $getPlayer(opponentUserId.value);
      isRefreshingRanks.value = false;
    }

    const handleGetRanks = async () => {
      if(isRefreshingRanks.value) return;
      isRefreshingRanks.value = true;
      persistedRanks.value = await $getPlayerRanks(opponentUserId.value);
      isRefreshingRanks.value = false;
    }
    
    const handleRefreshPlayerData = () => {
      loadedPlayer.value = null;
      persistedRanks.value = [];
      isLoadingPlayer.value = true;
      $getPlayerNotes(opponentUserId.value).then(notes => {
          trackerStore.setPlayerNotes(notes);
      });
      $getPlayer(opponentUserId.value).then(async (player) => {
        if(!player) {
          loadedPlayer.value = {
            id: opponentUserId.value,
            fetchedRanksAt: null,
          }
          $upsertPlayer(loadedPlayer.value).then(() => {
            handleRefreshRanks();
          });
          return;
        } else {
          loadedPlayer.value = player;
          if(player.fetchedRanksAt) {
            handleGetRanks();
          } else {
            handleRefreshRanks();
          }
        }
      }).finally(() => {
        isLoadingPlayer.value = false;
      });
    }

    watch(opponentUserId, (newValue) => {
      if(newValue) {
        handleRefreshPlayerData();
      }
    });
 
    if(opponentUserId.value) {
      handleRefreshPlayerData();
    }
    
    const hasNoRankedHistory = computed(() => {
      return !rankDuringMatch.value && !latestRanks.value.length;
    });

    const fetchedRanksAt = computed<number>(() => {
      if(loadedPlayer.value?.fetchedRanksAt !== null) {
        return Number(loadedPlayer.value?.fetchedRanksAt);
      }
      return 0;
    });

    return {
      showOnlyCharacterNotes,
      fetchedRanksAt,
      isLoadingPlayer,
      persistedRanks,
      handleRefreshRanks,
      loadedPlayer,
      isRefreshingRanks,
      computedComponent,
      getMostPlayedCharacterAndPercentFromRank,
      getRankTooltip,
      windowWidth,
      percentFilteredCharacterNotes,
      // percentFilteredCharacterNotes,
      onEditNote,
      onAddNote,
      onDeleteNote,
      disableNoteEditing,
      stats,
      loadingStats,
      latestMatch,
      isAddingNote,
      editingNoteIndex,
      localNoteText,
      allNotes,
      history: queriedHistoy,
      match,
      getRankFromElo,
      getRankIconFromElo,
      hasNoRankedHistory,
      rankDuringMatch,
      latestRanks,
      getCharacterPercentage
    };
  }
});
</script>

<style scoped lang="scss">
.character-notes-only-wrapper {
  max-height: 100%;
  overflow-y: auto;
}
</style>