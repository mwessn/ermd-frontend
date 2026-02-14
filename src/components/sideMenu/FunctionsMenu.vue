<template>
    <div
      class="fixed left-0 h-full w-12 bg-accentDarkGray transition-transform duration-300 text-center pt-4 mt-12 z-50"
      :class="[visible ? 'translate-x-0' : '-translate-x-full',
               disabled ? 'pointer-events-none' : '']"
    >
      <template v-for="(section, index) in sections" :key="index">
        <Tooltip
          v-for="(item, itemIndex) in section.items"
          :key="itemIndex"
          :text="item.hint"
          :button="item.button"
          :aria-label="item.hint"
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
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { appConfig } from "@/app.config.ts";
import Tooltip from "@/components/core/Tooltip.vue";
import { resetFocus } from "@/utils/utils.ts";

withDefaults(defineProps<{
  visible: boolean
  disabled?: boolean
}>(), {
  disabled: false
});

const emit = defineEmits(['openImportModal', 'openExportModal', 'openNewProjectModal']);

const actionStore = useActionsStore();

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

const functionsMenuTopItems: readonly MenuItem[] = [
  {
    pic: faTable,
    hint: 'Create table',
    button: 'T',
    action: () => {
      actionStore.setAction('table');
    }
  },
  {
    pic: faArrowRight,
    hint: 'Non-identifying One-to-One relation',
    button: 'H',
    action: () => {
      actionStore.setAction('noto');
    }
  },
  {
    pic: faCircleArrowRight,
    hint: 'Identifying One-to-One relation',
    button: 'B',
    action: () => {
      actionStore.setAction('ioto');
    }
  },
  {
    pic: faChevronRight,
    hint: 'Non-identifying One-to-Many relation',
    button: 'J',
    action: () => {
      actionStore.setAction('notm');
    }
  },
  {
    pic: faChevronCircleRight,
    hint: 'Identifying One-to-Many relation',
    button: 'N',
    action: () => {
      actionStore.setAction('iotm');
    }
  },
  {
    pic: faArrowsUpDownLeftRight,
    hint: 'Many-to-Many relation',
    button: 'M',
    action: () => {
      actionStore.setAction('mtm');
    }
  },
  {
    pic: faComment,
    hint: 'Comment',
    button: 'C',
    action: () => {
      actionStore.setAction('comment');
    }
  },
  {
    pic: faObjectGroup,
    hint: 'Group',
    button: 'G',
    action: () => {
      actionStore.setAction('group');
    }
  },
];

const functionsMenuMiddleItems: readonly MenuItem[] = [
  {
    pic: faFile,
    hint: 'New project',
    action: () => {
      emit('openNewProjectModal');
    }
  },
  {
    pic: faFileArrowDown,
    hint: 'Save as JSON',
    action: () => {
      emit('openExportModal');
    }
  },
  {
    pic: faFileArrowUp,
    hint: 'Upload JSON',
    action: () => {
      emit('openImportModal');
    }
  },
];

const functionsMenuBottomItems: readonly MenuItem[] = [
  {
    pic: faCircleInfo,
    hint: 'Info',
    action: () => {
      //
    }
  },
  {
    pic: faGithub,
    hint: 'Project GitHub',
    action: () => {
      window.open(appConfig.appGitHub);
    }
  },
];

const sections = [
  { items: functionsMenuTopItems },
  { items: functionsMenuMiddleItems },
  { items: functionsMenuBottomItems },
] as const;
</script>

<style scoped>

</style>