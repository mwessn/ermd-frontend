import { defineStore } from 'pinia';
import { ref } from "vue";
import type { UiMessage, UiMessageType } from "@/types/ui/notification.ts";
import { generateId, sleep } from "@/utils/utils.ts";

export const useNotificationStore = defineStore(
  'message',
  () => {
    const messages = ref<UiMessage[]>([]);

    const durationMs = 3000;
    const maxDurationMs = 15000;
    const durationMultiplier = 100;

    const maxMessages = 5;

    const adaptedDurationMs = (message: string) => {
      const duration = durationMs + message.length * durationMultiplier;
      return Math.min(duration, maxDurationMs);
    };

    const show = async (text: string, type: UiMessageType = "warning") => {
      if (text.length > 0) {
        const lastMessage = messages.value[messages.value.length - 1];

        // Check for duplicate text
        if (lastMessage && lastMessage.text === text && lastMessage.type === type) {
          return; // Don't add the message again
        }

        if (messages.value.length >= maxMessages) {
          messages.value.splice(0, 1);
        }

        const id = generateId('ui');

        const duration = adaptedDurationMs(text);

        const message: UiMessage = {
          id,
          text,
          type
        };

        messages.value.push(message);

        await sleep(duration);

        const index = messages.value.indexOf(message);

        if (index != -1) {
          messages.value.splice(index, 1);
        }
      }
    };

    const hide = (id: string) => {
      const index = messages.value.findIndex(it => it.id == id);

      if (index != -1) {
        messages.value.splice(index, 1);
      }
    };

    const hideAll = () => {
      messages.value = [];
    };

    return {
      messages,
      show,
      hide,
      hideAll
    };
  }
);