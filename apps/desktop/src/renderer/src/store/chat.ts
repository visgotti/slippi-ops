// stores/useChatStore.ts
import { useGlobals } from '@/composables';
import { Chat, ChatMessage, PlayerGameResults } from '@slippiops/types';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useChatStore = defineStore('chat', () => {
    const { $upsertPlayerChat, $addChatMessage } = useGlobals();

    const socket = ref<WebSocket | null>(null);
    const messages = ref<Array<ChatMessage>>([]);
    const connected = ref(false);
    const closed = ref(false);
    const waitingForOpponent = ref(true);
    const connectingToOpponentUserId = ref('');

    const match = ref<PlayerGameResults | null>(null); 

    const chat = ref<Chat | null>(null);

    const connect = (m: PlayerGameResults, userId: string, opponentUserId: string) => {
        resetChat();
        match.value = m;
        waitingForOpponent.value = true;
        connectingToOpponentUserId.value = opponentUserId;
        closed.value = false;
        socket.value = new WebSocket(`ws://${window.location.hostname}:8080`);

        socket.value.addEventListener('open', () => {
          connected.value = true;
          console.log('Connected to WebSocket server');
          if(!match.value) return;
          socket.value?.send(JSON.stringify({ type: 'join', matchId: match.value.matchId, userId, opponentUserId }));
        });
        
        socket.value.addEventListener('close', () => {
          closed.value = true;
          resetChat();
        });

        socket.value.addEventListener('message', (event) => {
          if(!chat.value || !match.value) { return }
          const { data, type } = JSON.parse(event.data);
          switch(type) {
            case 'message':
              const { content } = data;
              $addChatMessage({
                nickname: match.value.opponentNickname,
                chatId: chat.value.id,
                playerId: -1,
                content,
                sentAt: `${Date.now()}`
              }).then(m => {
                messages.value.push(m);
              })
              break;
            case 'connected':
              waitingForOpponent.value = false;
              break;
          }
        });
    };

    const sendMessage = (content: string) => {
        if (socket.value && content && chat.value && match.value) {
            socket.value.send(JSON.stringify({ type: 'message', content }));

            const message : any = {
              chatId: chat.value.id,
              playerId: -1,
              content,
              sentAt: `${Date.now()}`
            }
            messages.value.push(message);

            $addChatMessage({
              nickname: match.value.yourNickname,
              chatId: chat.value.id,
              playerId: -1,
              content,
              sentAt: `${Date.now()}`
            }).then(m => {
              message.id = m.id;
            })
        }
    };

    const resetChat = () => {
      match.value = null;
      waitingForOpponent.value = true;
      connected.value = false;
      connectingToOpponentUserId.value = '';
      messages.value = [];
      socket.value?.close();
      socket.value = null;
    }

    const initChat = (opponentUserId: string) => {
      $upsertPlayerChat(opponentUserId).then(c => {  
        chat.value = c.chat;
        messages.value = c.messages;
      });
    }

    return {
      waitingForOpponent,
      connected,
      connectingToOpponentUserId,
      messages,
      chat,
      initChat,
      resetChat,
      connect,
      sendMessage,
    };
});
