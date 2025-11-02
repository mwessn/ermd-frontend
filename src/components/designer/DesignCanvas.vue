<template>
  <div
      class="full relative bg-grid overflow-hidden"
      :style="{ cursor: cursorStyle, backgroundPosition: bgPos, backgroundSize: bgSize }"
      :class="{ 'select-none' : isDragging }"
      @mousedown.left="onMouseDown"
      @mousedown.middle="onMiddleMouseDown"
      @contextmenu.prevent="setAction(undefined)"
      @mouseup.left="onMouseUp"
      @mouseup.middle="onMiddleMouseUp"
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
          :id="`table-${table.id}`"
          :is-name-duplicate="isTableNameDuplicate(table.name)"
      />

      <svg
          ref="relationshipsRef"
          class="fixed top-0 left-0 full z-0 origin-top-left"
          overflow="visible"
      >
        <DesignerRelation
            v-for="relation in designStore.relations"
            :key="relation.id"
            :relation="relation"
            :scale-factor="scaleFactor"
            :offset-x="translateOffsetX"
            :offset-y="translateOffsetY"
        />
      </svg>

      <DesignerCommentArea
          v-if="designStore.tempCommentArea"
          :area="designStore.tempCommentArea"
          key="temp-area"
          is-temporary
      />

      <DesignerCommentArea
          v-for="area in designStore.commentAreas"
          :area="area"
          :key="area.id"
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
import DesignerRelation from "@/components/designer/DesignerRelation.vue";
import DesignerCommentArea from "@/components/designer/DesignerCommentArea.vue";

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
  translateOffsetX,
  translateOffsetY,

  isDragging,
  bgPos,
  translatePos,

  onMouseDown,
  onMouseUp,
  onMouseMove,
  onScroll,

  onMiddleMouseDown,
  onMiddleMouseUp,

  centerView,
} = useDesignCanvas();

const { setAction } = useKeyboardShortcuts(centerView);
</script>