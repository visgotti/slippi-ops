<template>
  <div class="stage-select-input"
    :class="{disabled}"
  >
    <div v-for="stageId in legalStageIds"
      :title="legalStageIdsToNameLookup[stageId]"
      :key="stageId"
      @click="toggleStageSelection(stageId)"
      class="stage-icon-container"
      :class="{ 'selected': isSelected(stageId), 'faded': !isSelected(stageId) }"
      :style="{ transform: `scale(${scale})`}"
    >
      <StageSelectImage 
        :stageId="stageId"
      />
    </div>
    <button :disabled="!modelValue.length || disabled" @click="clearSelection()">Clear</button>
    <button :disabled="modelValue.length === legalStageIds.length || disabled" @click="selectAll()">Select All</button>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { legalStageIds, legalStageIdsToNameLookup } from '@slippiops/utils';
import StageSelectImage from './StageSelectImage.vue';
export default {
  name: 'StageSelectInput',
  components: {
    StageSelectImage
  },
  props: {
    scale: {
      type: Number,
      default: 1
    },
    disabled: {
      type: Boolean,
      default: false
    },
    modelValue: {
      type: Array as PropType<number[]>,
      default: []
    }
  },
  data() : { legalStageIdsToNameLookup: Record<string, string>, legalStageIds: number[] } {
    return {
      legalStageIdsToNameLookup,
      legalStageIds,
    }
  },
  methods: {
    selectAll() {
      this.$emit('update:modelValue', this.legalStageIds);
    },
    clearSelection() {
      this.$emit('update:modelValue', []);
    },
    toggleStageSelection(stageId: number) {
      if(this.disabled) {
        return;
      }
      const index = this.modelValue.indexOf(stageId);
      if (index === -1) {
        this.$emit('update:modelValue', [...this.modelValue, stageId]);
      } else {
        this.$emit('update:modelValue', this.modelValue.filter(id => id !== stageId));
      }
    },
    isSelected(stageId: number) {
      return this.modelValue.includes(stageId);
    }
  }
};
</script>

<style lang="scss" scoped>
.disabled {
  opacity: 0.3;
  pointer-events: not-allowed;
}
.stage-select-input {
  &:not(.disabled) {
    button {
      cursor: pointer;
    }
    .stage-icon-container {
      cursor: pointer;
      transition: opacity 0.3s ease;
    }
  }  
}

.stage-select-input {
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  gap: 0.5rem;
}


.stage-icon-container.faded {
  opacity: 0.2;
}

.stage-icon-container.selected {
  opacity: 1;
  img {
    display: inline-block;
  }
}
</style>
