<template>
    <div class="w-full h-full bg-backgroundDark">
      <PageHeader @menu-toggle="toggleMenu" />

      <FunctionsMenu
        :visible="functionsMenuVisible"
        @open-export-modal="exportStore.exportModalVisible = true"
        @open-import-modal="importModalVisible = true"
        @open-new-project-modal="onNewProjectModalOpen"
        @open-main-menu="onMainMenuToggle"
      />

      <Transition name="slide-right">
        <MainMenu
          v-if="mainMenuVisible"
          @new-project="onNewProjectModalOpen"
          @import-project="importModalVisible = true"
          @close-menu="closeMainMenu"
        />
      </Transition>

      <SettingsMenu :visible="settingsMenuVisible" />

      <ExportJsonModal
        v-if="exportStore.exportModalVisible"
        @close="exportStore.exportModalVisible = false"
      />

      <ImportJsonModal
        v-if="importModalVisible"
        @close="onImportModalClose"
      />

      <YesNoModal
        v-if="newProjectModalVisible"
        :modal-title="$t('modal.createNewProject')"
        :body-text="newProjectModalBodyText"
        :confirm-text="$t('common.confirm')"
        :cancel-text="$t('common.cancel')"
        @close="onNewProjectModalClose"
      />

      <slot />
    </div>
</template>

<script setup lang="ts">
import PageHeader from "@/components/layout/PageHeader.vue";
import { computed, ref } from "vue";
import FunctionsMenu from "@/components/sideMenu/FunctionsMenu.vue";
import SettingsMenu from "@/components/sideMenu/SettingsMenu.vue";
import { useDesignStore } from "@/store/design.ts";
import { useExportStore } from "@/store/export.ts";
import { storeToRefs } from "pinia";
import ExportJsonModal from "@/components/layout/modal/ExportJsonModal.vue";
import ImportJsonModal from "@/components/layout/modal/ImportJsonModal.vue";
import YesNoModal from "@/components/layout/modal/YesNoModal.vue";
import { useI18n } from "vue-i18n";
import MainMenu from "@/components/designer/mainMenu/MainMenu.vue";

const { tables, comments, groups } = storeToRefs(useDesignStore());
const exportStore = useExportStore();

const isFirstLaunch = computed(() =>
  tables.value.length == 0 &&
    comments.value.length == 0 &&
    groups.value.length == 0);

const mainMenuVisible = ref<boolean>(isFirstLaunch.value);

const functionsMenuVisible = ref<boolean>(true);
const settingsMenuVisible = ref<boolean>(mainMenuVisible.value);

const toggleMenu = (val: 'functions' | 'settings') => {
  // Can't toggle side menus while main is active;
  if (mainMenuVisible.value) { return; }

  switch (val) {
    case "functions":
      functionsMenuVisible.value = !functionsMenuVisible.value;
      break;
    case "settings":
      settingsMenuVisible.value = !settingsMenuVisible.value;
      break;
  }
};

const importModalVisible = ref<boolean>(false);

const newProjectModalVisible = ref<boolean>(false);

const { t } = useI18n();
const newProjectModalBodyText = computed(() => t('messages.newProjectConfirm'));

const onNewProjectModalOpen = () => {
  if (isFirstLaunch.value) {
    // Clear the state in case of any orphaned relations
    useDesignStore().createNewProject();
    // Close the main menu if triggered from it
    closeMainMenu();
  } else {
    newProjectModalVisible.value = true;
  }
};

const onNewProjectModalClose = (val: boolean | undefined) => {
  newProjectModalVisible.value = false;
  if (val) {
    useDesignStore().createNewProject();
    // Close the main menu if triggered from it
    closeMainMenu();
  }
};

const onImportModalClose = (val: boolean | undefined) => {
  importModalVisible.value = false;
  if (val) {
    // Close the main menu if triggered from it
    closeMainMenu();
  }
};

const closeMainMenu = () => {
  // Set the menus to working state
  mainMenuVisible.value = false;
  settingsMenuVisible.value = false;
  functionsMenuVisible.value = true;
};

const onMainMenuToggle = () => {
  if (mainMenuVisible.value) {
    closeMainMenu();
  } else {
    // Open main and side menus
    mainMenuVisible.value = true;
    settingsMenuVisible.value = true;
    functionsMenuVisible.value = true;
  }
};

</script>

<style scoped>
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s ease;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(calc(100% + var(--spacing-left-menu-width) + var(--spacing-right-menu-width)));
}
</style>