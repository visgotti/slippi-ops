<template>
  <div class="popup-overlay">
    <div class="popup-container" @click.stop>
      <h2>Filter Presets</h2>

      <div class="preset-form">
        <input v-model="presetName" type="text" placeholder="Preset Name" />
        <button @click="savePreset">Save</button>
      </div>

      <div v-if="savedFilters.length > 0" class="preset-list">
        <h3>Saved Presets</h3>
        <ul>
          <li v-for="(preset, index) in savedFilters" :key="index"
            :class="{selected: index === loadedFilterIndex}"
            @click="loadPreset(index)"
            :title="`Load preset: ${preset.name}`"
          >
            <span> {{ preset.name }}</span>
            <div>
              <button :title="`Delete preset: ${preset.name}`" class="delete" @click="deletePreset(index)">Delete</button>
            </div>
          
          </li>
        </ul>
      </div>

      <button class="close-popup" @click="closePopup">Close</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useMatchHistoryStore } from '@/store/matchHistory';
import { useGlobals } from '@/composables';
import { mapActions, mapState } from 'pinia';

export default defineComponent({
  name: 'PresetFiltersPopup',
  data() {
    return {
      presetName: '',
    };
  },
  computed: {
    ...mapState(useMatchHistoryStore, ['loadedFilterIndex', 'loadedSavedFilter', 'savedFilters']),
  },
  methods: {
    ...mapActions(useMatchHistoryStore, ['deleteFilter', 'saveFilter', 'loadSavedFilter']),
    savePreset() {
      if (!this.presetName.trim()) return;
      const overrideCurrent = this.presetName === this.loadedSavedFilter?.name;
      this.saveFilter(!overrideCurrent, this.presetName);
      if(overrideCurrent) {
        this.$toast(`Updated preset: ${this.presetName}`, 'success');
      } else {
        this.$toast(`Created preset: ${this.presetName}`, 'success');
      }
    },
    loadPreset(index: number) {
      this.$emit('load', this.savedFilters[index])
      this.loadSavedFilter(index);
      this.presetName = this.loadedSavedFilter?.name || '';
      this.$toast(`Loaded preset: ${this.presetName}`, 'success');
    },
    deletePreset(index: number) {
      const presetName = this.savedFilters[index]?.name;
      this.deleteFilter(index);
      this.$toast(`Deleted preset: ${presetName}`, 'success');
    },
    closePopup() {
      this.$emit('close');
    },
  },
});
</script>

<style scoped lang="scss">
@import "@/scss/mixins.scss";
@import "@/scss/variables.scss";

.popup-overlay {
  position: absolute;
  top: 0px;
  left: 0px;
  width: 100%;
  max-width: 100%;
  height: 300px;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
}

.popup-container {
  width: 100%;
  background-color: #3c3c3c;
  border-radius: 8px;
}

.preset-form {
  display: flex;
  margin-bottom: 20px;
}

.preset-form input {
  flex-grow: 1;
  padding: 5px;
  margin-right: 10px;
  border-radius: 4px;
  border: 1px solid #444;
}

.preset-list ul {
  list-style: none;
  padding: 0;
}

.preset-list li {
  cursor: pointer;
  &.selected {
    background-color: #5c5c5c;
  }
  &:hover {
    background-color: #5c5c5c;
  }
  padding-top: 4px;
  padding-bottom: 4px;
  padding-left: 6px;
  padding-right: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  > div {
    display: flex;
    gap: 5px;
  }
  > span {
    white-space: nowrap;    
    overflow: hidden;            
    text-overflow: ellipsis; 
    max-width: calc(100% - 40px);
  }
}

.preset-list li span {
  cursor: pointer;
}

.preset-list li button {
  border: none;
  border-radius: 4px;
  padding: 5px;
  cursor: pointer;
  color: white;
  &.delete {
    background-color: #ff4d4d;
    &:hover {
      background-color: darken(#ff4d4d, 10%);
    }
  }
}
.preset-list li {
  height: 18px;
  button {
    visibility: hidden;
    min-height: 16px !important;
    height: 16px !important;
    max-height: 16px !important;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  &.selected {
    @include inner-outline-top-bottom(1px, $highlight-blue)
  }
  &:hover {
    button {
      visibility: visible;
    }
  }
}



.close-popup {
  background-color: #5c5c5c;
  border: none;
  border-radius: 4px;
  padding: 10px;
  color: white;
  cursor: pointer;
}

.close-popup:hover {
  background-color: #6c6c6c;
}
</style>
