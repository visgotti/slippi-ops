<template>
  <div
    class="icon-layout-wrapper"
  >
    <CharacterStockIcon
      :scale=".65"
      :characterName="characterName"
      :characterId="characterId"
    />
    <PercentIcon
      class="percent-icon"
      height="12px"
      :color="percentColor"
    />
  </div>
</template>

<script>

import CharacterStockIcon from "@/components/icons/CharacterStockIcon.vue";
import PercentIcon from "@/components/icons/PercentIcon.vue";

export default {
  name: "CharacterStockIconWithPercentIcon",
  components: {
    CharacterStockIcon,
    PercentIcon
  },
  props: {
    percentColor: {
      type: String,
      required: true
    },
    characterName: {
      type: String,
      required: false
    },
    characterId: {
      type: Number,
      required: false
    },
  },
};
</script>

<style scoped lang="scss">
.icon-layout-wrapper {
  display: flex;
  align-items: center;
  flex-direction: row;
 .percent-icon {
    transform: scale(.7);
    margin-left: -7px;
    margin-top: -8px
  }
}
</style>