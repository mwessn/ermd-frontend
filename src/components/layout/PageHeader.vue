<template>
  <div class="absolute top-0 w-full h-12 bg-headerBlack flex justify-between items-center px-4 text-monolithicCyanTsunami z-50">
    <div class="flex gap-3 items-center">
      <div
          class="cursor-pointer"
          tabindex="0"
          :aria-label="$t('Open functions menu')"
          @keydown.enter="onClick('functions')"
          @click="onClick('functions')"
      >
        <FontAwesomeIcon :icon="faBars" />
      </div>
      <div class="text-lycheeIce">
        <DoubleClickFocusInput
            v-model="projectName"
            class="placeholder:text-accentDarkGray"
            :placeholder="`${$t('enter project name')}...`"
            allow-shift-key
            @enter-key="resetFocus"
        />
      </div>
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
import DoubleClickFocusInput from "@/components/core/DoubleClickFocusInput.vue";
import { storeToRefs } from "pinia";
import { useExportStore } from "@/store/export.ts";
import { resetFocus } from "@/utils/utils.ts";

const emit = defineEmits(['menuToggle']);

const {
  projectName,
} = storeToRefs(useExportStore());

const onClick = (menu: 'functions' | 'settings') => {
  emit('menuToggle', menu)
}
</script>

<style scoped>

</style>