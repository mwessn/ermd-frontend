<template>
  <div
      class="full relative bg-grid overflow-hidden"
      :style="{ cursor: cursorStyle, backgroundPosition: bgPos, backgroundSize: bgSize }"
      @mousedown.left="onMouseDown"
      @contextmenu.prevent="setAction(undefined)"
      @mouseup.left="onMouseUp"
      @mousemove="onMouseMove"
      @mouseleave="onMouseUp"
      @wheel.prevent="onScroll"
      ref="canvasContainer"
  >
    <div class="full relative" :style="{ transform: `translate(${ translatePos })` }">
      <div
          v-for="table in designStore.tables"
          class="bg-textColor absolute"
          :key="table.id"
          :style="{ top: table.posY + 'px', left: table.posX + 'px' }"
      >
        <div class="p-12" />
      </div>
    </div>

    <div
        class="absolute bottom-0 left-1/2 m-2 bg-accentGray rounded w-7 h-7  text-accentDarkGray ml-14"
        @mouseup.left.prevent="centerView(0, 0)"
    >
      <Tooltip text="Center view" button="X" class="full">
        <div class="flex items-center justify-center full">
          <FontAwesomeIcon :icon="faArrowsToDot" />
        </div>
      </Tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useActionsStore } from "@/store/action.ts";
import { computed } from "vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faArrowsToDot } from "@fortawesome/free-solid-svg-icons";
import Tooltip from "@/components/core/Tooltip.vue";
import { useDesignCanvas } from "@/components/designer/scripts/useDesignCanvas.ts";
import { useKeyboardShortcuts } from "@/components/designer/scripts/useKeyboardShortcuts.ts";
import { useDesignStore } from "@/store/design.ts";

const actionsStore = useActionsStore();
const designStore = useDesignStore();

const cursorStyle = computed(() => {
  const cursor = isDragging.value ? 'move' : actionsStore.currentAction ?? 'default';
  return `url(/cursors/${cursor}.cur) 0 0, auto`;
});

const baseBgSize = 50;

const bgSize = computed(() => `${ baseBgSize * scaleFactor.value }px ${ baseBgSize * scaleFactor.value }px`)

const {
  scaleFactor,

  isDragging,
  bgPos,
  translatePos,

  onMouseDown,
  onMouseUp,
  onMouseMove,
  onScroll,

  centerView,
} = useDesignCanvas();

const { setAction } = useKeyboardShortcuts(centerView);
</script>