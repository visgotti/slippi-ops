<template>
  <div class="notes-container">
    <div class="header">
      <div v-if="isAddingNote" class="note editing">
        <slot name="edit" :note="null" :save="() => saveNote(-1)"></slot>
        <div class="text-area">
          <textarea
            placeholder="Add a note..."
            ref="add"
            v-model="localNoteText"
            @blur="saveCreateOnBlur ? saveNote(-1) : () => {}"
            @keypress.enter="handleEnterCreate"
            @keydown.esc="cancelAddingNote"
          />
          <span class="note-actions">
            <button class="primary cancel" @mousedown="cancelAddingNote">cancel</button>
            <button class="primary save" @click="saveNote(-1)" v-if="!saveCreateOnBlur">save</button>
          </span>
        </div>       
      </div>
      <button
        class="primary"
        :disabled="disabled"
        :title="title"
        v-else
        @click="startAddingNote"
      >
        {{ addNoteLabel }}
      </button>
    </div>

    <div v-for="(note, index) in notes" :key="index" class="note" :class="{editing: editingNoteIndex === index}">
      <template  v-if="index !== editingNoteIndex">
        <template v-if="$slots.view">
          <slot name="view" :note="note"></slot>
        </template>
        <span v-else class="note-text">{{ note.content }}</span>
      </template>
   
      <slot v-if="editingNoteIndex !== index" name="extra" class="note-extra" :note="note"></slot>
      <slot v-if="editingNoteIndex === index" name="edit" :note="note" :save="() => saveNote(index)"></slot>
      <div class="text-area"
        v-if="editingNoteIndex === index"
      >
        <textarea
          placeholder="Add a note..."
          ref="edit"
          v-model="localNoteText"
          @blur="saveEditOnBlur ? saveNote(index) : () => {}"
          @keypress.enter="handleEnterEdit"
          @keydown.esc="cancelEditingNote"
        />

        <span class="note-actions">
          <button class="cancel" @mousedown="cancelEditingNote" v-if="index === editingNoteIndex">cancel</button>
          <button class="save" @click="saveNote(index)" v-if="index === editingNoteIndex && !saveEditOnBlur">save</button>
        </span>
      </div>
      <span class="note-actions" v-if="index !== editingNoteIndex">
        <button @click="editNote(note, index)" :disabled="shouldDisableEdit(note)">edit</button>
        <button :disabled="shouldDisableEdit(note)" @click="deleteNote(index)">delete</button>
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import { PropType } from 'vue';

export default {
  name: 'Notes',
  props: {
    disabled: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    },
    notes: {
      type: Array as PropType<({ content: string })[]>,
      default: () => []
    },
    idKey: {
      type: String,
      default: 'id'
    }, 
    saveCreateOnBlur: {
      type: Boolean,
      default: true
    },
    saveEditOnBlur: {
      type: Boolean,
      default: true
    },
    disableEditOnNegativeIds: {
      type: Boolean,
      default: false,
    },
    addNoteLabel: {
      type: String,
      default: "Add Note"
    }
  },
  data() {
    return {
      isAddingNote: false,
      editingNoteIndex: -1,
      localNoteText: ''
    };
  },
  methods: {
    startAddingNote() {
      this.isAddingNote = true;
      this.editingNoteIndex = -1;
      this.localNoteText = '';
      this.$nextTick(() => (<HTMLInputElement>this.$refs.add).focus());
    },
    cancelAddingNote() {
      this.isAddingNote = false;
      this.localNoteText = '';
    },
    shouldDisableEdit(note: any) {
      return this.disableEditOnNegativeIds && this.idKey in note && note[this.idKey] < 0;
    },
    saveNote(index: number) {
      if (this.localNoteText.trim() === '') {
        if (index === -1) {
          this.isAddingNote = false;
        } else {
          this.editingNoteIndex = -1;
        }
        return;
      }
      if (index === -1) {
        if(!this.isAddingNote) return;
        this.$emit('add', this.localNoteText);
        this.isAddingNote = false;
      } else {
        if(this.editingNoteIndex < 0) return;
        this.$emit('edit', { index, note: { ...this.notes[index], content: this.localNoteText } });
        this.editingNoteIndex = -1;
      }
      this.localNoteText = '';
    },
    handleEnterCreate(e: any) {
      if(this.saveCreateOnBlur) {
        e.target.blur();
      } else {
        this.saveNote(-1);
      }
    },
    handleEnterEdit(e: any) {
      if(this.saveEditOnBlur) {
        e.target.blur();
      } else {
        this.saveNote(this.editingNoteIndex);
      }
    },
    editNote(note: any, index: number) {
      this.localNoteText = note.content;
      this.isAddingNote = false;
      this.editingNoteIndex = index;
      this.$nextTick(() => (<HTMLInputElement[]>this.$refs.edit)[0]?.focus());
      this.$emit('start-edit', note);
    },
    cancelEditingNote() {
      this.editingNoteIndex = -1;
      this.localNoteText = '';
    },
    deleteNote(index: number) {
      this.$emit('delete', { index, note: this.notes[index] });
    }
  }
};
</script>

<style scoped lang="scss">
.text-area {
  display: flex;
  flex-direction: row;
  width: 100%;
  min-width: 100%;
  max-width: 100%;
  textarea {
    flex: 1;
    border: none;
    border-radius: 5px;
    padding: 5px;
    margin-right: 5px;
    line-height: 3;
  }
}
.notes-container {
  margin-top: 20px;
  border-radius: 8px;
  color: var(--text-color);
  background-color: var(--card-background-color);
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
      
  button {
    color: var(--text-color);
    border: none;
    padding: 5px;
    border-radius: 3px;
    background-color: var(--background-color);

    cursor: pointer;
    &:last-child {
      margin-right: 5px;
    }
    
    &:disabled {
      cursor: not-allowed;
      opacity: .5;
    }
    &:not(:disabled) {
      &:hover {
        color: var(--muted-text-color)
      }
      cursor: pointer;
    }
  }
}

.add-note {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 10px;
  border-radius: 5px;
}

.note {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-left: 10px;
  min-height: 44px;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.note-text {
    flex-grow: 1;
}
.text-area {
  .note-actions {
    display: flex;
    gap: 5px;
    flex-direction: column;
  }
}

.note-actions {
  gap: 10px;
  button {
    margin-left: 3px;
    margin-right: 3px;
  }
}
.header {
  margin: 20px;
}

</style>
