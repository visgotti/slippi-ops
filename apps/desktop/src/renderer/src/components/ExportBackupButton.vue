<template>
  <button
    class="primary"
    @click="handleExport"
  > Export backup 
  </button>
</template>

<script lang="ts" setup>

import { getCurrentInstance, ref } from 'vue';
import useGlobals from '../composables/useGlobals';
const fileInput = ref<HTMLInputElement | null>(null);

const openFileExplorer = () => {
  fileInput.value?.click();
};
const instance = getCurrentInstance();
const { $exportDatabase } = useGlobals();

const handleExport = () => {
  $exportDatabase();

}
</script>