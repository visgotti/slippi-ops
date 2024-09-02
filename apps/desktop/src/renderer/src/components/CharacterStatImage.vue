<template>
  <SpriteImage 
    :spriteUrl="imageUrl"
    :rect="rect"
  />
</template>

<script>
import SpriteImage from "./SpriteImage.vue";
import { getCharacterStatImageRect, getCharacterName } from "@slippiops/utils";
export default {
  name: "CharacterStatImage",
  components: {
    SpriteImage
  },
  props: {
    characterName: {
      type: String,
      required: false
    },
    characterId: {
      type: Number,
      required: false,
    },
  },
  computed: {
    imageUrl() {
      return new URL(`../public/assets/melee_images/character-stat.png`, import.meta.url).href;
    },
    rect() {
      const characterName = this.characterName || getCharacterName(this.characterId);
      if(!characterName)  {
        throw new Error(`Pass in valid characterName or characterId prop`);
      }
      return getCharacterStatImageRect(characterName)
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