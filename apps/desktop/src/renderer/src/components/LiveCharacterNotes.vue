<template>
 <div class="notes-wrapper character-notes">
  <div class="notes-header" :class="{'only-show-notes': settingsStore.showOnlyCharacterNotes}">
    <h3> Character Notes ({{notes.length}}) </h3>
    <button class="primary" :style="{marginRight: '6px'}" @click="() => settingsStore.setStateValue('showCharacterNotes', !settingsStore.showCharacterNotes)"> {{ settingsStore.showCharacterNotes ? 'hide' : 'show' }} </button>
    <CurrentMatchOptionToggle
      label="Only show character notes?"
      :value="settingsStore.showOnlyCharacterNotes"
      @input="settingsStore.setStateValue('showOnlyCharacterNotes', !settingsStore.showOnlyCharacterNotes)"
    />
  </div>
    <div class="notes-list-wrapper"
      v-if="showCharacterNotes"
    >
      <CharacterNoteDisplay v-for="note in notes" :key="note.id" :note="note" />
    </div>
  </div>
</template>

<script lang="ts">
import { computed, type PropType } from 'vue';
import { isNullOrUndefined } from '@slippiops/utils';
import PercentDisplay from '@/components/PercentDisplay.vue';
import StageIcon from '@/components/icons/StageIcon.vue';
import PercentIcon from '@/components/icons/PercentIcon.vue';
import CharacterStockIcon from '@/components/icons/CharacterStockIcon.vue';
import CharacterStockIconWithPercentIcon from '@/components/icons/CharacterStockIconWithPercentIcon.vue';
import { LiveCharacterNote } from '@slippiops/types';
import CharacterNoteDisplay from './CharacterNoteDisplay.vue';
import Toggle from '@vueform/toggle'
import { useSettingsStore } from '@/store';
import CurrentMatchOptionToggle from './CurrentMatchOptionToggle.vue';
export default {
  components: {
    Toggle,
    CharacterNoteDisplay,
    PercentDisplay,
    PercentIcon,
    StageIcon,
    CharacterStockIcon,
    CurrentMatchOptionToggle,
    CharacterStockIconWithPercentIcon
  },
  methods: {
    isNullOrUndefined
  },
  setup() {
    const settingsStore = useSettingsStore();
    const showCharacterNotes = computed(() => settingsStore.showCharacterNotes);
    
    return {
      showCharacterNotes,
      settingsStore,
    }
  },
  props: {
    notes: {
      type: Array as PropType<LiveCharacterNote[]>,
      required: true,
    },
  },
}
</script>

<style lang="scss" scoped>

@mixin flash($flash-color, $default-color, $duration: .7s, $identifier) {
  @keyframes flash-#{$identifier} {
    0% {
      background-color: $flash-color; /* Flash color */
    }
    50% {
      background-color: $default-color; /* Return to normal background */
    }
    100% {
      background-color: $default-color; /* Ensure it stays at normal background */
    }
  }
  animation: flash-#{$identifier} $duration ease-in-out;
}


.notes-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  &.character-notes {
    max-height: 100%;
    overflow-y: auto;
  }
  .notes-header {
    display: flex;
    flex-direction: row;
    align-items: center;

   

    > div {
      padding-left: 10px;
      align-items: center;
      display: flex;
      >p {
        font-size: 12px;
        padding-right: 10px;
      }
    }

    &.only-show-notes {
      > div {
        flex-direction: row;
      }
    }
    h3 {
      margin: 5px;
    }
  }
  .only-show-toggle-wrapper {
    background-color: rgb(73, 71, 71);
    padding-left: 5px;
    padding-right: 5px;
    border-radius: 10px;
  }
 
  .notes-list-wrapper {
    overflow-y: auto;
    overflow-x: hidden;
  }
}
</style>