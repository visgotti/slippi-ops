<template>
  <form @submit.prevent="() => canInit && $emit('init')"
    class="setting-form"
  > 
    <div class="setting-options-wrapper">
      <div>
        <div v-if="pathError" class="error">
          the entered path could not be found
        </div>
        <div v-else-if="!needsPathValidation" class="validated-path-info flex-column">
          <div class="success"> Replay path was valid! </div>
          <div class="path-info flex-row flex-start flex-gap-5">
            <div> Found folders: </div>
            <div> {{ foundFolders }} </div>
          </div>
          <div class="path-info flex-row flex-start flex-gap-5">
            <div> Found files: </div> 
            <div> {{ foundFiles }} </div>
          </div>
          <div class="warning path-info flex-row flex-start flex-gap-5"
            v-if="foundDuplicates"
            title="This is the number of files that were found multiple times. This probably means you copy and pasted the same file or folder into your selected path. Only the first instance of the file will be processed."
          >
            <div> Duplicate files: </div> 
            <div> {{ foundDuplicates }} </div>
          </div>
        </div>
        <div class="setting-option">
          <label for="pathToReplays">
            Path to replays:
          </label>
          <div className="replay-file-wrapper">
            <input
              :disabled="isValidatingPath"
              type="text"
              id="pathToReplays"
              v-model="options.pathToReplays"
              placeholder="Enter path to replays"
              required
            />
            <LoadingText
              v-if="isValidatingPath"
              left
              label="Validating path"
              :startingEllipses="2"
              :elipsesCount="3"
              :elipsesInterval="150"
            />
          </div>
          <button :disabled="isValidatingPath" class="browse-button primary" type="button" @click="openFileExplorer">Browse...</button>
        </div>
      </div>

      <div
        class="setting-option"
        title="Recursively check all sub directories of the provided path for slippi files"
      >
        <label for="recursivelyAllPaths">Check sub directories for slippi files?</label>
        <Toggle
          id="recursivelyAllPaths"
          v-model="options.recursivelyAllPaths"
        />
      </div>

      <div class="setting-option"
        title="If enabled the app will automatically detect codes when one player code changes but one does not between subsequent games."
      >
        <label for="autodetectCodes">Auto detect codes? </label>
        <Toggle
          id="autodetectCodes"
          v-model="options.autodetectCodes"
        />
      </div>

      <div
        class="setting-option"
        :title="options.autodetectCodes ? 'Turn off auto detect codes if you want to manually enter your codes.' : ''"
      >
        <label v-if="!options.autodetectCodes">Enter codes</label>
        <button v-else-if="initialized" @click="handleGetUniqueCodes">Refresh Codes</button>
        <MultiTextInput
          v-model="options.currentCodes"
          :hasError="codeHasError"
          :showErrorTags="false"
          :disabled="options.autodetectCodes"
        />
      </div>

      <div v-if="maxCpus"
        class="setting-option"
      >
        <label for="pathToReplays">Use parallel processing? </label>
        <Toggle
          id="parallel"
          v-model="options.processParallel"
        />
    
        <div class="parallel-warning">
          Parallel processing may slow your system down significantly.
        </div>
      </div>
      <div v-if="maxCpus && options.processParallel"
      class="setting-option"
      >
        <div>max: {{ maxCpus }}</div>

        <label for="useCpus">Number of cpus to use?</label>

        <input
          type="number"
          id="cpus"
          placeholder="Number of cpus to use"
          v-model="options.useCpus"
          min="1"
          :max="maxCpus"
          required
        />
      </div>
      <button :disabled="!canInit" v-if="!initialized" type="submit">Initialize Tracker</button>
      <button class="reset-button" v-if="initialized" @click="showRestoreConfirmation=true"> Reset Data</button>
    </div>
    <div class="restore-confirmation-wrapper"
      v-if="showRestoreConfirmation"
    >
      <div
        class="restore-confirmation-inner"
        :class="{restoring: isRestoring}"
      >
        <h2>Are you sure you want to reset the application?</h2>
        <h5> This will delete all your notes and match history. </h5>
        <div class="button-wrapper">
          <button :disabled="isRestoring" @click="handleRestore">Yes</button>
          <button :disabled="isRestoring" @click="showRestoreConfirmation=false">No</button>
        </div>
      
      </div>
    </div>

  </form>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed, getCurrentInstance } from 'vue';
import { useTrackerStore, TRACKER_STATES } from '../store/tracker';
import { useSettingsStore } from '../store/settings';
import { storeToRefs } from 'pinia';
import useGlobals from '@/composables/useGlobals';
import MultiTextInput from '@/components/MultiTextInput.vue';
import Toggle from '@vueform/toggle';
import LoadingText from '@/components/LoadingText.vue';

export default defineComponent({
  components: {
    LoadingText,
    MultiTextInput,
    Toggle
  },
  name: 'Settings',
  props: {
    initialized: {
      type: Boolean,
      default: false
    },
  },
  setup(_, { emit }) {
    const settingsStore = useSettingsStore();
    const trackerStore = useTrackerStore();
    const { 
      maxCpus,
      options
     } = storeToRefs(settingsStore) as any;

     const showRestoreConfirmation = ref(false);
     const isRestoring = ref(false);

    const pathError = ref('');
    const needsPathValidation = ref(true);
    const { $getUniqueCodes, $validateSlippiFolder, $restoreApplication, $toast } = useGlobals();

    const restored = ref(false);

    const handleRestore = async () => {
      emit('before-reset');
      needsPathValidation.value = true;
      isRestoring.value = true;
      $restoreApplication().finally(() => {
        restored.value = true;
        isRestoring.value = false;
        showRestoreConfirmation.value = false;
        needsPathValidation.value = true;
        pathError.value = '';
        // idk there's a weird bug apparently where localStorage doesn't reset properly if you close app out too soon
        setTimeout(() => {
            // https://github.com/electron/electron/issues/22048
          emit('after-reset');
          $toast('Application has been reset', 'success');
        }, 3000);
     
      });
    }
    const handleGetUniqueCodes = () => {
      $getUniqueCodes().then((codes) => {
        settingsStore.setOptionValue('currentCodes', codes);
      });
    }

    const codeHasError = (code: string) => {
      const regex = /^[a-zA-Z]{1,4}#[0-9]{1,4}$/;
      if (!regex.test(code)) {
        return 'Code must be 1-4 letters followed by a # and 1-4 numbers (e.g., ABC#1234)';
      }
      return null;
    };

    const checkRecursively = computed(() => options.value.recursivelyAllPaths);
    const selectedPath = computed(() => options.value.pathToReplays);

    const isValidatingPath = ref(false);

    const foundFiles = ref(0);
    const foundFolders = ref(0);
    const foundDuplicates = ref(0);

    const openFileExplorer = async () => {
      try {
        const selectedPath = await window.electron.selectDir();    
        if(selectedPath.status === 'success') {
          settingsStore.setOptionValue('pathToReplays', selectedPath.path);  
        }
      } catch (error) {
        console.error('err:', error)
      }
    }

    const validatePath = async () => {
      needsPathValidation.value = true;
      pathError.value = '';
      isValidatingPath.value = true;
      const r = await $validateSlippiFolder(selectedPath.value);
      isValidatingPath.value = false;
      if(r) {
        foundFiles.value = r.files;
        foundFolders.value = r.folders;
        foundDuplicates.value = r.duplicates;
        needsPathValidation.value = false;
      } else {
        pathError.value = "Path provided does not exist..";
      }
    }

    if(selectedPath.value) {
      validatePath();
    }
    watch([selectedPath, checkRecursively], () => {
      validatePath();
    });
    
    const canInit = computed(() => {
      return !isValidatingPath.value && !needsPathValidation.value && !pathError.value && !!selectedPath.value;
    });

    return {
      foundFiles,
      foundFolders,
      foundDuplicates,
      isValidatingPath,
      canInit,
      handleRestore,
      showRestoreConfirmation,
      isRestoring,
      openFileExplorer,
      needsPathValidation,
      pathError,
      handleGetUniqueCodes,
      codeHasError,
      options,
      maxCpus,
    };
  }
});
</script>

<style lang="scss" scoped>
.validated-path-info {  
  .warning {
    color: yellow !important;
    > div {
      color: yellow !important;
    }
  }
}
.path-info {
  > div {
    &:first-child {
      font-size: 12px;
    }

    &:nth-child(2) {
      color: var(--primary-color);
      font-weight: bold;
    }
  }
}
.replay-file-wrapper {
  display: flex;
  flex-direction: row;
  gap: 5px;
}
.reset-button {
  color: black;
  background-color: rgb(255, 111, 111) !important;
  &:hover {
    background-color: darken(rgb(255, 111, 111), 10%) !important;
  }
}
.restore-confirmation-wrapper {
  top: 0px;
  left: 0px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  width: 100%;
  height: 100%;
  .restore-confirmation-inner {
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
    h2 {
      margin-bottom: 10px;
    }
    h5 {
      margin-top: 15px;
    }
    background-color: var(--card-background-color);
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    border-radius: 5px;
    .restoring {
      opacity: 0.5;
    }
    p {
      margin-bottom: 10px;
    }
    div.button-wrapper {
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: row;
      button {
        margin-left: 10px;
        margin-right: 10px;
      }
    }
  }
}
.setting-option {
  padding-bottom: 10px;
  label {
     padding-right: 5px;
  }
 }
.parralel-warning {
  color: red;
  font-size: 0.9em;
  margin-top: 5px;
}
.setting-form {
  margin-top: 20px;
  max-height: calc(100% - 20px);
  position: relative;
  .setting-options-wrapper {
    overflow-y: auto;
    height: calc(100% - 50px);
    max-height: calc(100% - 50px);
  }
  .browse-button {
    margin-left: 5px;
  }
}
</style>
