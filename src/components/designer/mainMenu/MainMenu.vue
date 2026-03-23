<template>
    <div
      class="bg-accentDarkGray text-accentGray
        fixed top-header-height left-left-menu-width right-right-menu-width
        bottom-0 z-99 p-6"
    >
      <!--   Close button   -->
      <div
        class="absolute top-6 right-6 px-3 py-2
          bg-backgroundDark rounded-xs
            cursor-pointer select-none
            hover:opacity-80 active:opacity-50"
        @click="emit('closeMenu')"
      >
        <FontAwesomeIcon :icon="faClose" class="text-accentDarkGray" />
      </div>

      <!--   Header   -->
      <div class="p-6 border border-accentGray rounded w-fit flex gap-6 cursor-default">
        <HeaderLogo />

        <p class="text-sm max-w-md self-end text-right text-textColor">
          {{ $t('mainMenu.description') }}
        </p>
      </div>
      <GitHubWidget />

      <Separator />

      <!--   Buttons   -->
      <div class="flex gap-3 items-center">
        <MenuButton
          v-for="button in menuButtons"
          :key="button.label"
          :icon="button.icon"
          :label="$t(button.label)"
          @click="button.action"
        />
      </div>
    </div>
</template>

<script setup lang="ts">
import GitHubWidget from "@/components/designer/mainMenu/GitHubWidget.vue";
import HeaderLogo from "@/components/designer/mainMenu/HeaderLogo.vue";
import MenuButton from "@/components/designer/mainMenu/MenuButton.vue";
import Separator from "@/components/core/Separator.vue";
import { faClose, faFile, faFileArrowUp } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

const emit = defineEmits<{
  newProject: [];
  importProject: [];
  closeMenu: [];
}>();

interface MenuButtonDef {
  icon: IconDefinition;
  label: string;
  action: () => void;
}

const menuButtons: readonly MenuButtonDef[] = [
  {
    icon: faFile,
    label: 'actions.newProject',
    action: () => emit('newProject'),
  },
  {
    icon: faFileArrowUp,
    label: 'actions.uploadJson',
    action: () => emit('importProject'),
  },
];
</script>
