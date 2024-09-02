<template>
 <div
    :title="title"
  >
  <svg 
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 384 512"
    :style="{ backgroundColor, width, height, fill: color}"
  > 
    <title v-if="title"> {{ title }} </title>
    <path d="M374.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-320 320c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l320-320zM128 128A64 64 0 1 0 0 128a64 64 0 1 0 128 0zM384 384a64 64 0 1 0 -128 0 64 64 0 1 0 128 0z"/>
  </svg>
</div>
</template>

<script>
export default {
  name: 'PercentIcon',
  props: {
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
      default: '20px'
    }
  }
};
</script>

<style scoped>
/* The scoped style is not necessary for resizing */
</style>
