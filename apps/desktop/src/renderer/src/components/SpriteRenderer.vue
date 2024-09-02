<template>
  <div>
    <canvas ref="spriteCanvas" :width="rect.w" :height="rect.h"></canvas>
  </div>
</template>

<script>
export default {
  name: "SpriteRenderer",
  props: {
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
  mounted() {
    this.drawSprite();
  },
  watch: {
    rect: {
      handler() {
        this.drawSprite();
      },
      deep: true
    }
  },
  methods: {
    drawSprite() {
      const { x, y, w, h } = this.rect;
      const canvas = this.$refs.spriteCanvas;
      const context = canvas.getContext("2d");
      const image = new Image();
      image.src = this.spriteUrl;

      image.onload = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(
          image,
          x, y, w, h, // Source rectangle
          0, 0, w, h  // Destination rectangle
        );
      };
    }
  }
};
</script>

<style scoped>
canvas {
  border: 1px solid #000;
}
</style>
