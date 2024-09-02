<template>
  <section class="confirm-popup-wrapper flex-start" v-if="waitingToConfirmCode && !confirming">
    <div class="flex-column confirm-popup">
      <h4>No code was set for the current match. Which one of these is your code?</h4>
      <div class="flex-row flex-center flex-gap-10">
        <button @click="handleConfirm(waitingToConfirmCode.player1Code)">
           {{ waitingToConfirmCode.player1Code }}
        </button>
        <button @click="handleConfirm(waitingToConfirmCode.player2Code)">
          {{ waitingToConfirmCode.player2Code }}
       </button>
      </div>
    </div>
  </section>
  
</template>

<script lang="ts" setup>

import { ref, watch } from 'vue';
import { useSettingsStore, useTrackerStore } from '@/store';
import { storeToRefs } from 'pinia';

import useGlobals from '@/composables/useGlobals';
const { $confirmCode } = useGlobals();

const {
  options
} = storeToRefs(useSettingsStore());

const {
  waitingToConfirmCode
} = storeToRefs(useTrackerStore());

watch(options, (newV) => {
  if(!waitingToConfirmCode.value || confirming.value) {
    return;
  }
  if(newV.currentCodes.includes(waitingToConfirmCode.value.player1Code)) {
    return handleConfirm(waitingToConfirmCode.value.player1Code);
  }
  if(newV.currentCodes.includes(waitingToConfirmCode.value.player2Code)) {
    return handleConfirm(waitingToConfirmCode.value.player2Code);
  }
}, { deep: true })

const confirming = ref(false);
const handleConfirm = (code: string) => {
  if(waitingToConfirmCode.value && !confirming.value) {
    confirming.value = true;
    $confirmCode(code, waitingToConfirmCode.value.startAt);
  }
}
watch(waitingToConfirmCode, () => {
  confirming.value = false;
});
</script>


<style scoped lang="scss">
h4 {
  text-align: center;
}
.confirm-popup-wrapper {
  background-color: transparent;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 100;
}
.confirm-popup {
  border-radius: 8px;
  background-color: var(--card-background-color);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  background-color: #2b2b2b; /* Darker background for dark theme */
  width: calc(100% - 40px);
  max-width: calc(100% - 80px);
  padding: 20px;
  margin-top: 20px;
}
</style>