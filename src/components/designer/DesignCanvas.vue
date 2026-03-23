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
      @mousemove="onCanvasMouseMove"
      @mouseleave="onMouseLeave"
      @wheel.prevent="onScroll"
    >
      <div
        class="full relative origin-top-left"
        :style="{ scale: scaleFactor, transform: `translate(${ translatePos })` }"
      >
        <DesignerTable
          v-for="table in designStore.tables"
          :id="`table-${table.id}`"
          :key="table.id"
          :table="table"
          :is-name-duplicate="isTableNameDuplicate(table.name)"
          :scale-factor="scaleFactor"
          :offset-x="translateOffsetX"
          :offset-y="translateOffsetY"
        />

        <svg
          ref="relationshipsRef"
          class="fixed top-0 left-0 full z-2 origin-top-left pointer-events-none"
          overflow="visible"
        >
          <DesignerRelation
            v-for="relation in designStore.relations"
            :key="relation.id"
            :relation="relation"
            :scale-factor="scaleFactor"
            :offset-x="translateOffsetX"
            :offset-y="translateOffsetY"
            @mousedown.stop
            @mouseup.stop
          />
          <DesignerCommentLink
            v-for="comment in designStore.comments"
            :key="comment.id"
            :comment="comment"
            :scale-factor="scaleFactor"
            :offset-x="translateOffsetX"
            :offset-y="translateOffsetY"
          />
          <RelationPreviewLine
            v-if="designStore.relationFirstTableId"
            :table-id="designStore.relationFirstTableId"
            :scale-factor="scaleFactor"
            :offset-x="translateOffsetX"
            :offset-y="translateOffsetY"
            :mouse-x="canvasMouseX"
            :mouse-y="canvasMouseY"
            :dashed="actionsStore.currentAction === 'noto' || actionsStore.currentAction === 'notm'"
            :is-mtm="actionsStore.currentAction === 'mtm'"
          />
        </svg>

        <DesignerGroup
          v-for="area in designStore.groups"
          :key="area.id"
          :area="area"
          :scale-value="scaleFactor"
          :offset-x="translateOffsetX"
          :offset-y="translateOffsetY"
        />

        <DesignerGroup
          v-if="designStore.tempGroup"
          key="temp-area"
          :area="designStore.tempGroup"
          is-temporary
        />

        <DesignerComment
          v-for="comment in designStore.comments"
          :key="comment.id"
          :comment="comment"
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
          <input
            v-model.number="scaleFactor"
            class="slider bg-accentDarkGray slider-thumb-lycheeIce"
            type="range"
            min="0.2"
            max="1.5"
            step="0.02"
          >
          <FontAwesomeIcon :icon="faMagnifyingGlass" />
        </div>

        <div
          class="bg-accentGray rounded w-7 h-7"
          @mouseup.left="centerView(0, 0)"
        >
          <Tooltip
            text="actions.centerView"
            button="X"
            class="full"
          >
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
import { computed, ref } from "vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faArrowsToDot, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import Tooltip from "@/components/core/Tooltip.vue";
import { useDesignCanvas } from "@/components/designer/scripts/useDesignCanvas.ts";
import { useKeyboardShortcuts } from "@/components/designer/scripts/useKeyboardShortcuts.ts";
import { useDesignStore } from "@/store/design.ts";
import DesignerTable from "@/components/designer/DesignerTable.vue";
import { resetFocus } from "@/utils/utils.ts";
import DesignerRelation from "@/components/designer/DesignerRelation.vue";
import RelationPreviewLine from "@/components/designer/RelationPreviewLine.vue";
import DesignerGroup from "@/components/designer/DesignerGroup.vue";
import DesignerComment from "@/components/designer/DesignerComment.vue";
import DesignerCommentLink from "@/components/designer/DesignerCommentLink.vue";
import { CANVAS_GRID_BG_SIZE } from "@/types/constants.ts";
import { getCursorForAction } from "@/utils/cursorUtils.ts";

const actionsStore = useActionsStore();
const designStore = useDesignStore();

const cursorStyle = computed(() => {
  const action = isDragging.value ? 'move' : actionsStore.currentAction ?? 'default';
  return getCursorForAction(action);
});

const bgSize = computed(() => `${ CANVAS_GRID_BG_SIZE * scaleFactor.value }px ${ CANVAS_GRID_BG_SIZE * scaleFactor.value }px`);

const isTableNameDuplicate = (name: string) => designStore.duplicateTableNames.has(name.trim().toLowerCase());

const canvasMouseX = ref<number>(0);
const canvasMouseY = ref<number>(0);

const onCanvasMouseMove = (evt: MouseEvent) => {
  onMouseMove(evt);
  canvasMouseX.value = evt.clientX / scaleFactor.value - translateOffsetX.value;
  canvasMouseY.value = evt.clientY / scaleFactor.value - translateOffsetY.value;
};

const onMouseLeave = () => {
  onMouseUp();
  resetFocus();
};

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

const { setAction } = useKeyboardShortcuts(centerView, scaleFactor);
</script>