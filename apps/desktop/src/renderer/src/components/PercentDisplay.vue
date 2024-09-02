<template>
 <div
  class='percent-display opponent'
  :class="percentConditionType"
  >
  <div v-if="percentConditionType === 'between'">
    <span class="label">between</span> 
    <span class="value">{{ percentStart }}%</span>
    <span class="label"> and</span>
    <span class="value">{{ percentEnd }}%</span>
  </div>
  <div v-else>
    <span class="label">{{ percentConditionType}}&nbsp;than</span> 
    <span class="value">{{ singlePercent }}%</span>
  </div>
</div>
</template>

<script lang="ts">
export default {
  props: {
    percentConditionType: {
      type: String,
      required: true,
    },
    percentStart: {
      type: Number,
      required: false,
    },
    percentEnd: {
      type: Number,
      required: false,
    }
  },
  computed: {
    singlePercent() {
      if(this.percentEnd || this.percentEnd === 0) {
        return this.percentEnd;
      } else {
        return this.percentStart;
      }
    }
  }
}
</script>

<style lang="scss" scoped>

.percent-display {
  .value {
    margin-left: 5px;
    font-weight: 1000;
  }
}
.percent-display {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
  font-weight: bold;
}


.percent-display.between .label {
  color: #1890ff; /* Bright blue text */
}

.percent-display.greater .label {
  color: #ffa940; /* Bright orange text */
}

.percent-display.less .label {
  color: #f5222d; /* Bright red text */
}

</style>