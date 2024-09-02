<template>
  <SpriteImage 
    :spriteUrl="imageUrl"
    :rect="rect"
  />
</template>

<script>
import SpriteImage from "./SpriteImage.vue";
import { getCharacterSelectSpriteRect } from "@slippiops/utils";
export default {
  name: "CharacterSelectImage",
  components: {
    SpriteImage
  },
  props: {
    characterName: {
      type: String,
      required: true
    },
    characterColor: {
      type: Number,
      required: true
    }
  },
  computed: {
    imageUrl() {
      return new URL(`../public/assets/melee_images/character-select.png`, import.meta.url).href;
    },
    rect() {
      return getCharacterSelectSpriteRect(this.characterName, this.characterColor)
    }
  }
};
</script>

<style scoped>
.sprite-container {
  overflow: hidden;
  position: relative;
}

.sprite-container img {
  position: absolute;
  top: 0;
  left: 0;
}
</style>