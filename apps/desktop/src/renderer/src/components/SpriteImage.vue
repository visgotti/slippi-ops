<template>
  <div class="sprite-container" :style="{ width: rect.w + 'px', height: rect.h + 'px' }">
    <img :src="spriteUrl" :style="imageStyle" />
  </div>
</template>

<script>
export default {
  name: "SpriteImage",
  props: {
    width: {
      type: String,
      required: false
    },
    height: {
      type: String,
      required: false
    },
    rect: {
      type: Object,
      required: true,
      validator: (value) => {
        return (
          "x" in value &&
          "y" in value &&
          "w" in value &&
          "h" in value
        );
      }
    },
    spriteUrl: {
      type: String,
      required: true
    }
  },
  computed: {
    imageStyle() {
      return {
        width: 'auto', // Ensures the whole image is loaded
        height: 'auto',
        transform: `translate(-${this.rect.x}px, -${this.rect.y}px)`
      };
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