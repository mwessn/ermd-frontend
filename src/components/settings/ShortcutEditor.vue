<template>
    <div class="text-left">
      <template v-for="(displayGroup, index) in SHORTCUT_DISPLAY_GROUPS" :key="index">
        <div class="font-bold text-accentGray my-3">
          {{ $t(displayGroup.label) }}
        </div>

        <ShortcutRow
          v-for="action in displayGroup.actions"
          :key="action"
          :action-label="BIND_ACTION_LABELS[action]"
          :binding="findBinding(action)"
          :locked="LOCKED_ACTIONS.has(action)"
          @rebind="(newGroup, newKey) => onRebind(action, newGroup, newKey)"
        />

        <div
          v-if="index !== SHORTCUT_DISPLAY_GROUPS.length - 1"
          class="w-full my-4 border-b-2 border-b-backgroundDark"
        />
      </template>

      <div class="mt-6 mb-4">
        <button
          class="w-full p-2 rounded bg-backgroundDark text-textColor
                 hover:opacity-80 cursor-pointer flex items-center justify-center gap-2"
          @click="onResetDefaults"
        >
          <FontAwesomeIcon :icon="faRotateLeft" />
          {{ $t('settings.shortcuts.resetDefaults') }}
        </button>
      </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useSettingsStore } from "@/store/settings.ts";
import { useNotificationStore } from "@/store/ui/notifications.ts";
import { useI18n } from "vue-i18n";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import ShortcutRow from "@/components/settings/ShortcutRow.vue";
import {
  BIND_ACTION_LABELS,
  LOCKED_ACTIONS,
  SHORTCUT_DISPLAY_GROUPS,
  type KeyboardBindAction,
  type ShortcutGroup,
} from "@/types/shortcuts.ts";
import { findActionBinding } from "@/utils/shortcutUtils.ts";

const settingsStore = useSettingsStore();
const notificationStore = useNotificationStore();
const { t } = useI18n();

const shortcuts = computed(() => settingsStore.currentSettings.shortcuts);

function findBinding(action: KeyboardBindAction) {
  return findActionBinding(shortcuts.value, action);
}

const onRebind = (action: KeyboardBindAction, newGroup: ShortcutGroup, newKey: string) => {
  const current = findActionBinding(shortcuts.value, action);

  // 1. Remove action from old group (if any)
  if (current) {
    const rebuilt: Record<string, KeyboardBindAction> = {};
    for (const [k, v] of Object.entries(shortcuts.value[current.group])) {
      if (k !== current.key) rebuilt[k] = v;
    }
    shortcuts.value[current.group] = rebuilt;
  }

  // 2. Check for conflict in destination group
  const conflicting = shortcuts.value[newGroup][newKey];
  if (conflicting) {
    notificationStore.show(
      t('notifications.shortcutReassigned', {
        key: newKey,
        oldAction: t(BIND_ACTION_LABELS[conflicting]),
        newAction: t(BIND_ACTION_LABELS[action]),
      }),
      'warning'
    );
    // Remove conflicting entry
    const rebuilt: Record<string, KeyboardBindAction> = {};
    for (const [k, v] of Object.entries(shortcuts.value[newGroup])) {
      if (k !== newKey) rebuilt[k] = v;
    }
    shortcuts.value[newGroup] = rebuilt;
  }

  // 3. Add action at the new key
  shortcuts.value[newGroup][newKey] = action;
};

const onResetDefaults = () => {
  settingsStore.resetShortcuts();
};
</script>
