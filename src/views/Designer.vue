<template>
  <div
      class="w-full h-full bg-backgroundDark pt-12 pl-12"
      @contextmenu.prevent="setAction(undefined)"
      @keydown.
  >
    <div
        class="h-full w-full relative"
        :style="{ cursor: cursorStyle }"
    >

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { useActionsStore } from "@/store/action.ts";
import type { UserAction } from "@/types/actions.ts";

const actionsStore = useActionsStore();

const cursorStyle = computed(() => {
  const cursor = actionsStore.currentAction ?? 'default';
  return `url(/cursors/${cursor}.cur), auto`;
});

const setAction = (val: UserAction) => {
  actionsStore.setAction(val);
}

const onKeydown = (evt: KeyboardEvent) => {
  const key = evt.key.toLowerCase();
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