<template>
  <div
      class="fixed right-0 h-full px-2 pt-4 mt-12 max-w-48
       bg-accentDarkGray text-center z-50
        transition-transform duration-300"
      :class="visible ? 'translate-x-0' : 'translate-x-full'"
  >
    {{ currentSettings }}
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useSettingsStore } from "@/store/settings.ts";

defineProps({
  visible: {
    type: Boolean,
    required: true,
  }
});

const { currentSettings } = storeToRefs(useSettingsStore());


</script>

<style scoped>

</style>