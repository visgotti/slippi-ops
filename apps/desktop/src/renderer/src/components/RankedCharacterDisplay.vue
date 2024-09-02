<template>
  <div class="character-info">
    <span>{{ character.name }}</span>
    <div class="icon-container">
      <img :src="iconSrc" alt="Character Icon" class="character-icon" />
      <svg width="44" height="44" class="progress-circle">
        <circle stroke="#50525A" stroke-width="4" fill="transparent" r="18" cx="22" cy="22"></circle>
        <circle
          :stroke-dasharray="circleCircumference"
          :stroke-dashoffset="calculateDashOffset"
          stroke="#2ECC40"
          stroke-width="4"
          fill="transparent"
          r="18"
          cx="22"
          cy="22"
        ></circle>
      </svg>
    </div>
    <span>{{ percentage }}%</span>
  </div>
</template>

<script>
import { getCharacterPercentage } from '@slippiops/utils';
export default {
  props: {
    character: Object,
    rank: Object,
    iconSrc: String
  },
  computed: {
    circleCircumference() {
      const radius = 18;
      return 2 * Math.PI * radius;
    },
    percentage() {
      return getCharacterPercentage(this.character, this.rank);
    },
    calculateDashOffset() {
      return this.circleCircumference - (this.circleCircumference * this.percentage) / 100;
    }
  },
}
</script>

<style>
.character-info {
  display: flex;
  align-items: center;
}

.icon-container {
  position: relative;
}

.character-icon {
  width: 20px;
  height: 20px;
  position: absolute;
  top: 12px;
  left: 12px;
  transform: translate(-50%, -50%);
}

.progress-circle {
  margin: 0 5px;
}
</style>
