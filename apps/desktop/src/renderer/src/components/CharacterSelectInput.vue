<template>
  <div class="character-select-input"
    :class="{disabled}"
  >
    <div v-for="character in sortedCharacterArray"
      :key="character.id"
      @click="toggleCharacterSelection(character.id)"
      class="character-icon-container"
      :class="{ 'selected': isSelected(character.id), 'faded': !isSelected(character.id) }"
    >
      <CharacterStockIcon 
        :key="character.name"
        :title="character.name"
        :characterName="character.name"
        :characterColor="0"
      />
    </div>
    <button class="primary" :disabled="!modelValue.length" @click="clearSelection()">Clear</button>
    <button class="primary" :disabled="modelValue.length === characterArray.length" @click="selectAll()">Select All</button>
  </div>
</template>

<script lang="ts">
import { characterArray, tieredCharacterArray, } from '@slippiops/utils';
import CharacterStockIcon from '@/components/icons/CharacterStockIcon.vue';
import type { PropType } from 'vue';
export default {
  name: 'CharacterSelectInput',
  components: {
    CharacterStockIcon
  },
  props: {
    disabled: {
      type: Boolean,
      default: false
    },
    useTieredOrder: {
      type: Boolean,
      default: false
    },
    modelValue: {
      type: Array as PropType<number[]>,
      default: []
    }
  },
  data() {
    return {
      characterArray,
      tieredCharacterArray,
    }
  },
  computed: {
    sortedCharacterArray() {
      if (this.useTieredOrder) {
        return this.tieredCharacterArray
      } else {
        return this.characterArray
      }
    }
  },
  methods: {
    selectAll() {
      if(this.disabled) return;
      this.$emit('update:modelValue', this.characterArray.map(character => character.id));
    },
    clearSelection() {
      if(this.disabled) return;
      this.$emit('update:modelValue', []);
    },
    toggleCharacterSelection(characterId: number) {
      if(this.disabled) return;
      const index = this.modelValue.indexOf(characterId);
      if (index === -1) {
        this.$emit('update:modelValue', [...this.modelValue, characterId]);
      } else {
        this.$emit('update:modelValue', this.modelValue.filter((id: number) => id !== characterId));
      }
    },
    isSelected(characterId: number) {
      return this.modelValue.includes(characterId);
    }
  }
};
</script>

<style lang="scss" scoped>
.disabled {
  opacity: .3;
  cursor: not-allowed;
}
.character-select-input {
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  gap: 0.5rem;
  &:not(.disabled) {
    button {
      cursor: pointer;
    }
    .character-icon-container {
      cursor: pointer;
      transition: opacity 0.3s ease;
    }
  }
}

.character-icon-container.faded {
  opacity: 0.2;
}

.character-icon-container.selected {
  opacity: 1;
  img {
  display: inline-block;
  filter: drop-shadow(0 0 0px black) drop-shadow(0 0 5px white);
  }

}
</style>