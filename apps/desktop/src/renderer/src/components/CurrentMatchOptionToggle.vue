<template>
  <div class="only-show-toggle-wrapper"
    :title="title"
  >
    <p> {{ label }} </p>
    <Toggle 
    
      :value="value"
      @input="handleInput"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Toggle from '@vueform/toggle'

export default defineComponent({
  components: {
    Toggle,
  },
  props: {
    title: {
      type: String,
      required: false,
    },
    label: {
      type: String,
      required: true
    },
    value: {
      type: Boolean,
      required: true,
    },
  },
  methods: {
    handleInput(value: boolean) {
      this.$emit('update:modelValue', value);
      this.$emit('input', value);
    },
  },
});
</script>

<style lang="scss" scoped>
.only-show-toggle-wrapper {
  background-color: rgb(73, 71, 71);
  padding-left: 5px;
  padding-right: 5px;
  border-radius: 10px;
  p {
    font-size: 12px;
    padding-right: 6px;
  }
}
</style>
