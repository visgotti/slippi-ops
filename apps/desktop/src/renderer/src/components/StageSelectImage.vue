<template>
  <div
    :style="{width: width || 'auto', height: height || 'auto', transform: `scale(${scale})`}"
  >
    <img 
      :src="filePath"
    />
  </div>
</template>

<script>
import { stageToImageLookup } from '@slippiops/utils';
export default {
  name: "StageSelectImage",
  components: {
  },
  props: {
    scale: {
      type: Number,
      default: 1
    },
    width: {
      type: String,
      required: false
    },
    height: {
      type: String,
      required: false
    },
    stageName: {
      type: String,
      required: false
    },
    stageId: {
      type: [String, Number],
      required: false,
    }
  },
  computed: {
    filePath() {
      return new URL(`../public/assets/melee_images/stages/${this.fileName}`, import.meta.url).href;
    },  
    fileName() {
      if(this.stageName && this.stageName in stageToImageLookup) {
        return stageToImageLookup[this.stageName];
      }
      if(this.stageId && this.stageId in stageToImageLookup) {
        return stageToImageLookup[this.stageId];
      }
    }
  }
};
</script>

<style scoped>
div {
  display: flex;
  justify-content: center;
  align-items: center;
}
img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain; 
}
</style>