import type { ComputedRef, Ref } from "vue";
import type { Table } from "@/types/table.ts";
import type { Group, UserSettings } from "@/types/misc.ts";
import type { AreaSize, CursorPos } from "@/components/designer/scripts/useDesignCanvas.ts";
import type { DesignState } from "./tables.ts";
import type { BufferEntity } from "@/types/actionsBuffer.ts";
import { generateGroup } from "@/types/misc.ts";
import { cloneDeep } from "lodash";
import { GROUP_MIN_SIZE } from "@/types/constants.ts";
import type { useActionBuffer } from "@/store/actionBuffer.ts";

export function createGroupOperations(
  state: () => DesignState,
  stores: {
    bufferStore: ReturnType<typeof useActionBuffer>;
  },
  gridSize: ComputedRef<number>,
  currentSettings: Ref<UserSettings>
) {
  const snapToGrid = (value: number, gridSizeVal: number) => {
    return Math.round(value / gridSizeVal) * gridSizeVal;
  };

  const startCreatingGroup = (pos: CursorPos) => {
    state().tempGroup.value = generateGroup(pos);
  };

  const storeGroup = () => {
    const { tempGroup, groupsMap } = state();
    if (tempGroup.value) {
      groupsMap.value.set(tempGroup.value.id, tempGroup.value);
      bufferLogGroupCreate(cloneDeep(tempGroup.value.id));
      tempGroup.value = undefined;
    }
  };

  const resetCreatingGroup = () => {
    state().tempGroup.value = undefined;
  };

  const setResizedGroup = (area: Group | undefined = undefined) => {
    state().resizedGroup.value = area;
  };

  const setMovedGroup = (area: Group | undefined = undefined) => {
    state().movedGroup.value = area;
  };

  const resizeGroup = (areaId: string, deltaX: number, deltaY: number) => {
    const { groupsMap, tempGroup } = state();
    // Check both stored areas and temp area (during creation)
    const area = groupsMap.value.get(areaId)
            ?? (tempGroup.value?.id === areaId ? tempGroup.value : undefined);
    if (!area) return;

    // Clamp minimum size
    area.size.width = Math.max(GROUP_MIN_SIZE, snapToGrid(area.size.width + deltaX, gridSize.value));
    area.size.height = Math.max(GROUP_MIN_SIZE, snapToGrid(area.size.height + deltaY, gridSize.value));
  };

  const getTablesInsideGroup = (area: Group): Table[] => {
    const { tables } = state();
    const areaEndX = area.posX + area.size.width;
    const areaEndY = area.posY + area.size.height;

    return tables.value.filter(it =>
      (it.posX + it.widthPx  > area.posX && it.posX <= areaEndX) &&
            (it.posY > area.posY && it.posY < areaEndY));
  };

  const getGroupsInsideGroup = (area: Group): Group[] => {
    const { groups } = state();
    const areaEndX = area.posX + area.size.width;
    const areaEndY = area.posY + area.size.height;

    return groups.value.filter(it =>
      (it.posX > area.posX && it.posX <= areaEndX) &&
            (it.posY > area.posY && it.posY <= areaEndY));
  };

  const getCommentsInsideGroup = (area: Group) => {
    const { comments } = state();
    const areaEndX = area.posX + area.size.width;
    const areaEndY = area.posY + area.size.height;

    // Only include standalone comments (not linked)
    return comments.value.filter(it =>
      !it.linkedTo &&
            (it.posX >= area.posX && it.posX <= areaEndX) &&
            (it.posY >= area.posY && it.posY <= areaEndY));
  };

  const deleteGroup = (area: Group) => {
    const { groupsMap, movedGroup, resizedGroup, commentsMap, comments } = state();
    // Prevent deletion on accidental mouseup after moving or resizing
    // with cursor being over the delete button
    if (area == movedGroup.value || area == resizedGroup.value) { return; }

    if (groupsMap.value.has(area.id)) {
      // Handle linked comments based on setting
      const linkedComments = comments.value.filter(c =>
        c.linkedTo?.type === 'group' && c.linkedTo.entityId === area.id);

      const bufferEntities: BufferEntity[] = [];

      if (currentSettings.value.deleteLinkedCommentsWithEntity) {
        // Delete linked comments
        for (const comment of linkedComments) {
          bufferEntities.push({
            action: 'delete',
            type: 'comment',
            entityId: comment.id,
            oldVal: cloneDeep(comment)
          });
          commentsMap.value.delete(comment.id);
        }
      } else {
        // Unlink comments
        for (const comment of linkedComments) {
          bufferEntities.push({
            action: 'change',
            type: 'comment',
            entityId: comment.id,
            oldVal: cloneDeep(comment)
          });
          comment.linkedTo = null;
        }
      }

      // Add group deletion and comment handling as single undo action
      stores.bufferStore.addUndoBufferAction({
        entities: [
          {
            action: 'delete',
            type: "group",
            entityId: area.id,
            oldVal: cloneDeep(area),
          },
          ...bufferEntities
        ]
      });

      groupsMap.value.delete(area.id);
    }
  };

  // Buffer actions

  function bufferSetGroupPos(entry: BufferEntity) {
    const area = state().groupsMap.value.get(entry.entityId);
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

  function bufferSetGroupSize(entry: BufferEntity) {
    const area = state().groupsMap.value.get(entry.entityId);
    if (area) {
      const oldVal = cloneDeep(area.size);
      area.size = cloneDeep(entry.oldVal as AreaSize);
      entry.oldVal = oldVal;
    }
  }

  function bufferRestoreGroup(entry: BufferEntity) {
    const area = cloneDeep(entry.oldVal as Group);
    state().groupsMap.value.set(area.id, area);
    entry.oldVal = undefined;
  }

  function bufferDeleteGroup(entry: BufferEntity) {
    const area = state().groupsMap.value.get(entry.entityId);
    if (area) {
      entry.oldVal = cloneDeep(area);
      state().groupsMap.value.delete(entry.entityId);
    }
  }

  function bufferSetGroupValues(entry: BufferEntity) {
    const existingGroup = state().groupsMap.value.get(entry.entityId);
    if (existingGroup) {
      const oldVal = cloneDeep(existingGroup);
      const newGroup = cloneDeep(entry.oldVal as Group);
      state().groupsMap.value.set(entry.entityId, newGroup);
      entry.oldVal = oldVal;
    }
  }

  // Buffer loggers

  function bufferLogGroupCreate(areaId: string) {
    stores.bufferStore.addUndoBufferAction({
      entities: [{
        action: 'create',
        type: "group",
        entityId: areaId,
        oldVal: undefined,
      }]
    });
  }

  function bufferLogGroupDelete(area: Group) {
    stores.bufferStore.addUndoBufferAction({
      entities: [{
        action: 'delete',
        type: "group",
        entityId: area.id,
        oldVal: cloneDeep(area),
      }]
    });
  }

  function bufferLogGroupChange(oldVal: Group) {
    stores.bufferStore.addUndoBufferAction({
      entities: [{
        action: 'change',
        type: "group",
        entityId: oldVal.id,
        oldVal: oldVal,
      }]
    });
  }

  function bufferLogGroupResize(oldVal: AreaSize) {
    const { resizedGroup } = state();
    if (resizedGroup.value != undefined) {
      stores.bufferStore.addUndoBufferAction({
        entities: [{
          action: 'resize',
          type: "group",
          entityId: resizedGroup.value.id,
          oldVal: cloneDeep(oldVal),
        }]
      });
    }
  }

  return {
    startCreatingGroup,
    storeGroup,
    resetCreatingGroup,
    setResizedGroup,
    setMovedGroup,
    resizeGroup,
    deleteGroup,
    getTablesInsideGroup,
    getGroupsInsideGroup,
    getCommentsInsideGroup,
    bufferSetGroupPos,
    bufferSetGroupSize,
    bufferRestoreGroup,
    bufferDeleteGroup,
    bufferSetGroupValues,
    bufferLogGroupCreate,
    bufferLogGroupDelete,
    bufferLogGroupChange,
    bufferLogGroupResize,
  };
}
