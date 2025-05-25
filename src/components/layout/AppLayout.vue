<template>
<div class="w-full h-full bg-backgroundDark">

  <PageHeader @menu-toggle="toggleMenu"/>

  <FunctionsMenu :visible="functionsMenuVisible" />

  <slot />
</div>
</template>

<script setup lang="ts">
import PageHeader from "@/components/layout/PageHeader.vue";
import { ref } from "vue";
import FunctionsMenu from "@/components/sideMenu/FunctionsMenu.vue";

const functionsMenuVisible = ref<boolean>(true);
const settingsMenuVisible = ref<boolean>(true);

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