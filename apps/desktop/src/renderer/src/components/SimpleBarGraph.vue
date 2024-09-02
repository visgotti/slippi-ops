<template>
  <div class="bar-graph-container" @mousemove="updateTooltipPosition" @mouseleave="hideTooltip">
    <div class="bar-graph" :class="direction" @mouseover="showTooltip">
      <svg v-if="direction === 'horizontal'" :width="`${length}px`" height="20">
        <rect 
          :width="`${percent}%`" 
          height="100%" 
          :fill="color" 
          :style="{ fill: currentColor }"
        />
        <rect 
          :width="`${100 - percent}%`" 
          :x="`${percent}%`" 
          height="100%" 
          fill="lightgray" 
        />
      </svg>
      <svg v-else :height="`${length}px`" width="20">
        <rect 
          :height="`${percent}%`" 
          width="100%" 
          :y="`${100 - percent}%`" 
          :fill="color" 
          :style="{ fill: currentColor }"
        />
        <rect 
          :height="`${100 - percent}%`" 
          width="100%" 
          fill="lightgray" 
        />
      </svg>
    </div>
    <div v-if="tooltipVisible" class="tooltip" :style="{ top: `${tooltipY}px`, left: `${tooltipX}px` }">
      {{ tooltipText }}: {{ value }} ({{ percent }}%)
    </div>
  </div>
</template>

<script>
import { darkenColor } from '@slippiops/utils';

export default {
  name: 'BarGraph',
  props: {
    percent: {
      type: Number,
      required: true,
      validator: value => value >= 0 && value <= 100,
    },
    value: {
      type: Number,
      required: true,
    },
    direction: {
      type: String,
      default: 'horizontal',
      validator: value => ['horizontal', 'vertical'].includes(value),
    },
    length: {
      type: Number,
      required: true,
      validator: value => value > 0,
    },
    color: {
      type: String,
      default: '#0000ff',
    },
    tooltipText: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      tooltipVisible: false,
      isHovered: false,
      tooltipX: 0,
      tooltipY: 0,
    };
  },
  computed: {
    currentColor() {
      return this.isHovered ? darkenColor(this.color, 0.2) : this.color
    }
  },
  methods: {
    showTooltip() {
      this.tooltipVisible = true;
      this.isHovered = true;
    },
    hideTooltip() {
      this.tooltipVisible = false;
      this.isHovered = false;
    },
    updateTooltipPosition(event) {
      const containerWidth = this.$el.clientWidth;
      const tooltipWidth = 150; // Assuming the tooltip width, adjust this value as needed
      const offsetX = event.offsetX;
      const offsetY = event.offsetY;

      if (offsetX + tooltipWidth > containerWidth) {
        // Position tooltip to the left if it overflows the container
        this.tooltipX = offsetX - tooltipWidth - 10;
      } else {
        // Position tooltip to the right of the cursor
        this.tooltipX = offsetX + 10;
      }

      this.tooltipY = offsetY - 30; // Adjust 30px above the cursor
    },
  }
};
</script>

<style scoped>
.bar-graph-container {
  position: relative;
}

.bar-graph {
  width: 100%;
  height: 100%;
}

.tooltip {
  position: absolute;
  background-color: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 5px;
  border-radius: 3px;
  font-size: 12px;
  z-index: 100;
  pointer-events: none; /* Prevent tooltip from blocking mouse events */
  white-space: nowrap;  /* Prevent tooltip text from wrapping */
}
</style>
