<template>
  <div class="character-stat-item">
    <div class="character-stat-item-preview"
       @click="toggleExpanded"
       :title="!expanded ? 'Click the row to see win and loss % by stages' : ''"
    >
      <CharacterStatImage 
        :characterId="characterId"
      />
      <div class="graphs">
        <!-- DoubleBarGraph for Win and Loss Percentages -->
        <DoubleBarGraph 
          :section1Percent="stats.winRate || 0"
          :section2Percent="stats.lossRate || 0"
          :section1Value="stats.timesWonAgainst || 0"
          :section2Value="stats.timesLostAgainst || 0"
          :section1Color="'#48a14d'"
          :section2Color="'#C40233'"
          section1Label="Wins"
          section2Label="Losses"
          :length="graphLength"
        />
        <!-- SimpleBarGraph for Percentage Played Against -->
        <SimpleBarGraph 
          :percent="stats.percentagePlayedAgainst"
          :value="stats.timesPlayedAgainst || 0"
          :length="graphLength"
          color="#0000ff"
          tooltipText="Times Played Against"
        />
      </div>
      <div class="arrow-container">
        <span :class="{'arrow-down': expanded, 'arrow-left': !expanded}">◀</span>
      </div>
    </div>
    
    <!-- Expanded view -->
    <div v-if="expanded" class="character-stat-item-expanded">
      <div v-for="(stageStats, stageId) in stats.byStage" :key="stageId" class="stage-stat">
        <div class="stage-row">
          <StageSelectImage 
            :stageId="stageId"
            width="80px"
            height="80px"
          />
          <div class="graphs stage-graphs">
            <DoubleBarGraph 
              :section1Percent="stageStats.winRate || 0"
              :section2Percent="stageStats.lossRate || 0"
              :section1Value="stageStats.timesWonAgainst || 0"
              :section2Value="stageStats.timesLostAgainst || 0"
              :section1Color="'#48a14d'"
              :section2Color="'#C40233'"
              section1Label="Wins"
              section2Label="Losses"
              :length="graphLength"
            />
          </div>    
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import CharacterStatImage from '@/components/CharacterStatImage.vue';
import DoubleBarGraph from '@/components/DoubleBarGraph.vue';
import SimpleBarGraph from '@/components/SimpleBarGraph.vue';
import StageSelectImage from '@/components/StageSelectImage.vue';

export default {
  name: "CharacterStatItem",
  components: {
    CharacterStatImage,
    DoubleBarGraph,
    SimpleBarGraph,
    StageSelectImage,
  },
  props: {
    stats: {
      type: Object,
      required: true,
    },
    totalGamesPlayed: {
      type: Number,
      required: true,
    },
    characterId: {
      type: Number,
      required: true
    },
  },
  data() {
    return {
      expanded: false,
      windowWidth: window.innerWidth
    };
  },
  computed: {
    graphLength() {
      if (this.windowWidth < 550) {
        return Math.max(100, 300 - ((550 - this.windowWidth) / 50) * 50);
      } else {
        return 300;
      }
    }
  },
  methods: {
    handleResize() {
      this.windowWidth = window.innerWidth;
    },
    toggleExpanded() {
      this.expanded = !this.expanded;
    }
  },
  mounted() {
    window.addEventListener('resize', this.handleResize);
  },
  unmounted() {
    window.removeEventListener('resize', this.handleResize);
  }
};
</script>

<style scoped>.character-stat-item {
  display: flex;
  flex-direction: column;
  background-color: #222; /* Add a background color for separation */
  margin: 10px 0; /* Add vertical margin to separate items */
  padding: 10px; /* Add padding for spacing within the item */
  border-radius: 8px; /* Round the corners slightly */
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.2); /* Add a subtle shadow */
}

.character-stat-item-preview {
  display: flex;
  flex-direction: row;
  align-items: center;
  cursor: pointer;
  justify-content: flex-start;
}

.graphs {
  display: flex;
  flex-direction: column;
  margin-left: 20px;
}

.arrow-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 10px;
  cursor: pointer;
}

.arrow-left {
  transform: rotate(0deg);
  transition: transform 0.3s ease;
}

.arrow-down {
  transform: rotate(90deg);
  transition: transform 0.3s ease;
}

.character-stat-item-expanded {
  margin-top: 10px;
}

.stage-stat {
  margin-top: 20px;
}

.stage-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 10px;
}

.character-stat {
  margin-top: 10px;
}

.arrow-left {
  transform: rotate(0deg);
  transition: transform 0.15s ease;
}
.arrow-down {
  transform: rotate(-90deg);
  transition: transform 0.15s ease;
}
.character-stat-item-expanded {
  margin-top: 10px;
}
.stage-stat {
  margin-top: 0px;
}
.stage-row {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.character-stat {
  margin-top: 10px;
}
</style>
