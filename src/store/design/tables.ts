import type { Ref, ComputedRef } from "vue";
import type { Table } from "@/types/table.ts";
import type { DatabaseRelationship } from "@/types/relationships.ts";
import type { Group } from "@/types/misc.ts";
import type { Comment } from "@/types/comments.ts";
import type { CursorPos } from "@/components/designer/scripts/useDesignCanvas.ts";
import type { ActionBufferEntry, BufferEntity } from "@/types/actionsBuffer.ts";
import { generateNewTable } from "@/types/table.ts";
import { cloneDeep } from "lodash";
import { clamp } from "@/utils/utils.ts";
import { DEFAULT_GRID_SIZE, TABLE_MIN_WIDTH, TABLE_MAX_WIDTH } from "@/types/constants.ts";
import type { useActionBuffer } from "@/store/actionBuffer.ts";
import type { useSettingsStore } from "@/store/settings.ts";

export interface DesignState {
  tablesMap: Ref<Map<string, Table>>;
  relationsMap: Ref<Map<string, DatabaseRelationship>>;
  groupsMap: Ref<Map<string, Group>>;
  commentsMap: Ref<Map<string, Comment>>;
  tables: ComputedRef<Table[]>;
  relations: ComputedRef<DatabaseRelationship[]>;
  groups: ComputedRef<Group[]>;
  comments: ComputedRef<Comment[]>;
  selectedTable: Ref<Table | undefined>;
  movedComment: Ref<Comment | undefined>;
  linkingComment: Ref<Comment | undefined>;
  resizedTable: Ref<Table | undefined>;
  focusedTable: Ref<Table | undefined>;
  tempGroup: Ref<Group | undefined>;
  resizedGroup: Ref<Group | undefined>;
  movedGroup: Ref<Group | undefined>;
  relationFirstTableId: Ref<string | undefined>;
  newTableIndex: Ref<number>;
  isManualCreation: Ref<boolean>;
  relationsByPKColumnId: ComputedRef<Map<string, DatabaseRelationship[]>>;
}

export function createTableOperations(
  state: () => DesignState,
  stores: {
    bufferStore: ReturnType<typeof useActionBuffer>;
    settingsStore: ReturnType<typeof useSettingsStore>;
  },
  gridSize: ComputedRef<number>
) {
  const addTable = (
    posX: number,
    posY: number,
    generatePrimary: boolean = true,
    saveBuffer: boolean = true,
    primaryType = stores.settingsStore.defaultPrimaryKey
  ) => {
    const { tablesMap, newTableIndex, isManualCreation } = state();

    const table = generateNewTable(
      stores.settingsStore.defaultTableName,
      newTableIndex.value,
      posX,
      posY,
      primaryType,
      generatePrimary,
    );

    tablesMap.value.set(table.id, table);

    const bufferAction: ActionBufferEntry = {
      entities: [{
        action: 'create',
        type: 'table',
        entityId: table.id,
        oldVal: undefined,
      }]
    };

    if (saveBuffer) {
      stores.bufferStore.addUndoBufferAction(bufferAction);
    }

    newTableIndex.value++;
    isManualCreation.value = true;

    return bufferAction.entities;
  };

  const selectTable = (val: Table | undefined = undefined) => {
    state().selectedTable.value = val;
  };

  const setResizedTable = (val: Table | undefined = undefined) => {
    state().resizedTable.value = val;
  };

  const snapToGrid = (value: number, gridSizeVal: number = DEFAULT_GRID_SIZE) => {
    return Math.round(value / gridSizeVal) * gridSizeVal;
  };

  const moveSelectedTable = (deltaX: number, deltaY: number) => {
    const { selectedTable } = state();
    if (selectedTable.value) {
      selectedTable.value.posX = snapToGrid(selectedTable.value.posX + deltaX, gridSize.value);
      selectedTable.value.posY = snapToGrid(selectedTable.value.posY + deltaY, gridSize.value);
    }
  };

  const resizeSelectedTable = (deltaX: number) => {
    const { selectedTable } = state();
    if (selectedTable.value) {
      selectedTable.value.widthPx = snapToGrid(
        clamp(selectedTable.value.widthPx + deltaX, TABLE_MIN_WIDTH, TABLE_MAX_WIDTH),
        gridSize.value
      );
    }
  };

  // Buffer actions

  function bufferRestoreTable(bufferEntry: BufferEntity) {
    const table = cloneDeep(bufferEntry.oldVal as Table);
    state().tablesMap.value.set(table.id, table);
    bufferEntry.oldVal = undefined;
  }

  function bufferSetTablePos(bufferEntry: BufferEntity) {
    const table = state().tablesMap.value.get(bufferEntry.entityId);
    if (table) {
      const pos = cloneDeep(bufferEntry.oldVal as CursorPos);
      // Swap buffer oldVal and current value
      bufferEntry.oldVal = {
        x: table.posX,
        y: table.posY
      };

      table.posX = pos.x;
      table.posY = pos.y;
    }
  }

  function bufferSetTableWidth(bufferEntry: BufferEntity) {
    const table = state().tablesMap.value.get(bufferEntry.entityId);
    if (table) {
      const width = cloneDeep(bufferEntry.oldVal as number);

      bufferEntry.oldVal = cloneDeep(table.widthPx);

      table.widthPx = width;
    }
  }

  function bufferSetTableVal(bufferEntry: BufferEntity) {
    const existingTable = state().tablesMap.value.get(bufferEntry.entityId);
    if (existingTable) {
      const oldVal = cloneDeep(existingTable);
      const newTable = cloneDeep(bufferEntry.oldVal as Table);
      state().tablesMap.value.set(bufferEntry.entityId, newTable);
      bufferEntry.oldVal = oldVal;
    }
  }

  // Buffer loggers

  function bufferLogTableMove(pos: CursorPos) {
    const { selectedTable } = state();
    if (selectedTable.value) {
      stores.bufferStore.addUndoBufferAction({
        entities: [{
          action: 'move',
          type: "table",
          entityId: selectedTable.value.id,
          oldVal: pos,
        }]
      });
    }
  }

  function bufferLogTableResize(width: number) {
    const { resizedTable } = state();
    if (resizedTable.value) {
      stores.bufferStore.addUndoBufferAction({
        entities: [{
          action: 'resize',
          type: "table",
          entityId: resizedTable.value.id,
          oldVal: width,
        }]
      });
    }
  }

  function bufferLogTableChange(oldVal: Table) {
    const { selectedTable } = state();
    if (selectedTable.value) {
      stores.bufferStore.addUndoBufferAction({
        entities: [{
          action: 'change',
          type: "table",
          entityId: selectedTable.value.id,
          oldVal: oldVal,
        }]
      });
    }
  }

  return {
    addTable,
    selectTable,
    setResizedTable,
    moveSelectedTable,
    resizeSelectedTable,
    bufferRestoreTable,
    bufferSetTablePos,
    bufferSetTableWidth,
    bufferSetTableVal,
    bufferLogTableMove,
    bufferLogTableResize,
    bufferLogTableChange,
  };
}
