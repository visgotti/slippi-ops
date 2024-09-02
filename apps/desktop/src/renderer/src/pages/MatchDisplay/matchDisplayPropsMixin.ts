import { LiveCharacterNote, Player, PlayerGameResults, PlayerNote, PlayerRank } from "@slippiops/types";
import { defineComponent, watch, computed, ref } from "vue";
import type { PropType } from "vue";
import { useTrackerStore, useSettingsStore } from '@/store';
import { mapActions, mapState, storeToRefs } from "pinia";
import { getRankIconFromElo } from "@slippiops/utils";

export default defineComponent({ 
 props: {
    fetchedRanksAt: {
      type: Number,
      default: 0,
    },
    handleRefreshRanks: {
      type: Function,
      required: true,
    },
    persistedRanks: {
      type: Array as () => PlayerRank[],
    },
    isRefreshingRanks: {
      type: Boolean,
      required: true,
    },
    isLoadingPlayer: {
      type: Boolean,
      required: true,
    },
    loadedPlayer: {
      type: Object as () => Player | null,
      default: null,
    },
    isCurrentMatch: {
      type: Boolean,
      default: false
    },
    history: {
      type: Object as () => PlayerGameResults[],
      required: false,
    },
    match: {
      type: Object as () => PlayerGameResults,
      required: true
    },
    getMostPlayedCharacterAndPercentFromRank: {
      type: Function,
      required: true
    },
    getRankTooltip: {
      type: Function,
      required: true
    },

    windowWidth: {
      type: Number,
      required: true
    },
    percentFilteredCharacterNotes: {
      type: Array as () => LiveCharacterNote[],
      required: true
    },
    onEditNote: {
      type: Function,
      required: true
    },
    onAddNote: {
      type: Function,
      required: true
    },
    onDeleteNote: {
      type: Function,
      required: true
    },
    disableNoteEditing: {
      type: Boolean,
      required: true
    },  
    stats: {
      type: Object,
      required: true
    },
    loadingStats: {
      type: Boolean,
      required: true
    },
    latestMatch: {
      type: Object as () => PlayerGameResults,
      required: true
    },
    isAddingNote: {
      type: Boolean,
      required: true
    },
    editingNoteIndex: {
      type: Number,
      required: true
    },
    localNoteText: {
      type: String,
      required: true
    },
    allNotes: {
      type: Array as PropType<PlayerNote[]>,
      required: true
    },
    getRankFromElo: {
      type: Function,
      required: true
    },
    getRankIconFromElo: {
      type: Function,
      required: true
    },
    hasNoRankedHistory: {
      type: Boolean,
      required: true
    },
    rankDuringMatch: {
      type: Object as () => (PlayerRank & { mostPlayed: { character: string, percentage: number } | null }) | null,
      required: false,
    },
    latestRanks: {
      type: Array as PropType<((PlayerRank & { mostPlayed: { character: string, percentage: number } | null }) | null)[]>,
      required: true
    },
    getCharacterPercentage: {
      type: Function,
      required: true
    }
  },
  methods: {
    ...mapActions(useTrackerStore, ['setViewingStats']),
    getRankIcon(rank: any) {
      return new URL(`../../public/assets/slippi-rank-icons/${getRankIconFromElo(rank!.elo, rank!.regionalPlacement)}`, import.meta.url).href;
    },
    toggleSettingFlag(flag: string) {
      const settingsStore = useSettingsStore();
      settingsStore.setStateValue(flag as any, !settingsStore[flag]);
    }
  },
  computed: {
    ...mapState(useSettingsStore, ['showPlayerNotes', 'showPlayerRanks', 'showMatchStats']),
    formattedFetchedRankDate() {
      return new Date(this.fetchedRanksAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },
    noRankIconPath() {
      return new URL(`../../public/assets/slippi-rank-icons/none.svg`, import.meta.url).href;
    }
  },
})