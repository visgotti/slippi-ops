<template>
  <div
    :title="title"
    :style="{transform: `scale(${scale})`}"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      :style="{ backgroundColor, width, height, fill: color }"
    >
      <path id="Layer" fill-rule="evenodd" class="shp0" d="M233 117.92C233 118.18 232.99 118.44 232.97 118.7C232.95 118.96 232.93 119.22 232.89 119.47C232.86 119.73 232.81 119.99 232.76 120.24C232.71 120.5 232.65 120.75 232.58 121L203.79 169.58L193.15 151.33L176.14 182.95L166.38 170L131.38 219L91.02 167.04L71.28 189.37L24.8 124.17L24.49 123.68L24.12 123.03L24.12 122.54C23.96 122.17 23.81 121.8 23.69 121.42C23.56 121.04 23.46 120.65 23.37 120.26C23.29 119.87 23.22 119.47 23.17 119.07C23.13 118.67 23.1 118.27 23.09 117.87C23.09 113.6 23.09 107.19 29.18 107.19L148.18 107.19L148.18 146.27L163 137.68L200.05 116.01L202.39 114.68L203.69 112.34L206.63 107.21L227 107.21C233 107.23 233 113.65 233 117.92ZM185.96 37.14L222.97 58.33L194.97 107.51L157.91 129.19L157.91 86.33L185.96 37.14Z" />
    </svg>
  </div>
</template>

<script>
export default {
  name: 'StageIcon',
  props: {
    scale: {
      type: Number,
      default: 1
    },
    title: {
      type: String,
      default: ''
    },
     backgroundColor: {
      type: String,
      default: 'transparent'
    },
    color: {
      type: String,
      default: 'black'
    },
    width: {
      type: String,
      default: 'auto'
    },
    height: {
      type: String,
      default: '25px'
    }
  }
};
</script>

<style scoped>
/* The scoped style is not necessary for resizing */
</style>
