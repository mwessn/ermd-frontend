<template>
  <div
      class="w-full h-full bg-backgroundDark pt-12"
      :style="{ cursor: cursorStyle }"
      @contextmenu.prevent="clearCurrentAction"
  >
    <div class="h-full w-full relative">
      {{ cursorStyle }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { useActionsStore } from "@/store/action.ts";

const actionsStore = useActionsStore();

// Define a computed cursor style
const cursorStyle = computed(() => {
  const cursor = actionsStore.currentAction ?? 'default';
  return `url(/cursors/${cursor}.cur), auto`;
});

const clearCurrentAction = () => {
  actionsStore.setAction(undefined);
}

const onEscape = (evt: KeyboardEvent) => {
  if (evt.key == 'Escape') {
    clearCurrentAction();
  }
}

onMounted(() => {
  window.addEventListener('keydown', onEscape);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onEscape);
});
</script>

<style scoped>

</style>