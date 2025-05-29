<template>
  <div class="absolute top-0 w-full h-12 bg-headerBlack flex justify-between items-center px-4 text-monolithicCyanTsunami z-50">
    <div
        class="cursor-pointer"
        tabindex="0"
        :aria-label="$t('Open functions menu')"
        @keydown.enter="onClick('functions')"
        @click="onClick('functions')"
    >
      <FontAwesomeIcon :icon="faBars" />
    </div>
    <div
        class="cursor-pointer"
        tabindex="0"
        :aria-label="$t('Open settings menu')"
        @keydown.enter="onClick('settings')"
        @click="onClick('settings')"
    >
      <FontAwesomeIcon :icon="faCog" />
    </div>
  </div>
</template>

<script setup lang="ts">

import { faBars, faCog } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

const emit = defineEmits(['menuToggle']);

const onClick = (menu: 'functions' | 'settings') => {
  emit('menuToggle', menu)
}
</script>

<style scoped>

</style>