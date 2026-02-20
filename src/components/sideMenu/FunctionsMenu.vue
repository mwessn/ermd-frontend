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
import { useI18n } from "vue-i18n";

withDefaults(defineProps<{
  visible: boolean
  disabled?: boolean
}>(), {
  disabled: false
});

const emit = defineEmits(['openImportModal', 'openExportModal', 'openNewProjectModal']);

const actionStore = useActionsStore();
const { t } = useI18n();

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
    hint: t('actions.createTable'),
    button: 'T',
    action: () => {
      actionStore.setAction('table');
    }
  },
  {
    pic: faArrowRight,
    hint: t('actions.nonIdentifyingOneToOne'),
    button: 'H',
    action: () => {
      actionStore.setAction('noto');
    }
  },
  {
    pic: faCircleArrowRight,
    hint: t('actions.identifyingOneToOne'),
    button: 'B',
    action: () => {
      actionStore.setAction('ioto');
    }
  },
  {
    pic: faChevronRight,
    hint: t('actions.nonIdentifyingOneToMany'),
    button: 'J',
    action: () => {
      actionStore.setAction('notm');
    }
  },
  {
    pic: faChevronCircleRight,
    hint: t('actions.identifyingOneToMany'),
    button: 'N',
    action: () => {
      actionStore.setAction('iotm');
    }
  },
  {
    pic: faArrowsUpDownLeftRight,
    hint: t('actions.manyToMany'),
    button: 'M',
    action: () => {
      actionStore.setAction('mtm');
    }
  },
];

const functionsCommentItems: readonly MenuItem[] = [
  {
    pic: faComment,
    hint: t('actions.comment'),
    button: 'C',
    action: () => {
      actionStore.setAction('comment');
    }
  },
  {
    pic: faObjectGroup,
    hint: t('actions.group'),
    button: 'G',
    action: () => {
      actionStore.setAction('group');
    }
  },
];

const functionsMenuProjectItems: readonly MenuItem[] = [
  {
    pic: faFile,
    hint: t('actions.newProject'),
    action: () => {
      emit('openNewProjectModal');
    }
  },
  {
    pic: faFileArrowDown,
    hint: t('actions.saveAsJson'),
    action: () => {
      emit('openExportModal');
    }
  },
  {
    pic: faFileArrowUp,
    hint: t('actions.uploadJson'),
    action: () => {
      emit('openImportModal');
    }
  },
];

const functionsMenuMiscItems: readonly MenuItem[] = [
  {
    pic: faCircleInfo,
    hint: t('actions.info'),
    action: () => {
      //
    }
  },
  {
    pic: faGithub,
    hint: t('actions.projectGitHub'),
    action: () => {
      window.open(appConfig.appGitHub);
    }
  },
];

const sections = [
  { items: functionsMenuTopItems },
  { items: functionsCommentItems },
  { items: functionsMenuProjectItems },
  { items: functionsMenuMiscItems },
] as const;
</script>

<style scoped>

</style>