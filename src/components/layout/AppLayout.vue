<template>
    <div class="w-full h-full bg-backgroundDark">
      <PageHeader @menu-toggle="toggleMenu" />

      <FunctionsMenu
        :visible="functionsMenuVisible"
        @open-export-modal="exportStore.exportModalVisible = true"
        @open-import-modal="importModalVisible = true"
        @open-new-project-modal="newProjectModalVisible = true"
        @open-main-menu="onMainMenuToggle"
      />

      <MainMenu v-if="mainMenuVisible" />

      <SettingsMenu :visible="settingsMenuVisible" />

      <ExportJsonModal
        v-if="exportStore.exportModalVisible"
        @close="exportStore.exportModalVisible = false"
      />

      <ImportJsonModal
        v-if="importModalVisible"
        @close="importModalVisible = false"
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

const { tables } = storeToRefs(useDesignStore());
const exportStore = useExportStore();

const isFirstLaunch = computed(() => tables.value.length == 0);

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

const onNewProjectModalClose = (val: boolean | undefined) => {
  newProjectModalVisible.value = false;
  if (val) {
    useDesignStore().createNewProject();
  }
};

const onMainMenuToggle = () => {
  if (mainMenuVisible.value) {
    // Close the main menu, keep the functions menu, settings menu based on the canvas state.
    mainMenuVisible.value = false;
    settingsMenuVisible.value = isFirstLaunch.value;
  } else {
    // Open main and side menus
    mainMenuVisible.value = true;
    settingsMenuVisible.value = true;
    functionsMenuVisible.value = true;
  }
};

</script>