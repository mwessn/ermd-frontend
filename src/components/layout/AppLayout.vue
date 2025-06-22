<template>
<div class="w-full h-full bg-backgroundDark">

  <PageHeader @menu-toggle="toggleMenu"/>

  <FunctionsMenu :visible="functionsMenuVisible" />

  <SettingsMenu :visible="settingsMenuVisible" />

  <slot />
</div>
</template>

<script setup lang="ts">
import PageHeader from "@/components/layout/PageHeader.vue";
import { ref } from "vue";
import FunctionsMenu from "@/components/sideMenu/FunctionsMenu.vue";
import SettingsMenu from "@/components/sideMenu/SettingsMenu.vue";
import { useDesignStore } from "@/store/design.ts";

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

</script>