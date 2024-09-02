<template>
  <div class="double-bar-graph" @mousemove="updateTooltipPosition" @mouseleave="resetHover">
    <svg :width="`${length}px`" height="20">
      <!-- Display sections if data exists -->
      <rect
        v-if="hasData"
        :width="`${section1Percent}%`" 
        height="100%" 
        :fill="computedSection1Color" 
        @mouseover="hoverSection(1, section1Value, section1Percent, section1Label)"
      />
      <rect
        v-if="hasData"
        :x="`${section1Percent}%`"
        :width="`${section2Percent}%`" 
        height="100%" 
        :fill="computedSection2Color" 
        @mouseover="hoverSection(2, section2Value, section2Percent, section2Label)"
      />
      
      <!-- Display gray bar with "No Data" text if no data exists -->
      <rect
        v-else
        width="100%"
        height="100%"
        fill="lightgray"
        @mouseover="hoverSection(null, null, null, 'No Data')"
      />
      <text v-if="!hasData" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="black">
        No Data
      </text>
    </svg>
    <div v-if="tooltipVisible" class="tooltip" :style="{ top: `${tooltipY}px`, left: `${tooltipX}px` }">
      {{ tooltipText }}: {{ tooltipValue }} <span v-if="tooltipPercent">({{ tooltipPercent }}%)</span>
    </div>
  </div>
</template>

<script>
import { darkenColor } from '@slippiops/utils';
export default {
  name: 'DoubleBarGraph',
  props: {
    section1Percent: {
      type: Number,
      required: false, // Allow undefined
      validator: value => value >= 0 && value <= 100,
    },
    section2Percent: {
      type: Number,
      required: false, // Allow undefined
      validator: value => value >= 0 && value <= 100,
    },
    section1Value: {
      type: Number,
      required: false, // Allow undefined
    },
    section2Value: {
      type: Number,
      required: false, // Allow undefined
    },
    section1Label: {
      type: String,
      required: false, // Allow undefined
    },
    section2Label: {
      type: String,
      required: false, // Allow undefined
    },
    section1Color: {
      type: String,
      default: '#00ff00',
    },
    section2Color: {
      type: String,
      default: '#ff0000',
    },
    length: {
      type: Number,
      required: true,
      validator: value => value > 0,
    },
  },
  data() {
    return {
      tooltipVisible: false,
      tooltipText: '',
      tooltipValue: '',
      tooltipPercent: '',
      tooltipX: 0,
      tooltipY: 0,
      hoveredSection: null, // 1 for section1, 2 for section2, null for none
    };
  },
  computed: {
    hasData() {
      return this.section1Percent > 0 || this.section2Percent > 0;
    },
    computedSection1Color() {
      if (this.hoveredSection === 1) {
        return darkenColor(this.section1Color, 0.2);
      }
      return this.section1Color;
    },
    computedSection2Color() {
      if (this.hoveredSection === 2) {
        return darkenColor(this.section2Color, 0.2);
      }
      return this.section2Color;
    }
  },
  methods: {
    hoverSection(section, value, percent, label) {
      this.hoveredSection = section;
      this.tooltipText = label;
      this.tooltipValue = value;
      this.tooltipPercent = this.fixFloat(percent);
      this.tooltipVisible = true;
    },
    resetHover() {
      this.hoveredSection = null;
      this.tooltipVisible = false;
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
    fixFloat(value) {
      if(!value) {
        return 0;
      }
      return parseFloat(value.toFixed(2));
    },
  
  }
};
</script>

<style scoped>
.double-bar-graph {
  position: relative;
  width: fit-content;
}

.tooltip {
  position: absolute;
  background-color: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 5px;
  border-radius: 3px;
  font-size: 12px;
  z-index: 100;
  top: -30px; /* Adjust to position above the bar */
  white-space: nowrap;
  pointer-events: none; /* Prevent tooltip from blocking mouse events */
}
</style>
