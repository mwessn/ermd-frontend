<template>
  <div class="absolute top-0 w-full h-12 bg-headerBlack flex justify-between items-center px-4 text-monolithicCyanTsunami">
    <div class="cursor-pointer" @click="emit('menuToggle', 'functions')">
      <FontAwesomeIcon :icon="faBars" />
    </div>
    <div class="cursor-pointer" @click="emit('menuToggle', 'settings')">
      <FontAwesomeIcon :icon="faCog" />
    </div>
  </div>
</template>

<script setup lang="ts">

import { faBars, faCog } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

const emit = defineEmits(['menuToggle']);
</script>

<style scoped>

</style>