<template>
  <div class="filter-and-sort-container">
    <div class="filter-actions">
      <button class="primary manage-presets" @click="togglePopup">Presets</button>
      <button class="primary reset-filters"
        @click="clearFilters()"
      >
        Clear Filters
      </button>
      <PresetFiltersPopup
        v-if="isPopupVisible"
        @close="togglePopup"
        @load="applyPreset"
    />
    </div>


    <div class="filters-outer">
      
      <div class="filters-row"
        title="Filter games that happened before the set date"
      >
        <div class="filter-group">
          <label>Before Date:</label>
          <input type="date" v-model="filters.startAtBefore" />
        </div>
      </div>
      
      <div class="filters-row"
      title="Filter games that happened after the set date"
      >
        <div class="filter-group">
          <label>After Date:</label>
          <input type="date" v-model="filters.startAtAfter" />
        </div>
      </div>


      <div class="filters-row">
        <div class="filter-group">
          <label>{{ opponentSearchStringLabel }} </label>
          <input type="text" :class="{error: !!opponentSearchCodeError}" v-model="filters.opponentString" :placeholder="opponentSearchStringLabel" />
          <div v-if="opponentSearchCodeError" class="error">
            {{ opponentSearchCodeError }}
          </div>
          <div class="filter-checkbox-options"
            v-if="!!filters.opponentString"
          >
            <div class="filter-group">
              <label>Exact Match</label>
              <input type="checkbox" v-model="filters.opponentSearchExactMatch" />
            </div>
            <div class="filter-group">
              <label>Search Only Codes
              </label><input type="checkbox" v-model="filters.searchOnlyOpponentCodes" />
            </div>

            <div class="filter-group">
              <label> Search Only Nicknames</label>
              <input type="checkbox" v-model="filters.searchOnlyOpponentNicknames" />
            </div>
          </div>
        </div>
      </div>

      <div class="filters-row">
        <div class="filter-group">
          <label>{{ yourSearchStringLabel }} </label>
          <input type="text" :class="{error: !!yourSearchCodeError}"  v-model="filters.yourString" :placeholder="yourSearchStringLabel" />
          <div v-if="yourSearchCodeError" class="error">
            {{ yourSearchCodeError }}
          </div>
          <div class="filter-checkbox-options"
            v-if="!!filters.yourString"
          >
            <div class="filter-group">
              <label> Exact Match </label>
              <input type="checkbox" v-model="filters.yourSearchExactMatch" />
            </div>

            <div class="filter-group">
              <label> Search Only Codes</label>
              <input type="checkbox" v-model="filters.searchOnlyYourCodes" />
            </div>
            <div class="filter-group">
              <label> Search Only Nicknames </label>
              <input type="checkbox" v-model="filters.searchOnlyYourNicknames" />
            </div>
          </div>
        </div>
      </div>

      <div class="filters-row">
        <div class="filter-group">
          <label>Stages:</label>
          <StageSelectInput v-model="filters.stages" />
        </div>
      </div>

      <div class="filters-row">
        <div class="filter-group">
          <label>Your Characters:</label>
          <CharacterSelectInput v-model="filters.yourCharacters" use-tiered-order/>
        </div>
      </div>

      <div class="filters-row">  
        <div class="filter-group">
          <label>Opponent Characters:</label>
          <CharacterSelectInput v-model="filters.opponentCharacters" use-tiered-order/>
        </div>
      </div>  

      <div class="filter-group">
        <div class="filters-row">
          <label>Unranked Matches:</label>
          <input type="checkbox" v-model="filters.unranked" />
        </div>
        <div class="filters-row">
          <label>Ranked Matches:</label>
          <input type="checkbox" v-model="filters.ranked" />
        </div>
        <div class="filters-row">
          <label>Direct Matches:</label>
          <input type="checkbox" v-model="filters.direct" />
        </div>
      </div>

      <div class="filter-group">
        <div class="filters-row">
          <label>Include games you quit:</label>
          <input type="checkbox" v-model="filters.youQuit" />
        </div>
        <div class="filters-row">
          <label>Include games opponent quit:</label>
          <input type="checkbox" v-model="filters.opponentQuit" />
        </div>
        <div class="filters-row">
          <label>Include finished games:</label>
          <input type="checkbox" v-model="filters.includeFinished" />
        </div>
      </div>

      <div class="filters-row">  
        <div class="filter-group">
          <label>Opponent Ranks:</label>
          <MultiTextInput v-model="filters.ranks" :selections="ranks" />
        </div>
      </div>

      <div class="filters-row">
        <div class="filter-group">
          <label>Opponent Stocks:</label>
          <input type="number" v-model.number="filters.opponentStocks" />
        </div>
      </div>

      <div class="filters-row">
        <div class="filter-group">
          <label>Opponent Stocks:</label>
          <input type="number" v-model.number="filters.yourStocks" />
        </div>
      </div>
    </div>

    
    <div class="sort-group">
      <label>Sort By:</label>
      <select v-model="sort.sortBy">
        <option v-for="prop in sortableProps" :key="prop.value" :value="prop.value">{{ prop.label }}</option>
      </select>
      <select v-model="sort.sortOrder">
        <option value="asc">Ascending</option>
        <option value="desc">Descending</option>
      </select>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import CharacterSelectInput from '@/components/CharacterSelectInput.vue';
import StageSelectInput from '@/components/StageSelectInput.vue';
import MultiTextInput from '@/components/MultiTextInput.vue';
import PresetFiltersPopup from '@/components/PresetFiltersPopup.vue';
import { defaultSort, defaultFilters } from '@/store/matchHistory';
import {  formatCode, jsonCopy } from '@slippiops/utils';
export default defineComponent({
  name: 'FilterAndSort',
  components: {
    PresetFiltersPopup,
    CharacterSelectInput,
    StageSelectInput,
    MultiTextInput
  },
  data() {
    return {
      isPopupVisible: false,
      yourSearchCodeError: '',
      opponentSearchCodeError: '',
      sort: jsonCopy(defaultSort),
      filters: jsonCopy(defaultFilters),
      ranks: [
        "Master 3", "Master 2", "Master 1", "Diamond 3", "Diamond 2", "Diamond 1",
        "Plat 3", "Plat 2", "Plat 1", "Gold 3", "Gold 2", "Gold 1", "Silver 3", "Silver 2", "Silver 1",
        "Bronze 3", "Bronze 2", "Bronze 1"
      ],
      sortableProps: [
        { value: 'startAt', label: 'Start Date' },
        { value: 'opponentNickname', label: 'Opponent Nickname' },
        { value: 'opponentCode', label: 'Opponent Code' },
        { value: 'opponentActiveElo', label: 'Opponent Rating' },
        { value: 'matchLength', label: 'Match Length' },
        { value: 'youWon', label: 'Wins' },
        { value: 'opponentWon', label: 'Losses' },
        { value: 'yourStocks', label: 'Your Stocks' },
        { value: 'opponentStocks', label: 'Opponent Stocks' },
        { value: 'opponentCharacterName', label: 'Opponent Character' },
        { value: 'yourCharacterName', label: 'Your Character' }
      ],
    };
  },
  watch: {
    defaultFilters() {
      this.filters = jsonCopy({
        ...this.filters,
        ...this.defaultFilters,
      })
    },
    defaultSort() {
      this.sort = jsonCopy({
        ...this.sort,
        ...this.defaultSort,
      })
    },
    filters: {
      handler(newFilters) {
        this.opponentSearchCodeError = '';
        this.yourSearchCodeError = '';
        if(newFilters.opponentString && newFilters.searchOnlyOpponentCodes && !newFilters.searchOnlyOpponentNicknames) {
          try {
            newFilters.opponentString = formatCode(newFilters.opponentString);
          } catch (err: any) {
            this.opponentSearchCodeError = err.message;
          }
        }
        if(newFilters.yourString && newFilters.searchOnlyYourCodes && !newFilters.searchOnlyYourNicknames) {
          try {
            newFilters.opponentString = formatCode(newFilters.opponentString);
          } catch (err: any) { 
            this.yourSearchCodeError = err.message;
          }
        }
        if(!this.hasErrors) {
          this.$emit('filter', { ...newFilters });
        }
      },
      deep: true,
    },
    sort: {
      handler(newSort) {
         if(!this.hasErrors) {
          this.$emit('sort', { ...newSort });
        }
      },
      deep: true,
    },
  },
  methods: {
    togglePopup() {
      this.isPopupVisible = !this.isPopupVisible;
    },
    applyPreset(preset: any) {
      this.filters = preset.filters;
      this.sort = preset.sort;
    },
    clearFilters() {
      this.filters = jsonCopy(defaultFilters);
      this.sort = jsonCopy(defaultSort);
    }
  },
  computed: {
  
    hasErrors() {
      return this.opponentSearchCodeError || this.yourSearchCodeError;
    },
    opponentSearchStringLabel() {
      if (this.filters.searchOnlyOpponentCodes && !this.filters.searchOnlyOpponentNicknames) return 'Opponent Code';
      if (this.filters.searchOnlyOpponentNicknames && !this.filters.searchOnlyOpponentCodes) return 'Opponent Name';
      return 'Opponent Name/Code';
    },
    yourSearchStringLabel() {
      if (this.filters.searchOnlyYourCodes && !this.filters.searchOnlyYourNicknames) return 'Your Code';
      if (this.filters.searchOnlyYourNicknames && !this.filters.searchOnlyYourCodes) return 'Your Name';
      return 'Your Name/Code';
    }
  },
  props: {
    defaultFilters: {
      type: Object,
      required: false,
    },
    defaultSort: {
      type: Object,
      required: false,
    },
  },
});
</script>

<style scoped lang="scss">
.filter-actions {
  position: relative;
  display: flex;
  gap: 5px;
}
.filter-and-sort-container {

  display: flex;
  flex-direction: column;
  padding: 10px;
  background-color: #3c3c3c;
  max-height: 100%;
  overflow-y: auto;
  border-radius: 8px;
  margin-bottom: 20px;
}
.filters-outer {
  display: flex;
  flex-direction: column
}
.filters-row {
  display: flex;
}
.filter-checkbox-options {
  > .filter-group {
    justify-content: center;
    align-items: center;
    flex-direction: row;
  }
}
.filter-group {
  max-width: 200px;
  min-width: 200px;
  width: 200px;
  display: flex;
  flex-direction: column;
}

.filter-group, .sort-group {
  margin-bottom: 10px;
}

.filter-group label, .sort-group label {
  display: block;
  margin-bottom: 5px;
  color: white;
}

.filter-group input, .sort-group select {
  padding: 5px;
  border-radius: 4px;
  border: 1px solid #444;
}

button {
  padding: 10px;
  background-color: #5c5c5c;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
}

button:hover {
  background-color: #6c6c6c;
}
</style>
