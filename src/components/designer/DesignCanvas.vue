<template>
  <div
      class="h-full w-full relative bg-grid"
      :style="{ cursor: cursorStyle, backgroundPosition: bgPos }"
      @mousedown="onMouseDown"
      @mouseup="onMouseUp"
      @mousemove="onMouseMove"
  >
    <div class="p-12 bg-textColor absolute" :style="{ translate: bgPos }"></div>
  </div>
</template>

<script setup lang="ts">
import { useActionsStore } from "@/store/action.ts";
import { computed, ref } from "vue";

const actionsStore = useActionsStore();

const cursorStyle = computed(() => {
  const cursor = isDragging.value ? 'move' : actionsStore.currentAction ?? 'default';
  return `url(/cursors/${cursor}.cur), auto`;
});

interface CursorPos {
  x: number;
  y: number;
}

const isDragging = computed(() => lastClickPos.value && lastClickPos.value != currentMousePos.value);
const bgPos = computed(() => `${translateOffsetX.value}px ${translateOffsetY.value}px`);

const lastClickPos = ref<CursorPos | undefined>(undefined);
const currentMousePos = ref<CursorPos | undefined>(undefined);

const translateOffsetX = ref<number>(0);
const translateOffsetY = ref<number>(0);

const onMouseDown = (evt: MouseEvent) => {
  console.log(evt.x, evt.y);
  lastClickPos.value = { x: evt.clientX, y: evt.clientY };
  currentMousePos.value = lastClickPos.value;
}

const onMouseUp = () => {
  lastClickPos.value = undefined;
}

const onMouseMove = (evt: MouseEvent) => {
  if (!lastClickPos.value) return;

  const deltaX = evt.clientX - currentMousePos.value!.x;
  const deltaY = evt.clientY - currentMousePos.value!.y;

  translateOffsetX.value += deltaX;
  translateOffsetY.value += deltaY;

  currentMousePos.value = { x: evt.clientX, y: evt.clientY };
}
</script>

<style scoped>

</style>