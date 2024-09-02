<template>
  <input
    type="file"
    ref="fileInput"
    @change="handleFileSelect"
    style="display: none;"
  />
  <button
    @click="openFileExplorer"
  > Import backups 
  </button>
</template>


<script lang="ts" setup>

import { getCurrentInstance, ref } from 'vue';
import { useGlobals } from '@/composables';
const fileInput = ref<HTMLInputElement | null>(null);

const openFileExplorer = () => {
  fileInput.value?.click();
};
const instance = getCurrentInstance()
const { $importDatabase } = useGlobals();


const handleFileSelect = (event) => {
  const files = event.target.files;
  if (files.length > 0) {
    $importDatabase(files[0].path);
  }
}
</script>