<template>
    <div
      class="fixed left-0 h-full w-left-menu-width
       bg-accentDarkGray transition-transform duration-300 text-center
        pt-4 mt-header-height z-50
        border-r border-backgroundDark"
      :class="[visible ? 'translate-x-0' : '-translate-x-full',
               disabled ? 'pointer-events-none' : '']"
    >
      <template v-for="(section, index) in sections" :key="index">
        <Tooltip
          v-for="(item, itemIndex) in section.items"
          :key="itemIndex"
          :text="item.hint"
          :button="item.button"
          :aria-label="$t(item.hint)"
          tabindex="0"
          @keyup.enter="execAction(item.action)"
        >
          <div
            class="p-2 hover:opacity-50 text-lycheeIce cursor-pointer relative"
            @click="execAction(item.action)"
          >
            <FontAwesomeIcon :icon="item.pic" />
          </div>
        </Tooltip>

        <div
          v-if="index !== sections.length - 1"
          class="border border-accentGray mx-1 my-4"
        />
      </template>
    </div>
</template>

<script setup lang="ts">
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faArrowRight,
  faArrowsUpDownLeftRight,
  faChevronCircleRight,
  faChevronRight, faCircleArrowRight,
  faCircleInfo,
  faComment,
  faFile,
  faFileArrowDown,
  faFileArrowUp,
  faObjectGroup,
  faTable
} from "@fortawesome/free-solid-svg-icons";
import { useActionsStore } from "@/store/action.ts";
import { useSettingsStore } from "@/store/settings.ts";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { appConfig } from "@/app.config.ts";
import Tooltip from "@/components/core/Tooltip.vue";
import { resetFocus } from "@/utils/utils.ts";
import { computed } from "vue";
import type { KeyboardBindAction } from "@/types/shortcuts.ts";
import { findActionBinding, formatFullShortcut } from "@/utils/shortcutUtils.ts";

withDefaults(defineProps<{
  visible: boolean
  disabled?: boolean
}>(), {
  disabled: false
});

const emit = defineEmits([
  'openImportModal',
  'openExportModal',
  'openNewProjectModal',
  'openMainMenu'
]);

const actionStore = useActionsStore();
const settingsStore = useSettingsStore();

interface MenuItem {
  pic: IconDefinition;
  hint: string;
  button?: string;
  action: () => void;
}

const execAction = (action: () => void) => {
  action();
  resetFocus();
};

const getButtonLabel = (action: KeyboardBindAction): string | undefined => {
  const binding = findActionBinding(settingsStore.currentSettings.shortcuts, action);
  return binding ? formatFullShortcut(binding.group, binding.key) : undefined;
};

const functionsMenuTopItems = computed((): readonly MenuItem[] => [
  {
    pic: faTable,
    hint: 'actions.createTable',
    button: getButtonLabel('canvas.createTable'),
    action: () => {
      actionStore.setAction('table');
    }
  },
  {
    pic: faArrowRight,
    hint: 'actions.nonIdentifyingOneToOne',
    button: getButtonLabel('canvas.createNoto'),
    action: () => {
      actionStore.setAction('noto');
    }
  },
  {
    pic: faCircleArrowRight,
    hint: 'actions.identifyingOneToOne',
    button: getButtonLabel('canvas.createIoto'),
    action: () => {
      actionStore.setAction('ioto');
    }
  },
  {
    pic: faChevronRight,
    hint: 'actions.nonIdentifyingOneToMany',
    button: getButtonLabel('canvas.createNotm'),
    action: () => {
      actionStore.setAction('notm');
    }
  },
  {
    pic: faChevronCircleRight,
    hint: 'actions.identifyingOneToMany',
    button: getButtonLabel('canvas.createIotm'),
    action: () => {
      actionStore.setAction('iotm');
    }
  },
  {
    pic: faArrowsUpDownLeftRight,
    hint: 'actions.manyToMany',
    button: getButtonLabel('canvas.createMtm'),
    action: () => {
      actionStore.setAction('mtm');
    }
  },
]);

const functionsCommentItems = computed((): readonly MenuItem[] => [
  {
    pic: faComment,
    hint: 'actions.comment',
    button: getButtonLabel('canvas.createComment'),
    action: () => {
      actionStore.setAction('comment');
    }
  },
  {
    pic: faObjectGroup,
    hint: 'actions.group',
    button: getButtonLabel('canvas.createGroup'),
    action: () => {
      actionStore.setAction('group');
    }
  },
]);

const functionsMenuProjectItems: readonly MenuItem[] = [
  {
    pic: faFile,
    hint: 'actions.newProject',
    action: () => {
      emit('openNewProjectModal');
    }
  },
  {
    pic: faFileArrowDown,
    hint: 'actions.saveAsJson',
    action: () => {
      emit('openExportModal');
    }
  },
  {
    pic: faFileArrowUp,
    hint: 'actions.uploadJson',
    action: () => {
      emit('openImportModal');
    }
  },
];

const functionsMenuMiscItems: readonly MenuItem[] = [
  {
    pic: faCircleInfo,
    hint: 'actions.info',
    action: () => {
      emit('openMainMenu');
    }
  },
  {
    pic: faGithub,
    hint: 'actions.projectGitHub',
    action: () => {
      window.open(appConfig.appGitHub);
    }
  },
];

const sections = computed(() => [
  { items: functionsMenuTopItems.value },
  { items: functionsCommentItems.value },
  { items: functionsMenuProjectItems },
  { items: functionsMenuMiscItems },
]);
</script>

<style scoped>

</style>