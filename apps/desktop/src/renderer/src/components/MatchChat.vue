<template>
  <div class="chat-wrapper">
    <div class="chat-header">
      <h3>Match Chat</h3>
      <button class="primary" :style="{marginRight: '6px'}" @click="() => settingsStore.setStateValue('showChat', !settingsStore.showChat)"> {{ settingsStore.showChat ? 'hide' : 'show' }} </button>
      <CurrentMatchOptionToggle
        label="Opt into chat?"
        :value="settingsStore.optIntoChat"
        @input="settingsStore.setStateValue('optIntoChat', !settingsStore.optIntoChat)"
      />
    </div>

    <div v-if="showChat && optIntoChat" class="chat-body">
      <div class="messages-container">
        <div class="message-scroll">
          <div v-for="(message, index) in messages" :key="index" class="chat-message">
            <strong>{{ message.nickname }}:</strong> {{ message.nickname }}
          </div>
        </div>
  
        <div v-if="waitingForOpponent" class="waiting-message">
          Waiting for opponent to opt into chat...
        </div>
      </div>

      <div v-if="connected && !waitingForOpponent" class="message-input-container">
        <input
          v-model="newMessage"
          :disabled="!canType"
          type="text"
          :placeholder="canType ? 'Type a message...' : 'Waiting for opponent...'"
          @keydown.enter="sendMessage"
          class="message-input"
        />
        <button  :disabled="!canSend" @click="sendMessage" class="send-button primary">Send</button>
      </div>
    </div>

  </div>
</template>

 
 <script lang="ts" setup>
 import { computed, ref, watch, type PropType } from 'vue';

 import { PlayerGameResults } from '@slippiops/types';
 import { useSettingsStore, useChatStore } from '@/store';
import { storeToRefs } from 'pinia';
import CurrentMatchOptionToggle from '@/components/CurrentMatchOptionToggle.vue';
const newMessage = ref('');

 const props = defineProps({
  match: {
    type: Object as PropType<PlayerGameResults>,
    required: true,
  },
  isCurrentMatch: {
    type: Boolean,
    default: false,
  }
 });
 const match = computed(() => props.match);
 const isCurrentMatch = computed(() => props.isCurrentMatch);

 function sendMessage() {
  if (newMessage.value.trim() !== '') {
    chatStore.sendMessage(newMessage.value.trim());
    newMessage.value = '';
  }
}
 const settingsStore = useSettingsStore();
 const showChat = computed(() => settingsStore.showChat);
 const optIntoChat = computed(() => settingsStore.optIntoChat);

 const chatStore =  useChatStore();
 const { chat, messages, connected, connectingToOpponentUserId, waitingForOpponent } = storeToRefs(chatStore);
 
const opponentUserId = computed(() => props.match.opponentUserId);

 watch(opponentUserId, (newV) => {
  chatStore.resetChat();
  if(newV) {
    chatStore.initChat(newV)
  }
 }, { immediate: true });
 const canType = computed(() => connected.value && !waitingForOpponent.value);
 const canSend = computed(() => newMessage.value.trim() !== '' && canType.value);

const needsToToggleConnection = computed(() => {
  return chat.value
  && isCurrentMatch.value
   && match.value
   && opponentUserId.value 
   && opponentUserId.value !== connectingToOpponentUserId.value 
   && optIntoChat.value
  && !connected.value
});

const needsToToggleDisconnect = computed(() => {
  return (connected.value || !!connectingToOpponentUserId.value)
   && !optIntoChat.value 
})


watch(needsToToggleConnection, (newV) => {
  if(newV) {
    chatStore.connect(match.value, opponentUserId.value, match.value.yourUserId);
  }
});
watch(needsToToggleDisconnect, (newV) => {
  if(newV) {
    chatStore.connect(match.value, opponentUserId.value, match.value.yourUserId);
  }
})


</script>

<style scoped lang="scss">
.chat-wrapper {
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 300px;
}

.chat-header {
  display: flex;
  flex-direction: row;
  align-items: center;

 

  > div {
    padding-left: 10px;
    align-items: center;
    display: flex;
    >p {
      font-size: 12px;
      padding-right: 10px;
    }
  }
  h3 {
    margin: 5px;
  }
}

.chat-body {
  flex: 1;
  padding: 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.waiting-message,
.chat-disabled-message {
  text-align: center;
  margin-top: 20px;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 10px;
}

.chat-message {
  margin-bottom: 8px;
}

.message-input-container {
  display: flex;
  gap: 5px;
}

.message-input {
  flex: 1;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.send-button {
  padding: 5px 10px;
  border: none;
  background-color: #007bff;
  color: white;
  border-radius: 4px;
  cursor: pointer;
}

.send-button:hover {
  background-color: #0056b3;
}
</style>