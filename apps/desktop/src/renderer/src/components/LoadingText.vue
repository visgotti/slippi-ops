<template>
  <component :is="tag" :style="{ textAlign: alignment, minWidth: maxWidth, display: 'inline-block' }">
    {{ currentText }}
  </component>
</template>

<script>
export default {
  name: 'LoadingText',
  props: {
    tag: {
      type: String,
      default: 'span'
    },
    label: {
      type: String,
      required: true
    },
    resetToElipsesCount: {
      type: [Number, String],
      default: 0
    },
    elipsesCount: {
      type: [Number, String],
      default: 3
    },
    elipsesInterval: {
      type: [Number, String],
      default: 450
    },
    startingEllipses: {
      type: [Number, String],
      default: 1
    },
    left: {
      type: Boolean,
      required: false,
      default: false
    },
    center: {
      type: Boolean,
      required: false,
      default: false
    },
    right: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  data() {
    return {
      currentText: this.label,
      currentEllipses: Number(this.startingEllipses),
      intervalId: null,
      maxWidth: '' // Placeholder for the calculated max width
    };
  },
  computed: {
    alignment() {
      if (this.left) return 'left';
      if (this.center) return 'center';
      if (this.right) return 'right';
      return 'inherit'; // Default alignment if none are set
    }
  },
  mounted() {
    this.validateTextAlignProps();
    this.calculateMaxWidth();
    this.startEllipsesCycle();
  },
  beforeUnmount() {
    clearInterval(this.intervalId);
  },
  methods: {
    validateTextAlignProps() {
      const alignments = [this.left, this.center, this.right];
      const trueCount = alignments.filter(Boolean).length;
      if (trueCount > 1) {
        throw new Error("Only one of 'left', 'center', or 'right' can be true.");
      }
    },
    calculateMaxWidth() {
      // Create a temporary element to calculate the max width
      const tempElement = document.createElement(this.tag);
      tempElement.style.visibility = 'hidden';
      tempElement.style.position = 'absolute';
      tempElement.style.whiteSpace = 'nowrap';
      // Get the computed style of the current component
      const computedStyle = window.getComputedStyle(this.$el);
      tempElement.style.fontSize = computedStyle.fontSize;
      tempElement.style.fontFamily = computedStyle.fontFamily;
      tempElement.style.fontWeight = computedStyle.fontWeight;
      tempElement.style.letterSpacing = computedStyle.letterSpacing;
      tempElement.style.textTransform = computedStyle.textTransform;
      
      tempElement.textContent = this.label + '.'.repeat(Number(this.elipsesCount));
      document.body.appendChild(tempElement);
      this.maxWidth = `${tempElement.offsetWidth + 1}px`;
      document.body.removeChild(tempElement);
    },
    startEllipsesCycle() {
      this.intervalId = setInterval(() => {
        if (this.currentEllipses < Number(this.elipsesCount)) {
          this.currentEllipses += 1;
        } else {
          this.currentEllipses = Number(this.resetToElipsesCount);
        }
        this.currentText = this.label + '.'.repeat(this.currentEllipses);
      }, Number(this.elipsesInterval));
    }
  }
};
</script>

<style scoped>
/* Add any required styles here */
</style>
