<template>
    <div class="w-full h-full bg-backgroundDark">
      <PageHeader @menu-toggle="toggleMenu" />

      <FunctionsMenu
        :visible="functionsMenuVisible"
        @open-export-modal="exportModalVisible = true"
        @open-import-modal="importModalVisible = true"
        @open-new-project-modal="newProjectModalVisible = true"
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
import { storeToRefs } from "pinia";
import ExportJsonModal from "@/components/layout/modal/ExportJsonModal.vue";
import ImportJsonModal from "@/components/layout/modal/ImportJsonModal.vue";
import YesNoModal from "@/components/layout/modal/YesNoModal.vue";
import { useI18n } from "vue-i18n";

const { tables } = storeToRefs(useDesignStore());

const isFirstLaunch = tables.value.length == 0;

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
};

const exportModalVisible = ref<boolean>(false);
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

</script>