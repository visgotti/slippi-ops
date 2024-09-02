<template>
  <div class="multi-text-input" :class="{ disabled }">
    <template v-if="selections">
      <select v-model="currentInput" @change="onSelectChange" :disabled="disabled">
        <option v-for="option in availableSelections" :key="option as string" :value="option">{{ option }}</option>
      </select>
    </template>
    <template v-else>
      <input
        type="text"
        v-model="currentInput"
        @submit.stop.prevent="onPressEnter"
        @keypress.stop
        @keyup.enter="onPressEnter"
        @blur="addItem"
        :placeholder="disabled ? '' : placeholder"
        :disabled="disabled"
      />
    </template>
    <div class="tags">
      <span v-for="(item, index) in items" :key="index" class="tag" :class="{ error: item.error }" :title="item.error || ''">
        {{ item.value }}
        <span class="remove-tag" v-if="!disabled" @click="removeItem(index)">×</span>
      </span>
    </div>
    <div v-if="showErrorMessage && lastSubmitError" class="error">
      {{ lastSubmitError }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed } from 'vue';
import { toRefs } from 'vue'

export default defineComponent({
  name: 'MultiTextInput',
  props: {
    modelValue: {
      type: Array,
      default: () => []
    },
    clearOnError: {
      type: Boolean, 
      default: false
    },
    showErrorTags: {
      type: Boolean,
      default: true
    },
    showErrorMessage: {
      type: Boolean,
      default: true
    },
    hasError: {
      type: Function,
      default: () => false
    },
    placeholder: {
      type: String,
      default: 'Type and press enter',
    },
    disabled: {
      type: Boolean,
      default: false
    },
    selections: {
      type: Array,
      default: null
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { disabled, placeholder, selections, showErrorMessage, showErrorTags } = toRefs(props);
    const currentInput = ref('');
    const lastSubmitError = ref('');
    const items = ref(props.modelValue.map(value => ({ value, error: null })));

    // Sync items with modelValue on prop change
    watch(() => props.modelValue, (newModelValue) => {
      items.value = newModelValue.map(value => ({ value, error: null }));
    });

    const availableSelections = computed(() => {
      if (!props.selections) return [];
      return props.selections.filter(selection => !items.value.some(item => item.value === selection));
    });

    const onPressEnter = (event) => {
      event.preventDefault();
      event.stopPropagation();
      addItem();
    }

    const addItem = () => {
      if (disabled.value) return;
      lastSubmitError.value = '';
      const trimmedCode = currentInput.value.trim();
      if (trimmedCode !== '' && !items.value.some(item => item.value === trimmedCode)) {
        const error = props.hasError(trimmedCode);
        if(error && showErrorTags.value) {
          const newItem = { value: trimmedCode, error: showErrorTags.value ? error : null };
          items.value.push(newItem);
        } else if (!error) {
          const newItem = { value: trimmedCode, error: null };
          items.value.push(newItem);
        }

        lastSubmitError.value = error;
        if (!error) {
          emit('update:modelValue', items.value.filter(item => !item.error).map(item => item.value));
          currentInput.value = '';
        }  else if (props.clearOnError) {
          currentInput.value = '';
        }
      }
    };

    const onSelectChange = () => {
      addItem();
    };

    const removeItem = (index: number) => {
      if (disabled.value) return;
      const removedItem = items.value.splice(index, 1)[0];
      if (!removedItem.error) {
        emit('update:modelValue', items.value.filter(item => !item.error).map(item => item.value));
      }
    };

    return {
      showErrorMessage,
      lastSubmitError,
      placeholder,
      onPressEnter,
      currentInput,
      items,
      addItem,
      removeItem,
      disabled,
      selections,
      availableSelections,
      onSelectChange
    };
  }
});
</script>
<style scoped lang="scss">
.multi-text-input {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  border: 1px solid #ccc;
  padding: 5px;
  border-radius: 4px;
  &.disabled {
    background-color: #f5f5f5;
    opacity: .5;
    select,
    input {
      background-color: #f5f5f5;
      cursor: not-allowed;
    }
  }
  input,
  select {
    min-width: 80px;
    border: none;
    outline: none;
    margin-left: 5px;
    padding: 5px;
    margin-right: 5px;
  }
  .tags {
    display: flex;
    flex-wrap: wrap;
    flex-grow: 1;
    .tag {
      display: flex;
      align-items: center;
      background-color: #007bff;
      color: white;
      padding: 5px;
      border-radius: 3px;
      margin: 2px;
      position: relative;
    }

    .tag.error {
      background-color: #dc3545;
    }

    .remove-tag {
      cursor: pointer;
      margin-left: 5px;
      font-weight: bold;
    }

    .tag[title] {
      position: relative;
    }


  }
}
</style>