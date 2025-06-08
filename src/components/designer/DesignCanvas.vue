<template>
  <div
      class="full relative bg-grid overflow-hidden"
      :style="{ cursor: cursorStyle, backgroundPosition: bgPos, backgroundSize: bgSize }"
      :class="{ 'select-none' : isDragging }"
      @mousedown.left="onMouseDown"
      @contextmenu.prevent="setAction(undefined)"
      @mouseup.left="onMouseUp"
      @mousemove="onMouseMove"
      @mouseleave="onMouseLeave"
      @wheel.prevent="onScroll"
  >
    <div
        class="full relative origin-top-left"
        :style="{ scale: scaleFactor, transform: `translate(${ translatePos })` }"
    >
      <DesignerTable
          v-for="table in designStore.tables"
          :table="table"
          :key="table.id"
          :is-name-duplicate="isTableNameDuplicate(table.name)"
      />
    </div>

    <div
        class="absolute bottom-0 right-2/5 m-2 flex items-center gap-2 text-accentDarkGray"
        @mousedown.stop
        @mouseup.stop
    >
      <div
          class="bg-accentGray rounded px-4 h-7 text-accentDarkGray flex items-center gap-2"
      >
        <input v-model.number="scaleFactor" class="slider bg-accentDarkGray slider-thumb-lycheeIce" type="range" min="0.2" max="1.5" step="0.02">
        <FontAwesomeIcon :icon="faMagnifyingGlass" />
      </div>

      <div
          class="bg-accentGray rounded w-7 h-7"
          @mouseup.left="centerView(0, 0)"
      >
        <Tooltip text="Center view" button="X" class="full">
          <div class="flex items-center justify-center full">
            <FontAwesomeIcon :icon="faArrowsToDot" />
          </div>
        </Tooltip>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useActionsStore } from "@/store/action.ts";
import { computed } from "vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faArrowsToDot, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import Tooltip from "@/components/core/Tooltip.vue";
import { useDesignCanvas } from "@/components/designer/scripts/useDesignCanvas.ts";
import { useKeyboardShortcuts } from "@/components/designer/scripts/useKeyboardShortcuts.ts";
import { useDesignStore } from "@/store/design.ts";
import DesignerTable from "@/components/designer/DesignerTable.vue";
import { resetFocus } from "@/utils/utils.ts";

const actionsStore = useActionsStore();
const designStore = useDesignStore();

const cursorStyle = computed(() => {
  const cursor = isDragging.value ? 'move' : actionsStore.currentAction ?? 'default';
  return `url(/cursors/${cursor}.cur) 0 0, auto`;
});

const baseBgSize = 50;

const bgSize = computed(() => `${ baseBgSize * scaleFactor.value }px ${ baseBgSize * scaleFactor.value }px`);

const isTableNameDuplicate = (name: string) => designStore.duplicateTableNames.has(name.trim().toLowerCase());

const onMouseLeave = () => {
  onMouseUp();
  resetFocus();
}

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