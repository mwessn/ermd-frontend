import { defineStore } from 'pinia';
import { ref } from "vue";
import type { UiMessage, UiMessageType } from "@/types/ui/notification.ts";
import { generateId } from "@/utils/utils.ts";

export const useNotificationStore = defineStore(
  'notifications',
  () => {
    const messages = ref<UiMessage[]>([]);
    const timers = new Map<string, ReturnType<typeof setTimeout>>();

    const durationMs = 3000;
    const maxDurationMs = 15000;
    const durationMultiplier = 100;

    const maxMessages = 5;

    const adaptedDurationMs = (message: string) => {
      const duration = durationMs + message.length * durationMultiplier;
      return Math.min(duration, maxDurationMs);
    };

    const show = (text: string, type: UiMessageType = "warning") => {
      if (text.length > 0) {
        const lastMessage = messages.value[messages.value.length - 1];

        // Check for duplicate text
        if (lastMessage && lastMessage.text === text && lastMessage.type === type) {
          return;
        }

        if (messages.value.length >= maxMessages) {
          const removed = messages.value.splice(0, 1)[0];
          clearTimer(removed.id);
        }

        const id = generateId('ui');
        const duration = adaptedDurationMs(text);

        const message: UiMessage = {
          id,
          text,
          type
        };

        messages.value.push(message);

        timers.set(id, setTimeout(() => {
          timers.delete(id);
          const index = messages.value.indexOf(message);
          if (index != -1) {
            messages.value.splice(index, 1);
          }
        }, duration));
      }
    };

    const clearTimer = (id: string) => {
      const timer = timers.get(id);
      if (timer) {
        clearTimeout(timer);
        timers.delete(id);
      }
    };

    const hide = (id: string) => {
      clearTimer(id);
      const index = messages.value.findIndex(it => it.id == id);
      if (index != -1) {
        messages.value.splice(index, 1);
      }
    };

    const hideAll = () => {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      timers.clear();
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
