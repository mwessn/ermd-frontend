import type { ComputedRef } from "vue";
import type { Table } from "@/types/table.ts";
import type { CommentArea } from "@/types/misc.ts";
import type { AreaSize, CursorPos } from "@/components/designer/scripts/useDesignCanvas.ts";
import type { DesignState } from "./tables.ts";
import type { BufferEntity } from "@/types/actionsBuffer.ts";
import { generateCommentArea } from "@/types/misc.ts";
import { cloneDeep } from "lodash";
import { COMMENT_AREA_MIN_SIZE, COMMENT_AREA_COLLAPSE_WIDTH, COMMENT_AREA_COLLAPSE_HEIGHT } from "@/types/constants.ts";
import type { useActionBuffer } from "@/store/actionBuffer.ts";

export function createCommentAreaOperations(
  state: () => DesignState,
  stores: {
    bufferStore: ReturnType<typeof useActionBuffer>;
  },
  gridSize: ComputedRef<number>
) {
  const snapToGrid = (value: number, gridSizeVal: number) => {
    return Math.round(value / gridSizeVal) * gridSizeVal;
  };

  const startCreatingCommentArea = (pos: CursorPos) => {
    state().tempCommentArea.value = generateCommentArea(pos);
  };

  const storeCommentArea = () => {
    const { tempCommentArea, commentAreasMap } = state();
    if (tempCommentArea.value) {
      commentAreasMap.value.set(tempCommentArea.value.id, tempCommentArea.value);
      bufferLogCommentAreaCreate(cloneDeep(tempCommentArea.value.id));
      tempCommentArea.value = undefined;
    }
  };

  const resetCreatingCommentArea = () => {
    state().tempCommentArea.value = undefined;
  };

  const setResizedCommentArea = (area: CommentArea | undefined = undefined) => {
    state().resizedCommentArea.value = area;
  };

  const setMovedCommentArea = (area: CommentArea | undefined = undefined) => {
    state().movedCommentArea.value = area;
  };

  const resizeCommentArea = (areaId: string, deltaX: number, deltaY: number) => {
    const { commentAreasMap, tempCommentArea } = state();
    // Check both stored areas and temp area (during creation)
    const area = commentAreasMap.value.get(areaId)
            ?? (tempCommentArea.value?.id === areaId ? tempCommentArea.value : undefined);
    if (!area) return;

    // Clamp minimum size
    area.size.width = Math.max(COMMENT_AREA_MIN_SIZE, snapToGrid(area.size.width + deltaX, gridSize.value));
    area.size.height = Math.max(COMMENT_AREA_MIN_SIZE, snapToGrid(area.size.height + deltaY, gridSize.value));

    // If new area dimensions are less than the default textarea size, collapse it
    if (area.size.width < COMMENT_AREA_COLLAPSE_WIDTH || area.size.height < COMMENT_AREA_COLLAPSE_HEIGHT) {
      area.showComment = false;
    }
  };

  const getTablesInsideArea = (area: CommentArea): Table[] => {
    const { tables } = state();
    const areaEndX = area.posX + area.size.width;
    const areaEndY = area.posY + area.size.height;

    return tables.value.filter(it =>
      (it.posX + it.widthPx  > area.posX && it.posX <= areaEndX) &&
            (it.posY > area.posY && it.posY < areaEndY));
  };

  const getAreasInsideArea = (area: CommentArea): CommentArea[] => {
    const { commentAreas } = state();
    const areaEndX = area.posX + area.size.width;
    const areaEndY = area.posY + area.size.height;

    return commentAreas.value.filter(it =>
      (it.posX > area.posX && it.posX <= areaEndX) &&
            (it.posY > area.posY && it.posY <= areaEndY));
  };

  const deleteCommentArea = (area: CommentArea) => {
    const { commentAreasMap, movedCommentArea, resizedCommentArea } = state();
    // Prevent deletion on accidental mouseup after moving or resizing
    // with cursor being over the delete button
    if (area == movedCommentArea.value || area == resizedCommentArea.value) { return; }

    if (commentAreasMap.value.has(area.id)) {
      bufferLogCommentAreaDelete(area);
      commentAreasMap.value.delete(area.id);
    }
  };

  // Buffer actions

  function bufferSetCommentAreaPos(entry: BufferEntity) {
    const area = state().commentAreasMap.value.get(entry.entityId);
    if (area) {
      const oldVal: CursorPos = {
        x: area.posX,
        y: area.posY
      };

      const bufferPos = cloneDeep(entry.oldVal as CursorPos);

      area.posX = bufferPos.x;
      area.posY = bufferPos.y;

      entry.oldVal = oldVal;
    }
  }

  function bufferSetCommentAreaSize(entry: BufferEntity) {
    const area = state().commentAreasMap.value.get(entry.entityId);
    if (area) {
      const oldVal = cloneDeep(area.size);
      area.size = cloneDeep(entry.oldVal as AreaSize);
      entry.oldVal = oldVal;
    }
  }

  function bufferRestoreCommentArea(entry: BufferEntity) {
    const area = cloneDeep(entry.oldVal as CommentArea);
    state().commentAreasMap.value.set(area.id, area);
    entry.oldVal = undefined;
  }

  function bufferDeleteCommentArea(entry: BufferEntity) {
    const area = state().commentAreasMap.value.get(entry.entityId);
    if (area) {
      entry.oldVal = cloneDeep(area);
      state().commentAreasMap.value.delete(entry.entityId);
    }
  }

  function bufferSetCommentAreaValues(entry: BufferEntity) {
    const existingArea = state().commentAreasMap.value.get(entry.entityId);
    if (existingArea) {
      const oldVal = cloneDeep(existingArea);
      const newArea = cloneDeep(entry.oldVal as CommentArea);
      state().commentAreasMap.value.set(entry.entityId, newArea);
      entry.oldVal = oldVal;
    }
  }

  // Buffer loggers

  function bufferLogCommentAreaCreate(areaId: string) {
    stores.bufferStore.addUndoBufferAction({
      entities: [{
        action: 'create',
        type: "commentArea",
        entityId: areaId,
        oldVal: undefined,
      }]
    });
  }

  function bufferLogCommentAreaDelete(area: CommentArea) {
    stores.bufferStore.addUndoBufferAction({
      entities: [{
        action: 'delete',
        type: "commentArea",
        entityId: area.id,
        oldVal: cloneDeep(area),
      }]
    });
  }

  function bufferLogCommentAreaChange(oldVal: CommentArea) {
    stores.bufferStore.addUndoBufferAction({
      entities: [{
        action: 'change',
        type: "commentArea",
        entityId: oldVal.id,
        oldVal: oldVal,
      }]
    });
  }

  function bufferLogCommentAreaResize(oldVal: AreaSize) {
    const { resizedCommentArea } = state();
    if (resizedCommentArea.value != undefined) {
      stores.bufferStore.addUndoBufferAction({
        entities: [{
          action: 'resize',
          type: "commentArea",
          entityId: resizedCommentArea.value.id,
          oldVal: cloneDeep(oldVal),
        }]
      });
    }
  }

  return {
    startCreatingCommentArea,
    storeCommentArea,
    resetCreatingCommentArea,
    setResizedCommentArea,
    setMovedCommentArea,
    resizeCommentArea,
    deleteCommentArea,
    getTablesInsideArea,
    getAreasInsideArea,
    bufferSetCommentAreaPos,
    bufferSetCommentAreaSize,
    bufferRestoreCommentArea,
    bufferDeleteCommentArea,
    bufferSetCommentAreaValues,
    bufferLogCommentAreaCreate,
    bufferLogCommentAreaDelete,
    bufferLogCommentAreaChange,
    bufferLogCommentAreaResize,
  };
}
