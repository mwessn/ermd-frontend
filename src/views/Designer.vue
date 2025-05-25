<template>
  <div
      class="w-full h-full bg-backgroundDark pt-12 pl-12"
      @contextmenu.prevent="setAction(undefined)"
  >
    <DesignCanvas />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useActionsStore } from "@/store/action.ts";
import type { UserAction } from "@/types/actions.ts";
import DesignCanvas from "@/components/designer/DesignCanvas.vue";

const actionsStore = useActionsStore();

const setAction = (val: UserAction) => {
  actionsStore.setAction(val);
}

const onKeydown = (evt: KeyboardEvent) => {
  const key = evt.key.toLowerCase();
  if (!evt.ctrlKey) {
    switch (key) {
      case 'escape': {
        setAction(undefined);
        break;
      }
      case 't': {
        setAction('table');
        break;
      }
      case 'b': {
        setAction('oto');
        break;
      }
      case 'n': {
        setAction('otm');
        break;
      }
      case 'm': {
        setAction('mtm');
        break;
      }
      case 'c': {
        setAction('comment');
        break;
      }
      default: {
        break;
      }
    }
  } else {
    switch (key) {
      case 'c': {
        console.log('copy');
        break;
      }
      case 'v': {
        console.log('paste');
        break;
      }
      default: {
        break;
      }
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
});
</script>

<style scoped>

</style>