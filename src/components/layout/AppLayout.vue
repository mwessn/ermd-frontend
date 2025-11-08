<template>
<div class="w-full h-full bg-backgroundDark">

  <PageHeader @menu-toggle="toggleMenu"/>

  <FunctionsMenu
      :visible="functionsMenuVisible"
      @openExportModal="exportModalVisible = true"
      @openImportModal="importModalVisible = true"
      @openNewProjectModal="newProjectModalVisible = true"
  />

  <SettingsMenu :visible="settingsMenuVisible" />

  <ExportJsonModal
      v-if="exportModalVisible"
      @close="exportModalVisible = false"
  />

  <ImportJsonModal
    v-if="importModalVisible"
    @close="importModalVisible = false"
  />

  <YesNoModal
      v-if="newProjectModalVisible"
      :modal-title="$t('Create new project')"
      :body-text="$t(newProjectModalBodyText)"
      :confirm-text="$t('Confirm')"
      :cancel-text="$t('Cancel')"
      @close="onNewProjectModalClose"
  />

  <slot />
</div>
</template>

<script setup lang="ts">
import PageHeader from "@/components/layout/PageHeader.vue";
import { ref } from "vue";
import FunctionsMenu from "@/components/sideMenu/FunctionsMenu.vue";
import SettingsMenu from "@/components/sideMenu/SettingsMenu.vue";
import { useDesignStore } from "@/store/design.ts";
import ExportJsonModal from "@/components/layout/modal/ExportJsonModal.vue";
import ImportJsonModal from "@/components/layout/modal/ImportJsonModal.vue";
import YesNoModal from "@/components/layout/modal/YesNoModal.vue";

const { tables } = useDesignStore();

const isFirstLaunch = tables.length == 0;

const functionsMenuVisible = ref<boolean>(true);
const settingsMenuVisible = ref<boolean>(isFirstLaunch);

const toggleMenu = (val: 'functions' | 'settings') => {
  switch (val) {
    case "functions":
      functionsMenuVisible.value = !functionsMenuVisible.value;
      break;
    case "settings":
      settingsMenuVisible.value = !settingsMenuVisible.value;
      break;
  }
}

const exportModalVisible = ref<boolean>(false);
const importModalVisible = ref<boolean>(false);

const newProjectModalVisible = ref<boolean>(false);

const newProjectModalBodyText = "Creating a new project will permanently clear all exisitng data. Please confirm you want to proceed."

const onNewProjectModalClose = (val: boolean | undefined) => {
  newProjectModalVisible.value = false;
  if (val) {
    useDesignStore().createNewProject();
  }
}

</script>