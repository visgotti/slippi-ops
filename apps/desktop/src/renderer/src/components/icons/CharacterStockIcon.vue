<template>
  <div
    :class="{'show-percent': hasTotalPercentage}"
    :title="percentTitle"
    :style="{transform: `scale(${scale})`}"
  >
    <SpriteImage 
      :spriteUrl="imageUrl"
      :rect="rect"
    />
    <svg width="44" height="44" transform="scale(-1, 1) rotate(-90)"
      v-if="hasTotalPercentage && !hidePercentRing"
    >
        <circle class="bg-circle" r="18" cx="22" cy="22"></circle>
      
        <circle 
          v-if="hasColorPercentage"
          class="fg-circle-extra" 
          r="18" 
          cx="22" 
          cy="22" 
          :stroke-dasharray="circleCircumference"
          :stroke-dashoffset="circleCircumference - (circleCircumference * colorPercentage / 100)">
        </circle>
        <circle class="fg-circle"
          r="18" cx="22" cy="22"
          :stroke-dasharray="circleCircumference"
          :stroke-dashoffset="circleCircumference - (circleCircumference * totalPercentage / 100)">
        </circle>
      </svg>

      <!--
      <svg width="48" height="48" transform="scale(-1, 1) rotate(-90)"
        v-if="hasWinPercentage"
      >
        <circle class="secondary-bg-circle" r="22" cx="22" cy="22"></circle>
        <circle 
          class="secondary-fg-circle" 
          r="22" 
          cx="22" 
          cy="22" 
          :stroke-dasharray="winCircleCircumference"
          :stroke-dashoffset="winCircleCircumference - (winCircleCircumference * winPercentage / 100)">
        </circle>
      </svg>
      -->
  </div>
  
</template>

<script>


const CIRCLE_WIDTH = 4;
const INNER_RADIUS = 16;


import SpriteImage from "@/components/SpriteImage.vue";
import { getCharacterStockIconRect, getCharacterName, isNullOrUndefined } from "@slippiops/utils";

export default {
  name: "CharacterStockIcon",
  components: {
    SpriteImage
  },
  props: {
    scale: {
      type: Number,
      required: false,
      default: 1
    },
    hidePercentRing: {
      type: Boolean,
      default: false
    },
    totalPercentage: {
      type: [Number, String],
      required: false
    },
    colorPercentage: {
      type: [Number, String],
      required: false
    },
    characterName: {
      type: String,
      required: false
    },
    characterId: {
      type: Number,
      required: false
    },
    characterColor: {
      type: Number,
      required: false,
      default: 0,
    }
  },
  computed: {
    imageUrl() {
      return new URL(`../../public/assets/melee_images/character-icons.png`, import.meta.url).href;
    },
    percentTitle() {
      if(this.totalPercentage) {
          return `Played ${this.characterName} ${parseFloat(this.totalPercentage)}% of the time`;
      } else {
        return "";
      }
    },
    hasColorPercentage() {
      return !isNullOrUndefined(this.colorPercentage);
    },
    hasTotalPercentage() {
      return !isNullOrUndefined(this.totalPercentage);
    },
    circleCircumference() {
      return 2 * Math.PI * 18;
    },
    finalCharacterName() {
      if(this.characterName) {
        return this.characterName;
      } else {
        if(this.characterId === undefined) {
          throw new Error(`Expected characterId or characterName prop`);
        }
        return getCharacterName(this.characterId)
      }
    },
    rect() {
      return getCharacterStockIconRect(this.finalCharacterName, this.characterColor)
    }
  }
};
</script>

<style scoped lang="scss">
div {
  min-width: 24px;
  max-width: 24px;
  width: 24px;
  height: 24px;
  min-height: 24px;
  max-height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;

  &.show-percent {
    margin: 10px;
  }

  svg {
    position: absolute;
    left: -10px;
    top: -10px;
    &:nth-of-type(2) {
      left: -14px;
      top: -14px;
    }
  }
}

.bg-circle {
  stroke: #50525A;
  stroke-width: 4;
  fill: transparent;
}

.fg-circle {
  stroke: var(--highlight-blue);
  stroke-width: 4;
  fill: transparent;
  transition: stroke-dashoffset 0.35s;
}

.fg-circle-extra {
  stroke: red;
  stroke-width: 4;
  fill: transparent;
  transition: stroke-dashoffset 0.35s;
}

.icon-container img {
  position: absolute;
  top: 6px; /* Adjusted to fit within the larger circle */
  left: 6px; /* Adjusted to fit within the larger circle */
  width: 32px; /* Adjusted to fit within the larger circle */
  height: 32px; /* Adjusted to fit within the larger circle */
  border-radius: 50%;
}

.usage-percentage {
  font-size: 12px;
  margin-top: 4px;
}
</style>