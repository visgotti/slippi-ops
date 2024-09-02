<template>
  <div
    class='character-note'
    :key="note.id"
    :class="{
      percent: !!note.opponentPercentConditionType && !!note.yourPercentConditionType,
      'your-percent': !!note.yourPercentConditionType && !note.opponentPercentConditionType,
      'opponent-percent': !!note.opponentPercentConditionType && !note.yourPercentConditionType,
    }"> 
    <div class="percent-display-wrapper">
      <PercentDisplay v-if="!!note.opponentPercentConditionType"
        :percentConditionType="note.opponentPercentConditionType"
        :percentStart="note.opponentPercentStart ?? undefined"
        :percentEnd="note.opponentPercentEnd ?? undefined"
        class="opponent"
      />
      <PercentDisplay v-if="!!note.yourPercentConditionType"
        :percentConditionType="note.yourPercentConditionType"
        :percentStart="note.yourPercentStart ?? undefined"
        :percentEnd="note.yourPercentEnd ?? undefined"
        class="you"
      />
    </div>

    <div class='note-content'>
      <span> {{ note.content }}</span>
    </div>
    <div class="icon-wrapper">
      <StageIcon 
        v-if="note.stageIds?.length"
        title="This note is configured to show on selected stages." 
        color="#fefefe"
        height="20px"
      />
  
      <PercentIcon 
        v-if="!!note.opponentPercentConditionType"
        title="This note is configured to show when the opponent's percent matches the criteria." 
        color="red"
        height="15px"
      />
      
      <PercentIcon 
        v-if="!!note.yourPercentConditionType"
        title="This note is configured to show when your percent matches the criteria."
        color="#5cf28b"
        height="15px"
      />
  
    </div>
  </div>
 </template>
 
 <script lang="ts">
 import type { PropType } from 'vue';
 import { isNullOrUndefined } from '@slippiops/utils';
 import PercentDisplay from '@/components/PercentDisplay.vue';
 import StageIcon from '@/components/icons/StageIcon.vue';
 import PercentIcon from '@/components/icons/PercentIcon.vue';
 import CharacterStockIcon from '@/components/icons/CharacterStockIcon.vue';
 import CharacterStockIconWithPercentIcon from '@/components/icons/CharacterStockIconWithPercentIcon.vue';
 import { LiveCharacterNote } from '@slippiops/types';
 import { getCharacterName } from '@slippiops/utils';

 export default {
   components: {
     PercentDisplay,
     PercentIcon,
     StageIcon,
     CharacterStockIcon,
     CharacterStockIconWithPercentIcon
   },
   methods: {
     isNullOrUndefined
   },
   props: {
     note: {
       type: Object as PropType<LiveCharacterNote>,
       required: true,
     },
   },
   computed: {
    characterTooltip() {
      return `This note is configured to show whenever you play against ${getCharacterName(this.note.characterId)}`
    }
   }
 }
 </script>
 
 <style lang="scss" scoped>
 
 @mixin flash($flash-color, $default-color, $duration: .7s, $identifier) {
   @keyframes flash-#{$identifier} {
     0% {
       background-color: $flash-color; /* Flash color */
     }
     50% {
       background-color: $default-color; /* Return to normal background */
     }
     100% {
       background-color: $default-color; /* Ensure it stays at normal background */
     }
   }
   animation: flash-#{$identifier} $duration ease-in-out;
 }
 
 
 .notes-wrapper {
   display: flex;
   flex-direction: column;
   gap: 10px;
   padding: 10px;
   &.character-notes {
     max-height: 100%;
     overflow-y: auto;
   }
   h3 {
     margin: 5px;
   }
   .notes-list-wrapper {
     overflow-y: auto;
     overflow-x: hidden;
   }
 }
 .character-note {
   position: relative;
   padding: 10px;
   border-radius: 5px;
   font-family: Arial, sans-serif;
   box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
   background-color: #2b2b2b; /* Darker background for dark theme */
   color: #f0f0f0; /* Light text color for contrast */
   .icon-wrapper {
     position: absolute;
     top: 0px;
     right: 3px;
     display: flex;
     flex-direction: row;
     justify-content: right;
     align-items: center;
     gap: 4px;
     img {
       max-height: 25px;
       width: auto;
       &.percent {
         max-height: 15px;
       }
     }
   }
 }
 
 .character-note {
   background-color: #2b2b2b; /* Dark grey background */
   border-left: 5px solid #595959; /* Light grey border */
   @include flash(#595959, #2b2b2b, .7s, "default"); /* Flash color and background color */
 }
 
 .character-note.opponent-percent {
   background-color: #420303; /* Darker red background */
   border-left: 5px solid #ff1818; /* Bright red border */
   @include flash(#ff1818, #420303, .7s, "percent-stage"); /* Default flash color and background color */
 }
 
 .character-note.your-percent {
   border-left: 5px solid #52c41a; /* Bright green border */
   background-color: #2b3621; /* Darker green background */
   @include flash(#52c41a, #2b3621, .7s, "stage"); /* Flash color and background color */
 }
 
 .character-note.percent {
   border-left: 5px solid #ffdd30; /* Bright yellow border */
   background-color: #695700; /* Darker yellow background */
   @include flash(#ffdd30, #695700, .7s, "stage"); /* Flash color and background color */
 }
 
 .character-note.percent.stage {
   background-color: #1c2b36; /* Darker blue background */
   border-left: 5px solid #1890ff; /* Bright blue border */
   @include flash(#1890ff, #1c2b36, .7s, "percent-stage"); /* Default flash color and background color */
 }
 
 .character-note.percent {
   background-color: #3a2b1c; /* Darker orange background */
   border-left: 5px solid #ffa940; /* Bright orange border */
   @include flash(#ffa940, #3a2b1c, .7s, "percent"); /* Flash color and background color */
 }
 
 .character-note.stage {
   background-color: #2b3621; /* Darker green background */
   @include flash(#52c41a, #2b3621, .7s, "stage"); /* Flash color and background color */
 }
 
 :deep(.percent-display) {
   .value {
       color: #f0f0f0; /* Light text color */
   }
   &.you {
     .value {
      // color: #52eb82; /* Bright green text */
     }
   }
   &.opponent {
     .value {
      //  color: #ff195e; /* Bright red text */
     }
   }
 }
 
 .label {
   font-size: 12px;
   text-transform: uppercase;
   color: #f0f0f0; /* Light text color */
 }
 
 .value {
   font-size: 14px;
   font-weight: bold;
   color: #f0f0f0; /* Light text color */
 }
 
 </style>