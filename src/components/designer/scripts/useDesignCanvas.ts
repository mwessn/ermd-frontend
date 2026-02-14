
import { ref, computed } from 'vue';
import { useActionsStore } from "@/store/action.ts";
import { useDesignStore } from "@/store/design.ts";
import { clamp } from "@/utils/utils.ts";
import { storeToRefs } from "pinia";
import { useSettingsStore } from "@/store/settings.ts";
import { cloneDeep } from "lodash";
import { ZOOM_SHIFT_MULTIPLIER, ZOOM_STEP, ZOOM_MIN, ZOOM_MAX } from "@/types/constants.ts";

export interface CursorPos {
  x: number;
  y: number;
}

export interface AreaSize {
  width: number;
  height: number;
}

export function useDesignCanvas() {
  const actionStore = useActionsStore();
  const designStore = useDesignStore();

  const { currentSettings } = storeToRefs(useSettingsStore());
  const {
    selectedTable,
    resizedTable,
    movedGroup,
    resizedGroup,
    tempGroup,
    movedComment,
    linkingComment,
  } = storeToRefs(designStore);

  // How much the canvas is dragged from its center
  const translateOffsetX = ref(0);
  const translateOffsetY = ref(0);

  // Canvas zoom
  const scaleFactor = ref<number>(1);

  // Drag detection
  const lastClickPos = ref<CursorPos | undefined>();
  const lastClickType = ref<'left' | 'middle' | undefined>(undefined);
  const currentMousePos = ref<CursorPos | undefined>();

  // (Buffer variable) initial position of selected table before drag
  const lastSelectedPos = ref<CursorPos| undefined>(undefined);

  const lastWidth = ref<number| undefined>(undefined);
  const lastSize = ref<AreaSize | undefined>(undefined);
  const lastGroupPosition = ref<CursorPos | undefined>(undefined);
  const lastCommentPosition = ref<CursorPos | undefined>(undefined);

  // Comment area moving binding (store IDs to avoid mutating objects)
  const intersectingTableIds = ref<string[]>([]);
  const intersectingAreaIds = ref<string[]>([]);
  const intersectingCommentIds = ref<string[]>([]);

  const isDragging = computed(() =>
    !!lastClickPos.value && lastClickPos.value != currentMousePos.value);

  // background-position property
  const bgPos = computed(() =>
    `${ translateOffsetX.value }px ${ translateOffsetY.value }px`);

  // transform translate property
  const translatePos = computed(() =>
    `${ translateOffsetX.value }px, ${ translateOffsetY.value }px`);

  const startTracking = (evt: MouseEvent) => {
    // Start tracking drag
    const pos = { x: evt.clientX, y: evt.clientY };
    lastClickPos.value = pos;
    currentMousePos.value = pos;
  };

  const onMouseDown = async (evt: MouseEvent) => {
    switch (actionStore.currentAction) {
      case undefined: {
        lastClickType.value = "left";
        startTracking(evt);

        if (resizedGroup.value != undefined) {
          lastSize.value = cloneDeep(resizedGroup.value.size);
        }
        if (movedGroup.value != undefined) {
          lastGroupPosition.value = {
            x: movedGroup.value.posX,
            y: movedGroup.value.posY
          };
          intersectingTableIds.value = designStore.getTablesInsideGroup(movedGroup.value).map(t => t.id);
          intersectingAreaIds.value = designStore.getGroupsInsideGroup(movedGroup.value).map(a => a.id);
          intersectingCommentIds.value = designStore.getCommentsInsideGroup(movedGroup.value).map(c => c.id);
        }
        if (movedComment.value != undefined) {
          lastCommentPosition.value = {
            x: movedComment.value.posX,
            y: movedComment.value.posY
          };
        }

        break;
      }
      case 'table': {
        // Create a table
        const posX = evt.clientX / scaleFactor.value - translateOffsetX.value;
        const posY = evt.clientY / scaleFactor.value - translateOffsetY.value;

        designStore.addTable(posX, posY);
        actionStore.setAction(undefined);
        break;
      }
      case 'ioto':
      case 'noto':
      case 'iotm':
      case 'notm':
      case 'mtm': {
        designStore.createRelationship(actionStore.currentAction);
        break;
      }
      case 'group': {
        startTracking(evt);
        designStore.startCreatingGroup({
          x: evt.clientX / scaleFactor.value - translateOffsetX.value,
          y: evt.clientY / scaleFactor.value - translateOffsetY.value
        });

        actionStore.setAction(undefined);
        break;
      }
      case 'comment': {
        const clickX = evt.clientX;
        const clickY = evt.clientY;

        // Priority 1: Check if click is on a column
        const columnHit = detectColumnClick(clickX, clickY);
        if (columnHit) {
          designStore.addComment(
            clickX / scaleFactor.value - translateOffsetX.value,
            clickY / scaleFactor.value - translateOffsetY.value,
            {
              type: 'column',
              entityId: `${columnHit.tableId}.${columnHit.colId}`,
              offsetX: 0,
              offsetY: 0
            }
          );
          actionStore.setAction(undefined);
          break;
        }

        // Priority 2: Check if click is on a table header
        const tableId = detectTableHeaderClick(clickX, clickY);
        if (tableId) {
          designStore.addComment(
            clickX / scaleFactor.value - translateOffsetX.value,
            clickY / scaleFactor.value - translateOffsetY.value,
            {
              type: 'table',
              entityId: tableId,
              offsetX: 0,
              offsetY: 0
            }
          );
          actionStore.setAction(undefined);
          break;
        }

        // Priority 3: Check if click is on a group header
        const groupId = detectGroupHeaderClick(clickX, clickY);
        if (groupId) {
          designStore.addComment(
            clickX / scaleFactor.value - translateOffsetX.value,
            clickY / scaleFactor.value - translateOffsetY.value,
            {
              type: 'group',
              entityId: groupId,
              offsetX: 0,
              offsetY: 0
            }
          );
          actionStore.setAction(undefined);
          break;
        }

        // Priority 4: Create standalone comment at click position
        designStore.addComment(
          clickX / scaleFactor.value - translateOffsetX.value,
          clickY / scaleFactor.value - translateOffsetY.value
        );
        actionStore.setAction(undefined);
        break;
      }
      case 'linkComment': {
        if (!linkingComment.value) {
          actionStore.setAction(undefined);
          break;
        }

        const clickX = evt.clientX;
        const clickY = evt.clientY;

        // Priority 1: Check if click is on a column
        const columnHit = detectColumnClick(clickX, clickY);
        if (columnHit) {
          const oldVal = cloneDeep(linkingComment.value);
          const parent = designStore.getLinkedEntity?.({
            type: 'column',
            entityId: `${columnHit.tableId}.${columnHit.colId}`,
            offsetX: 0,
            offsetY: 0
          });
          if (parent) {
            // Determine which side the comment is on
            const isOnLeft = linkingComment.value.posX < parent.posX + parent.width / 2;

            linkingComment.value.linkedTo = {
              type: 'column',
              entityId: `${columnHit.tableId}.${columnHit.colId}`,
              offsetX: isOnLeft
                ? linkingComment.value.posX - parent.posX
                : linkingComment.value.posX - parent.posX - parent.width,
              offsetY: linkingComment.value.posY - parent.posY
            };
            designStore.bufferLogCommentChange(oldVal);
          }
          designStore.setLinkingComment(undefined);
          actionStore.setAction(undefined);
          break;
        }

        // Priority 2: Check if click is on a table header
        const tableId = detectTableHeaderClick(clickX, clickY);
        if (tableId) {
          const oldVal = cloneDeep(linkingComment.value);
          const parent = designStore.getLinkedEntity?.({
            type: 'table',
            entityId: tableId,
            offsetX: 0,
            offsetY: 0
          });
          if (parent) {
            // Determine which side the comment is on
            const isOnLeft = linkingComment.value.posX < parent.posX + parent.width / 2;

            linkingComment.value.linkedTo = {
              type: 'table',
              entityId: tableId,
              offsetX: isOnLeft
                ? linkingComment.value.posX - parent.posX
                : linkingComment.value.posX - parent.posX - parent.width,
              offsetY: linkingComment.value.posY - parent.posY
            };
            designStore.bufferLogCommentChange(oldVal);
          }
          designStore.setLinkingComment(undefined);
          actionStore.setAction(undefined);
          break;
        }

        // Priority 3: Check if click is on a group header
        const groupId = detectGroupHeaderClick(clickX, clickY);
        if (groupId) {
          const oldVal = cloneDeep(linkingComment.value);
          const parent = designStore.getLinkedEntity?.({
            type: 'group',
            entityId: groupId,
            offsetX: 0,
            offsetY: 0
          });
          if (parent) {
            // Determine which side the comment is on
            const isOnLeft = linkingComment.value.posX < parent.posX + parent.width / 2;

            linkingComment.value.linkedTo = {
              type: 'group',
              entityId: groupId,
              offsetX: isOnLeft
                ? linkingComment.value.posX - parent.posX
                : linkingComment.value.posX - parent.posX - parent.width,
              offsetY: linkingComment.value.posY - parent.posY
            };
            designStore.bufferLogCommentChange(oldVal);
          }
          designStore.setLinkingComment(undefined);
          actionStore.setAction(undefined);
          break;
        }

        // If clicked elsewhere, cancel linking
        designStore.setLinkingComment(undefined);
        actionStore.setAction(undefined);
        break;
      }
    }
  };

  const stopTracking = () => {
    // Stop tracking drag
    lastClickPos.value = undefined;

    // Quite arbitrary really, but for the best practices let it be
    lastClickType.value = undefined;
  };

  const onMouseUp = () => {
    if (lastClickPos.value) {
      stopTracking();

      // If moved a table, add buffer entry
      if (lastSelectedPos.value) {
        designStore.bufferLogTableMove(lastSelectedPos.value);
        lastSelectedPos.value = undefined;
      }
      if (lastWidth.value) {
        designStore.bufferLogTableResize(lastWidth.value);
        lastWidth.value = undefined;
      }

      if (tempGroup.value != undefined) {
        designStore.storeGroup();
      }

      if (lastSize.value) {
        designStore.bufferLogGroupResize(lastSize.value);
        designStore.setResizedGroup();
      }

      if (lastGroupPosition.value) {
        designStore.bufferLogGroupMove(
          lastGroupPosition.value,
          intersectingTableIds.value,
          intersectingAreaIds.value,
          intersectingCommentIds.value
        );
        designStore.setMovedGroup();
        intersectingTableIds.value = [];
        intersectingAreaIds.value = [];
        intersectingCommentIds.value = [];
      }

      if (lastCommentPosition.value && movedComment.value) {
        designStore.bufferLogCommentMove(lastCommentPosition.value, movedComment.value.id);
        lastCommentPosition.value = undefined;
      }

      // Reset references
      designStore.setResizedTable();
      designStore.setMovedComment();
    }
  };

  const onMiddleMouseDown = (evt: MouseEvent) => {
    if (currentSettings.value.dragCanvasButton == 'middle') {
      lastClickType.value = "middle";
      startTracking(evt);
    }
  };

  const onMiddleMouseUp = () => {
    if (currentSettings.value.dragCanvasButton == 'middle' && lastClickPos.value) {
      stopTracking();
    }
  };

  const onMouseMove = (evt: MouseEvent) => {
    // If not dragging return
    if (!lastClickPos.value || !currentMousePos.value) return;

    // If current button is MMB we can only move the canvas
    if (
      currentSettings.value.dragCanvasButton == 'middle' &&
            lastClickType.value == "middle"
    ) {
      translateOffsetX.value += evt.movementX;
      translateOffsetY.value += evt.movementY;
      return;
    }

    const deltaX = evt.movementX / scaleFactor.value;
    const deltaY = evt.movementY / scaleFactor.value;

    // Handle comment areas
    const group = tempGroup.value
            ?? resizedGroup.value;
    if (group) {
      designStore.resizeGroup(group.id, deltaX, deltaY);
    }
    else if (movedGroup.value) {
      designStore.moveGroup(
        deltaX,
        deltaY,
        intersectingTableIds.value,
        intersectingAreaIds.value,
        intersectingCommentIds.value
      );
    }

    // Handle comment movement
    else if (movedComment.value) {
      const comment = movedComment.value;
      comment.posX += deltaX;
      comment.posY += deltaY;

      // If linked, recalculate offset from parent
      if (comment.linkedTo) {
        const parent = designStore.getLinkedEntity?.(comment.linkedTo);
        if (parent) {
          // Determine which side the comment is on
          const isOnLeft = comment.posX < parent.posX + parent.width / 2;

          if (isOnLeft) {
            // Left side: offset from left edge
            comment.linkedTo.offsetX = comment.posX - parent.posX;
          } else {
            // Right side: offset from right edge
            comment.linkedTo.offsetX = comment.posX - parent.posX - parent.width;
          }
          comment.linkedTo.offsetY = comment.posY - parent.posY;
        }
      }
    }
    // No table selected, drag canvas
    else if (!selectedTable.value) {
      if (currentSettings.value.dragCanvasButton == 'middle') { return; }

      translateOffsetX.value += evt.movementX;
      translateOffsetY.value += evt.movementY;
    }
    // Handle table move/resize
    else {
      const table = selectedTable.value;
      if (resizedTable.value) {
        if (!lastWidth.value) lastWidth.value = cloneDeep(resizedTable.value.widthPx);
        designStore.resizeSelectedTable(deltaX);
      } else {
        if (!lastSelectedPos.value) {
          lastSelectedPos.value = { x: table.posX, y: table.posY };
        }
        designStore.moveSelectedTable(deltaX, deltaY);
      }
    }

    currentMousePos.value = { x: evt.clientX, y: evt.clientY };
  };

  const onScroll = (evt: WheelEvent) => {
    const zoomMultiplier = evt.shiftKey ? ZOOM_SHIFT_MULTIPLIER : 1;

    const zoomStep = ZOOM_STEP * zoomMultiplier;

    const direction = evt.deltaY < 0 ? 1 : -1;

    // Adjust transform so it zooms to the cursor position
    const oldScale = scaleFactor.value;
    const newScale = clamp(oldScale + direction * zoomStep, ZOOM_MIN, ZOOM_MAX);

    const rect = (evt.currentTarget as HTMLElement).getBoundingClientRect();
    const x = evt.clientX - rect.left;
    const y = evt.clientY - rect.top;
    translateOffsetX.value -= (x/oldScale - x/newScale);
    translateOffsetY.value -= (y/oldScale - y/newScale);

    scaleFactor.value = newScale;
  };

  // Click detection helpers for comment creation
  const isPointInRect = (x: number, y: number, rect: DOMRect): boolean => {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  };

  const detectColumnClick = (clickX: number, clickY: number): { tableId: string; colId: string } | null => {
    const { tables } = designStore;
    for (const table of tables) {
      for (const col of table.cols) {
        const colEl = document.getElementById(`col-${col.id}`);
        if (!colEl) continue;

        const rect = colEl.getBoundingClientRect();
        if (isPointInRect(clickX, clickY, rect)) {
          return { tableId: table.id, colId: col.id };
        }
      }
    }
    return null;
  };

  const detectTableHeaderClick = (clickX: number, clickY: number): string | null => {
    const { tables } = designStore;
    for (const table of tables) {
      const headerEl = document.getElementById(`table-header-${table.id}`);
      if (!headerEl) continue;

      const rect = headerEl.getBoundingClientRect();
      if (isPointInRect(clickX, clickY, rect)) {
        return table.id;
      }
    }
    return null;
  };

  const detectGroupHeaderClick = (clickX: number, clickY: number): string | null => {
    const { groups } = designStore;
    for (const group of groups) {
      const headerEl = document.getElementById(`group-header-${group.id}`);
      if (!headerEl) continue;

      const rect = headerEl.getBoundingClientRect();
      if (isPointInRect(clickX, clickY, rect)) {
        return group.id;
      }
    }
    return null;
  };

  const centerView = (x = 0, y = 0) => {
    translateOffsetX.value = x;
    translateOffsetY.value = y;

    scaleFactor.value = 1;
  };

  return {
    translateOffsetX,
    translateOffsetY,
    scaleFactor,

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
  };
}