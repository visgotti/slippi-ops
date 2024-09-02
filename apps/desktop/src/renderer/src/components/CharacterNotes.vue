<template>
  <div
    :class="{stage: !!stageId }"
  >
    <Notes
      :addNoteLabel="addNoteLabel"
      :saveCreateOnBlur="false"
      :saveEditOnBlur="false"
      :disabled="characterId < 0"
      :title="characterId < 0 ? disabledTitle : enabledTitle"
      :notes="characterNotes"
      :disableEditOnNegativeIds="true"
      @add="addNote"
      @edit="editNote"
      @delete="deleteNote"
      @start-edit="handleStartEditingNote"
    >
      <template v-slot:view="{note}">
        <CharacterNoteDisplay :note="note" />
      </template>
      <template v-slot:edit> 
      <div>
        <div class="header">
          <h3> Adding note for: {{ getCharacterName(characterId) }}</h3>
          <p class="highlight"> Select the following check boxes if you want to configure the note to show conditionally:</p>
        </div>
        
        <div class="input-section"
          title="Show this note only when you're playing as one of the selected characters. If not enabled or none are selected, it will show for all characters."
        >
          <div class="input-group-row">
            <label> Show only when you play as selected characters? </label>
            <input type="checkbox" v-model="yourCharactersEnabled" />
          </div>
          <div class="input-group-column"
            v-if="yourCharactersEnabled"
          >
            <label v-if="yourCharactersEnabled"> Click characters to select </label>
            <CharacterSelectInput :disabled="!yourCharactersEnabled" v-model="yourCharacterIds" :useTieredOrder="true" />
          </div>
        </div>

        <div class="input-section"
          title="Show this note only when you're playing on one the the selected stages. If not enabled or none are selected, it will show for all characters."
        >
          <div class="input-group-row">
            <label> Show only when you play on selected stages: </label>
            <input type="checkbox" v-model="stagesEnabled" />
          </div>
          <div class="input-group-column"
            v-if="stagesEnabled"
          >
            <label v-if="stagesEnabled"> Click stages to select </label>
            <StageSelectInput 
              :disabled="!stagesEnabled"
            v-model="stageIds" />
          </div>
        </div>
          
        <div
          title="Show this note  only when the opponent's percent matches the criteria."
          class="input-section"
        >     
          <div class="input-group-row">
            <label>Show only if opponent's percent condition is met</label>
            <input type="checkbox" v-model="opponentPercentEnabled" />
          </div>
          <div class="input-group-row"
            v-if="opponentPercentEnabled"
          >
            <select v-model="opponentPercentCondition" :disabled="!opponentPercentEnabled">
              <option value="between">Between</option>
              <option value="greater">Greater than</option>
              <option value="less">Less than</option>
            </select>
            <div v-if="opponentPercentCondition === 'between'">
              <div>
              <label>&nbsp;From:&nbsp;</label>
              <input :disabled="!opponentPercentEnabled" type="number" v-model="opponentPercentValue1" />
              </div>
              
              <div>
              <label>&nbsp;To:&nbsp;</label>
              <input :disabled="!opponentPercentEnabled" type="number" v-model="opponentPercentValue2" />
              </div>
            </div>
            <div v-else>
              <label>&nbsp;Percentage:&nbsp;</label>
              <input :disabled="!opponentPercentEnabled" type="number" v-model="opponentPercentValue1" />
            </div>
          </div>
        </div>
  
        <div
          title="Show this note only when the your percent matches the criteria."
          class="input-section"
        > 
          <div class="input-group-row">
            <label>Show only if your percent condition is met</label>
            <input type="checkbox" v-model="yourPercentEnabled" />
          </div>
          <div class="input-group-row"
            v-if="yourPercentEnabled"
          >
            <select class="character-note-option" v-model="yourPercentCondition" :disabled="!yourPercentEnabled">
              <option value="between">Between</option>
              <option value="greater">Greater than</option>
              <option value="less">Less than</option>
            </select>
            <div v-if="yourPercentCondition === 'between'"
              class="character-note-option"
            >
              <div>
                <label>&nbsp;From:&nbsp;</label>
                <input :disabled="!yourPercentEnabled" type="number" v-model="yourPercentValue1" />
              </div>
              <div>
                <label>&nbsp;To:&nbsp;</label>
                <input :disabled="!yourPercentEnabled" type="number" v-model="yourPercentValue2" />
              </div>
            </div>
            <div v-else
            class="character-note-option"
            >
              <label>&nbsp;Percentage:&nbsp;</label>
              <input :disabled="!yourPercentEnabled" type="number" v-model="yourPercentValue1" />
            </div>
          </div>
        </div>
      </div>
      </template>
    </Notes>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue';
import CharacterNoteDisplay from './CharacterNoteDisplay.vue';
import { useSettingsStore, useTrackerStore } from '@/store';
import useGlobals from '@/composables/useGlobals';
import Notes from '@/components/Notes.vue';
import CharacterSelectInput from '@/components/CharacterSelectInput.vue';
import StageSelectInput from '@/components/StageSelectInput.vue';
import { CharacterNote, LiveCharacterNote } from '@slippiops/types';
import { arraysDeepEqual, formatLiveCharacterNote, getCharacterName } from '@slippiops/utils';

const props = defineProps({
  stageId: {
    type: Number,
    default: null,
  },
  characterId: {
    type: Number,
    required: true,
  },
  disabledTitle: {
    type: String,
    default: 'First select a character to view and add notes' 
  },
  enabledTitle: {
    type: String,
    default: 'Character Notes'
  },
  addNoteLabel: {
    type: String,
    default: 'Add Note'
  }
});


const handleStartEditingNote = (note: CharacterNote) => {
  stageIds.value = note.stageIds ? [...note.stageIds] : [];
  yourCharacterIds.value = note.yourCharacterIds ? [...note.yourCharacterIds] :  [];
  opponentPercentEnabled.value = !!note.opponentPercentStart || !!note.opponentPercentEnd;
  opponentPercentCondition.value = note.opponentPercentStart && note.opponentPercentEnd ? 'between' : note.opponentPercentStart ? 'greater' : 'less';
  opponentPercentValue1.value = note.opponentPercentStart || note.opponentPercentEnd || 0;
  opponentPercentValue2.value = note.opponentPercentEnd || 0;

  yourPercentEnabled.value = !!note.yourPercentStart || !!note.yourPercentEnd;
  yourPercentCondition.value = note.yourPercentStart && note.yourPercentEnd ? 'between' : note.yourPercentStart ? 'greater' : 'less';
  yourPercentValue1.value = note.yourPercentStart || note.yourPercentEnd || 0;
  yourPercentValue2.value = note.yourPercentEnd || 0;

  yourCharactersEnabled.value = !!note.yourCharacterIds?.length;
  stagesEnabled.value = !!note.stageIds?.length;
}

const { $createCharacterNote, $deleteCharacterNote, $updateCharacterNote } = useGlobals();

const trackerStore = useTrackerStore();
const settingsStore = useSettingsStore();
const stagesEnabled = ref(false);
const yourCharactersEnabled = ref(false);

watch(yourCharactersEnabled, (newValue) => {
  if(newValue) {
    yourCharacterIds.value = settingsStore.lastSelectedPlayAsCharacters
  }
});

const opponentPercentCondition = ref('between');
const opponentPercentEnabled = ref(false);
const opponentPercentValue1 = ref(0);
const opponentPercentValue2 = ref(0);

const yourPercentCondition = ref('between');
const yourPercentEnabled = ref(false);
const yourPercentValue1 = ref(0);
const yourPercentValue2 = ref(0);


const yourCharacterIds = ref<number[]>([]);
const stageIds = ref<number[]>([]);

const characterNotes = computed<LiveCharacterNote[]>(() => ((trackerStore.characterNotes[props.characterId] || []).map(formatLiveCharacterNote)));

watch(yourCharacterIds, () => {
  if(!arraysDeepEqual(yourCharacterIds.value, settingsStore.lastSelectedPlayAsCharacters)) {
    settingsStore.setStateValue('lastSelectedPlayAsCharacters', [...yourCharacterIds.value]);
  }
});

const updateNoteExtra = (note: CharacterNote) => {
  if(opponentPercentEnabled.value) {
    if(opponentPercentCondition.value === "greater") {
      note.opponentPercentStart = opponentPercentValue1.value;
    } else if (opponentPercentCondition.value === "less") {
      note.opponentPercentEnd = opponentPercentValue1.value;
    } else {
      note.opponentPercentStart = opponentPercentValue1.value;
      note.opponentPercentEnd = opponentPercentValue2.value;
    }
  } else {
    note.opponentPercentStart = null;
    note.opponentPercentEnd = null;
  }

  if(yourPercentEnabled.value) {
    if(yourPercentCondition.value === "greater") {
      note.yourPercentStart = yourPercentValue1.value;
    } else if (yourPercentCondition.value === "less") {
      note.yourPercentEnd = yourPercentValue1.value;
    } else {
      note.yourPercentStart = yourPercentValue1.value;
      note.yourPercentEnd = yourPercentValue2.value;
    }
  } else {
    note.yourPercentStart = null;
    note.yourPercentEnd = null;
  }

  if(stagesEnabled.value) {
    note.stageIds = [...stageIds.value];
  } else {
    note.stageIds = null;
  }

  if(yourCharactersEnabled.value) {
    note.yourCharacterIds = [...yourCharacterIds.value];
  } else {
    note.yourCharacterIds = null;
  }
}

const resetDefaults = () => {
  opponentPercentValue1.value = 0;
  opponentPercentValue2.value = 0;
  opponentPercentCondition.value = 'between';
  opponentPercentEnabled.value = false;
  yourPercentValue1.value = 0;
  yourPercentValue2.value = 0;
  yourPercentCondition.value = 'between';
  yourPercentEnabled.value = false;

  stagesEnabled.value = false;
  yourCharactersEnabled.value = false;

  yourCharacterIds.value = [];
  stageIds.value = [];
}

const addNote = async (noteContent: string) => {
  const newNote = {
    id: -Date.now(),
    characterId: props.characterId,
    content: noteContent,
    stageIds: stageIds.value,
  };

  updateNoteExtra(newNote);
  trackerStore.addCharacterNote(newNote);
  const saved = await $createCharacterNote(props.characterId, newNote.content);
  await $updateCharacterNote(saved.id, newNote);
  trackerStore.removeCharacterNote(newNote);
  trackerStore.addCharacterNote({
    ...newNote,
    id: saved.id
  });
  resetDefaults();
};

const editNote = ({ note }: { index: number, note: CharacterNote }) => {
  updateNoteExtra(note);
  trackerStore.updateCharacterNote(note);
  $updateCharacterNote(note.id, note);
  resetDefaults();
};

const deleteNote = ({ note }: { index: number, note: CharacterNote }) => {
  trackerStore.removeCharacterNote({
    ...note,
    characterId: props.characterId,
  });
  $deleteCharacterNote(note.id);
};

const characterId = computed(() => props.characterId);
watch(characterId, () => {
  resetDefaults();
})
</script>

<style lang="scss" scoped>
.highlight {
  color: #13b8fa;
}
:deep(.character-note) {
  min-width: calc(100% - 120px);
  width: calc(100% - 120px);
}

.header {
  h3 {
    padding: 0px;
    margin: 0px;
  }
  p {
    margin: 2px;
    font-size: 10px;
  }
  margin-bottom: 20px;
}
.input-section {
  margin-bottom: 15px;
 
}
.input-group-column {
  label {
    font-size: 10px;
    padding-bottom: 4px;
    color: #eeee;
  }
}
.input-group-row {
  display: flex;
  flex-direction: row;
  padding-bottom: 5px;
}

.input-group-column {
  display: flex;
  flex-direction: column;
}
.percent-wrapper {
  display: flex;
  flex-direction: row;
}
:deep(.note.editing) {
  display: flex;
  flex-direction: column;
  justify-self: start;
  align-items: start;
}
</style>