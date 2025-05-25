<template>
  <div
      class="fixed left-0 h-full w-12 bg-accentDarkGray transition-transform duration-300 text-center pt-4 mt-12 z-50"
      :class="visible ? 'translate-x-0' : '-translate-x-full'"
  >
    <template v-for="(section, index) in sections" :key="index">
      <Tooltip v-for="(item, itemIndex) in section.items"
               :key="itemIndex"
               :text="item.hint"
               :button="item.button"
      >
        <div
            class="p-2 hover:opacity-50 text-lycheeIce cursor-pointer relative"
            @click="item.action"
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
  faArrowsSplitUpAndLeft,
  faArrowsUpDownLeftRight, faCircleInfo, faComment, faFile, faFileArrowDown, faFileArrowUp,
  faTable
} from "@fortawesome/free-solid-svg-icons";
import { useActionsStore } from "@/store/action.ts";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { appConfig } from "@/app.config.ts";
import Tooltip from "@/components/core/Tooltip.vue";

defineProps({
  visible: {
    type: Boolean,
    required: true,
  }
});

const actionStore = useActionsStore();

interface MenuItem {
  pic: IconDefinition;
  hint: string;
  button?: string;
  action: () => void;
}

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
    hint: 'One-to-One relation',
    button: 'B',
    action: () => {
      actionStore.setAction('oto');
    }
  },
  {
    pic: faArrowsSplitUpAndLeft,
    hint: 'One-to-Many relation',
    button: 'N',
    action: () => {
      actionStore.setAction('otm');
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
    hint: 'Comment area',
    button: 'C',
    action: () => {
      actionStore.setAction('comment');
    }
  },
];

const functionsMenuMiddleItems: readonly MenuItem[] = [
  {
    pic: faFile,
    hint: 'New project',
    action: () => {
      //
    }
  },
  {
    pic: faFileArrowDown,
    hint: 'Save as JSON',
    action: () => {
      //
    }
  },
  {
    pic: faFileArrowUp,
    hint: 'Upload JSON',
    action: () => {
      //
    }
  },
]

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