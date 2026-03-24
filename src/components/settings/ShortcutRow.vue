<template>
    <div
      class="flex items-center justify-between py-2 px-3 rounded
             bg-backgroundDark mb-1.5"
    >
      <span class="text-textColor text-sm truncate mr-2">
        {{ $t(actionLabel) }}
      </span>

      <div class="flex items-center gap-2 shrink-0">
        <template v-if="locked">
          <KeyDisplay :text="displayKey" :square="false" />
          <FontAwesomeIcon
            :icon="faLock"
            class="text-accentGray text-xs"
            :title="$t('settings.shortcuts.locked')"
          />
        </template>
        <template v-else>
          <input
            ref="captureInput"
            readonly
            class="w-0 h-0 opacity-0 absolute"
            @keydown.prevent="onKeyCapture"
            @blur="cancelListening"
          >
          <div
            class="cursor-pointer flex items-center gap-1"
            @click="startListening"
          >
            <div
              v-if="listening"
              class="border border-monolithicCyanTsunami rounded px-2 py-0.5
                     text-sm text-monolithicCyanTsunami animate-pulse"
            >
              {{ $t('settings.shortcuts.pressKey') }}
            </div>
            <KeyDisplay
              v-else
              :text="displayKey"
              :square="false"
              class="hover:opacity-80"
            />
          </div>
        </template>
      </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef, nextTick } from "vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faLock } from "@fortawesome/free-solid-svg-icons";
import KeyDisplay from "@/components/core/KeyDisplay.vue";
import { formatFullShortcut } from "@/utils/shortcutUtils.ts";
import type { ShortcutGroup } from "@/types/shortcuts.ts";

const MODIFIER_KEYS = new Set(['control', 'shift', 'alt', 'meta']);

interface ShortcutRowBinding {
  group: ShortcutGroup;
  key: string;
}

const props = defineProps<{
  actionLabel: string;
  binding: ShortcutRowBinding | undefined;
  locked: boolean;
}>();

const emit = defineEmits<{
  rebind: [newGroup: ShortcutGroup, newKey: string];
}>();

const listening = ref<boolean>(false);
const captureInput = useTemplateRef<HTMLInputElement>('captureInput');

const displayKey = computed(() => props.binding ? formatFullShortcut(props.binding.group, props.binding.key) : '—');

const startListening = async () => {
  listening.value = true;
  await nextTick();
  captureInput.value?.focus();
};

const cancelListening = () => {
  listening.value = false;
};

const onKeyCapture = (evt: KeyboardEvent) => {
  const key = evt.key.toLowerCase();
  if (MODIFIER_KEYS.has(key)) return;

  let newGroup: ShortcutGroup;
  let newKey: string;

  if (evt.ctrlKey) {
    newGroup = 'ctrl';
    newKey = evt.shiftKey ? `shift+${key}` : key;
  } else if (evt.altKey) {
    newGroup = 'alt';
    newKey = key;
  } else if (evt.shiftKey) {
    newGroup = 'shift';
    newKey = key;
  } else {
    newGroup = 'keys';
    newKey = key;
  }

  listening.value = false;
  emit('rebind', newGroup, newKey);
};
</script>
