import { defineStore, storeToRefs } from "pinia";
import { generateNewForeignKey, generateNewTable, type Table, type TableCol } from "@/types/table.ts";
import { computed, ref, watch } from "vue";
import { useActionBuffer } from "@/store/actionBuffer.ts";
import { type AreaSize, type CursorPos } from "@/components/designer/scripts/useDesignCanvas.ts";
import { cloneDeep } from "lodash";
import type { ActionBufferEntry, BufferEntity } from "@/types/actionsBuffer.ts";
import type { DatabaseRelationship, RelationshipType } from "@/types/relationships.ts";
import { useActionsStore } from "@/store/action.ts";
import { useSettingsStore } from "@/store/settings.ts";
import { createNewRelationship } from "@/types/relationships.ts";
import { clamp, unpluralize } from "@/utils/utils.ts";
import { type ColumnType } from "@/types/TableColumnTypes/tableField.ts";
import { type CommentArea, generateCommentArea } from "@/types/misc.ts";
import { useExportStore } from "@/store/export.ts";
import {
  GRID_SNAP_SIZE,
  DEFAULT_GRID_SIZE,
  TABLE_MIN_WIDTH,
  TABLE_MAX_WIDTH,
  COMMENT_AREA_MIN_SIZE,
  COMMENT_AREA_COLLAPSE_WIDTH,
  COMMENT_AREA_COLLAPSE_HEIGHT
} from "@/types/constants.ts";

export const useDesignStore = defineStore('design', () => {
  const bufferStore = useActionBuffer();
  const actionStore = useActionsStore();

  const settingsStore = useSettingsStore();
  const {
    currentSettings,
    defaultPrimaryKey,
    defaultTableName,
    currentDatabaseColumnTypes,
  } = storeToRefs(settingsStore);

  // Primary storage as Maps for O(1) lookups
  const tablesMap = ref<Map<string, Table>>(new Map());
  const relationsMap = ref<Map<string, DatabaseRelationship>>(new Map());
  const commentAreasMap = ref<Map<string, CommentArea>>(new Map());

  // Computed arrays for component iteration (maintains reactivity)
  const tables = computed(() => [...tablesMap.value.values()]);
  const relations = computed(() => [...relationsMap.value.values()]);
  const commentAreas = computed(() => [...commentAreasMap.value.values()]);

  const newTableIndex = ref<number>(1);

  const gridSize = computed(() => currentSettings.value.snapToGrid ? GRID_SNAP_SIZE : 1);

  const selectedTable = ref<Table | undefined>(undefined);
  const resizedTable = ref<Table | undefined>(undefined);

  // Determine which table should have the highest z-offset
  const focusedTable = ref<Table | undefined>(undefined);

  const tempCommentArea = ref<CommentArea | undefined>(undefined);
  const resizedCommentArea = ref<CommentArea | undefined>(undefined);
  const movedCommentArea = ref<CommentArea | undefined>(undefined);

  // Flag to track whether a table is mounted after manual creation or loaded from localStorage
  const isManualCreation = ref<boolean>(false);

  // Extract normalized table names to minimize recomputation triggers
  const normalizedTableNames = computed(() =>
    tables.value.map(table => table.name.trim().toLowerCase()));

  const duplicateTableNames = computed(() => {
    const names = normalizedTableNames.value;
    const nameCount: Record<string, number> = {};
    const duplicates = new Set<string>();

    for (const name of names) {
      nameCount[name] = (nameCount[name] || 0) + 1;
      if (nameCount[name] === 2) {
        duplicates.add(name);
      }
    }

    return duplicates;
  });

  // Table operations

  const addTable = (
    posX: number,
    posY: number,
    generatePrimary: boolean = true,
    saveBuffer: boolean = true,
    primaryType: ColumnType = defaultPrimaryKey.value
  ) => {
    const table = generateNewTable(
      defaultTableName.value,
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
      bufferStore.addUndoBufferAction(bufferAction);
    }

    newTableIndex.value++;
    isManualCreation.value = true;

    return bufferAction.entities;
  };

  const selectTable = (val: Table | undefined = undefined) => {
    selectedTable.value = val;
  };

  const setResizedTable = (val: Table | undefined = undefined) => {
    resizedTable.value = val;
  };

  const snapToGrid = (value: number, gridSize: number = DEFAULT_GRID_SIZE) => {
    return Math.round(value / gridSize) * gridSize;
  };

  const moveSelectedTable = (deltaX: number, deltaY: number) => {
    if (selectedTable.value) {
      selectedTable.value.posX = snapToGrid(selectedTable.value.posX + deltaX, gridSize.value);
      selectedTable.value.posY = snapToGrid(selectedTable.value.posY + deltaY, gridSize.value);
    }
  };

  const resizeSelectedTable = (deltaX: number) => {
    if (selectedTable.value) {
      selectedTable.value.widthPx = snapToGrid(
        clamp(selectedTable.value.widthPx + deltaX, TABLE_MIN_WIDTH, TABLE_MAX_WIDTH),
        gridSize.value
      );
    }
  };

  const deleteSelectedTable = () => {
    if (selectedTable.value) {
      const deleteTableEntity: BufferEntity = {
        action: 'delete',
        type: "table",
        entityId: selectedTable.value.id,
        oldVal: cloneDeep(selectedTable.value),
      };

      const additionalDeleteEntities = deleteTable(selectedTable.value);

      bufferStore.addUndoBufferAction({
        entities: [
          deleteTableEntity, // Table delete must be undone first
          ...additionalDeleteEntities
        ]
      });

      selectedTable.value = undefined;
    }
  };

  // Columns operation

  const addTableCol = (col: TableCol) => {
    if (selectedTable.value) {
      selectedTable.value.cols.push(cloneDeep(col));

      bufferStore.addUndoBufferAction({
        entities: [{
          action: 'create',
          type: "tableCol",
          entityId: `${selectedTable.value.id}.${col.id}.${selectedTable.value.cols.length - 1}`,
          oldVal: undefined,
        }]
      });

      return true;
    }
    return false;
  };

  const deleteTableCol = (col: TableCol) => {
    if (selectedTable.value) {
      const index = selectedTable.value.cols.indexOf(col);
      if (index != -1) {

        const bufferEntries: BufferEntity[] = [
          {
            action: 'delete',
            type: "tableCol",
            entityId: `${selectedTable.value.id}.${col.id}.${index}`,
            oldVal: cloneDeep(col),
          }
        ];

        const existingRelations = relations.value.filter(it => it.firstTableColId == col.id);

        existingRelations.forEach(rel =>
          bufferEntries.push(...deleteRelationship(rel, false)));

        bufferStore.addUndoBufferAction({
          entities: bufferEntries
        });

        selectedTable.value.cols.splice(index, 1);
      }
    }
  };

  // Comments

  const startCreatingCommentArea = (pos: CursorPos) => {
    tempCommentArea.value = generateCommentArea(pos);
  };

  const storeCommentArea = () => {
    if (tempCommentArea.value) {
      commentAreasMap.value.set(tempCommentArea.value.id, tempCommentArea.value);
      bufferLogCommentAreaCreate(cloneDeep(tempCommentArea.value.id));
      tempCommentArea.value = undefined;
    }
  };

  const resetCreatingCommentArea = () => {
    tempCommentArea.value = undefined;
  };

  const setResizedCommentArea = (area: CommentArea | undefined = undefined) => {
    resizedCommentArea.value = area;
  };

  const setMovedCommentArea = (area: CommentArea | undefined = undefined) => {
    movedCommentArea.value = area;
  };

  const resizeCommentArea = (areaId: string, deltaX: number, deltaY: number) => {
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
    const areaEndX = area.posX + area.size.width;
    const areaEndY = area.posY + area.size.height;

    return tables.value.filter(it =>
      (it.posX + it.widthPx  > area.posX && it.posX <= areaEndX) &&
            (it.posY > area.posY && it.posY < areaEndY));
  };

  const getAreasInsideArea = (area: CommentArea): CommentArea[] => {
    const areaEndX = area.posX + area.size.width;
    const areaEndY = area.posY + area.size.height;

    return commentAreas.value.filter(it =>
      (it.posX > area.posX && it.posX <= areaEndX) &&
            (it.posY > area.posY && it.posY <= areaEndY));
  };

  const moveCommentArea = (
    deltaX: number,
    deltaY: number,
    tableIdsInside: string[],
    areaIdsInside: string[]
  ) => {
    if (movedCommentArea.value) {
      const area = movedCommentArea.value;
      area.posX = snapToGrid(area.posX + deltaX, gridSize.value);
      area.posY = snapToGrid(area.posY + deltaY, gridSize.value);

      for (const areaId of areaIdsInside) {
        const _area = commentAreasMap.value.get(areaId);
        if (_area) {
          _area.posX = snapToGrid(_area.posX + deltaX, gridSize.value);
          _area.posY = snapToGrid(_area.posY + deltaY, gridSize.value);
        }
      }

      // Handles all tables, including inside subareas
      for (const tableId of tableIdsInside) {
        const table = tablesMap.value.get(tableId);
        if (table) {
          table.posX = snapToGrid(table.posX + deltaX, gridSize.value);
          table.posY = snapToGrid(table.posY + deltaY, gridSize.value);
        }
      }
    }
  };

  const deleteCommentArea = (area: CommentArea) => {
    // Prevent deletion on accidental mouseup after moving or resizing
    // with cursor being over the delete button
    if (area == movedCommentArea.value || area == resizedCommentArea.value) { return; }

    if (commentAreasMap.value.has(area.id)) {
      bufferLogCommentAreaDelete(area);
      commentAreasMap.value.delete(area.id);
    }
  };

  // Relationships

  const relationFirstTableId = ref<string | undefined>(undefined);

  const resetRelationshipCreation = () => {
    relationFirstTableId.value = undefined;
  };

  const createRelationship = (type: RelationshipType) => {
    if (!selectedTable.value) { return; }

    // If first table not selected, select and exit
    if (!relationFirstTableId.value) {
      // if type is mtm check if selected table has primaryId column
      if (type === 'mtm' && !selectedTable.value.cols.find(col => col.primaryKey)) { return; }

      relationFirstTableId.value = selectedTable.value.id;
      return;
    }

    // Check if selected table is not the same
    if (relationFirstTableId.value === selectedTable.value.id) { return; }

    const firstTable = tablesMap.value.get(relationFirstTableId.value);
    if (!firstTable) {
      actionStore.resetAction();
      return;
    }


    if (type != "mtm") {
      // Check if relation between tables already exists
      const existingRel = relations.value.find(it =>
        (it.firstTableId == firstTable.id && it.secondTableId == selectedTable.value?.id) ||
                (it.firstTableId == selectedTable.value?.id && it.secondTableId == firstTable.id));

      const bufferEntries: BufferEntity[] = [];

      if (existingRel) {
        if (existingRel.type != type && existingRel.type != 'mtm') {

          // Recreate relationship with updated type
          bufferEntries.push(
            ...deleteRelationship(existingRel, true)
          );

          bufferEntries.push(
            ...createSimpleRelation(firstTable.id, selectedTable.value.id, type)
          );

          bufferStore.addUndoBufferAction({
            entities: bufferEntries
          });
        }

        return;
      }

      const existingMtM = mtmRelationExists(firstTable, selectedTable.value);

      if (existingMtM) {
        const pivot = tablesMap.value.get(existingMtM.firstTableId);
        if (pivot) {
          bufferEntries.push(
            ...deleteTable(pivot),
            // deleteTable() doesn't add buffer entry for table deletion so we must add it manually
            {
              action: 'delete',
              type: 'table',
              entityId: pivot.id,
              oldVal: cloneDeep(pivot),
            },
          );
        }
      }

      bufferEntries.push(
        ...createSimpleRelation(firstTable.id, selectedTable.value.id, type)
      );

      bufferStore.addUndoBufferAction({
        entities: bufferEntries
      });
    } else {
      // Helper to create MtM relation
      function createMtMRelation() {
        const halfwayX = (firstTable!.posX + selectedTable.value!.posX) / 2;
        const halfwayY = (firstTable!.posY + selectedTable.value!.posY) / 2;


        const pivotTableEntry = addTable(
          halfwayX,
          halfwayY,
          currentSettings.value.generateMtMPrimaryKey,
          false,
          currentSettings.value.mtmPrimaryKeyType,
        );

        const pivotTable = tablesMap.value.get(pivotTableEntry[0].entityId);
        if (!pivotTable) return [];

        const nameJoin = currentSettings.value.namingConvention == 'snake' ?
          '_has_' :
          'Has';

        pivotTable.name = `${ unpluralize(firstTable!.name) }${ nameJoin }${ selectedTable.value?.name }`;

        const firstBufferEntry = createSimpleRelation(pivotTable.id, firstTable!.id, 'mtm');
        const secondBufferEntry = createSimpleRelation(pivotTable.id, selectedTable.value!.id, 'mtm');

        return [
          ...pivotTableEntry,
          ...firstBufferEntry,
          ...secondBufferEntry
        ];
      }

      // Check if MtM between given tables already exist
      if (mtmRelationExists(firstTable, selectedTable.value)) {
        return;
      }

      // Check if a simple relation between tables already exists
      const existingRel = relations.value.find(it =>
        (it.firstTableId == firstTable.id && it.secondTableId == selectedTable.value?.id) ||
                (it.secondTableId == firstTable.id && it.firstTableId == selectedTable.value?.id));

      const bufferEntries: BufferEntity[] = [];

      if (existingRel) {
        bufferEntries.push(
          ...deleteRelationship(existingRel, true)
        );
      }

      bufferEntries.push(
        ...createMtMRelation()
      );

      bufferStore.addUndoBufferAction({
        entities: bufferEntries
      });
    }

    actionStore.resetAction();
  };

  // Misc

  const createNewProject = () => {
    tablesMap.value.clear();
    newTableIndex.value = 1;

    relationsMap.value.clear();
    commentAreasMap.value.clear();

    bufferStore.clearState();

    useExportStore().resetProjectInfo();
  };

  // Buffer actions

  function bufferDeleteTable(bufferEntry: BufferEntity) {
    const table = tablesMap.value.get(bufferEntry.entityId);
    if (table) {
      // Store copy to buffer and delete the table
      bufferEntry.oldVal = cloneDeep(table);

      // Relationships to the table should not exist at this point
      deleteTable(table);
    }
  }

  function bufferRestoreTable(bufferEntry: BufferEntity) {
    const table = cloneDeep(bufferEntry.oldVal as Table);
    tablesMap.value.set(table.id, table);
    bufferEntry.oldVal = undefined;
  }

  function bufferSetTablePos(bufferEntry: BufferEntity) {
    const table = tablesMap.value.get(bufferEntry.entityId);
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
    const table = tablesMap.value.get(bufferEntry.entityId);
    if (table) {
      const width = cloneDeep(bufferEntry.oldVal as number);

      bufferEntry.oldVal = cloneDeep(table.widthPx);

      table.widthPx = width;
    }
  }

  function bufferSetTableVal(bufferEntry: BufferEntity) {
    const existingTable = tablesMap.value.get(bufferEntry.entityId);
    if (existingTable) {
      const oldVal = cloneDeep(existingTable);
      const newTable = cloneDeep(bufferEntry.oldVal as Table);
      tablesMap.value.set(bufferEntry.entityId, newTable);
      bufferEntry.oldVal = oldVal;
    }
  }

  function bufferDeleteCol(bufferEntry: BufferEntity) {
    const [tableId, colId] = bufferEntry.entityId.split('.');
    if (!tableId || !colId) return;

    const table = tablesMap.value.get(tableId);
    if (table) {
      const colIndex = table.cols.findIndex(it => it.id == colId);

      if (colIndex != -1) {
        bufferEntry.oldVal = cloneDeep(table.cols[colIndex]);
        table.cols.splice(colIndex, 1);
      }
    }
  }

  function bufferRestoreCol(bufferEntry: BufferEntity) {
    const [tableId, colId, colIndex] = bufferEntry.entityId.split('.');
    if (!tableId || !colId || !colIndex) return;


    const table = tablesMap.value.get(tableId);
    if (table) {
      table.cols.splice(parseInt(colIndex), 0, cloneDeep(bufferEntry.oldVal) as TableCol);

      bufferEntry.oldVal = undefined;
    }
  }

  function bufferRevertColumnVal(bufferEntry: BufferEntity) {
    const [tableId, colId] = bufferEntry.entityId.split('.');
    if (!tableId || !colId) return;

    const table = tablesMap.value.get(tableId);
    if (table) {
      const colIndex = table.cols.findIndex(it => it.id == colId);

      if (colIndex != -1) {
        const oldVal = cloneDeep(table.cols[colIndex]);
        table.cols[colIndex] = (bufferEntry.oldVal as TableCol);
        bufferEntry.oldVal = oldVal;
      }
    }
  }

  function bufferDeleteRelation(bufferEntry: BufferEntity) {
    const relation = relationsMap.value.get(bufferEntry.entityId);
    if (relation) {
      bufferEntry.oldVal = cloneDeep(relation);
      relationsMap.value.delete(bufferEntry.entityId);
    }
  }

  function bufferRestoreRelation(bufferEntry: BufferEntity) {
    const relation = cloneDeep(bufferEntry.oldVal as DatabaseRelationship);
    relationsMap.value.set(relation.id, relation);
    bufferEntry.oldVal = undefined;
  }

  function bufferChangeRelation(bufferEntry: BufferEntity) {
    const existingRelation = relationsMap.value.get(bufferEntry.entityId);
    if (existingRelation) {
      const oldVal = cloneDeep(existingRelation);
      relationsMap.value.set(bufferEntry.entityId, bufferEntry.oldVal as DatabaseRelationship);
      bufferEntry.oldVal = oldVal;
    }
  }

  function bufferSetCommentAreaPos(entry: BufferEntity) {
    const area = commentAreasMap.value.get(entry.entityId);
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
    const area = commentAreasMap.value.get(entry.entityId);
    if (area) {
      const oldVal = cloneDeep(area.size);
      area.size = cloneDeep(entry.oldVal as AreaSize);
      entry.oldVal = oldVal;
    }
  }

  function bufferRestoreCommentArea(entry: BufferEntity) {
    const area = cloneDeep(entry.oldVal as CommentArea);
    commentAreasMap.value.set(area.id, area);
    entry.oldVal = undefined;
  }

  function bufferDeleteCommentArea(entry: BufferEntity) {
    const area = commentAreasMap.value.get(entry.entityId);
    if (area) {
      entry.oldVal = cloneDeep(area);
      commentAreasMap.value.delete(entry.entityId);
    }
  }

  function bufferSetCommentAreaValues(entry: BufferEntity) {
    const existingArea = commentAreasMap.value.get(entry.entityId);
    if (existingArea) {
      const oldVal = cloneDeep(existingArea);
      const newArea = cloneDeep(entry.oldVal as CommentArea);
      commentAreasMap.value.set(entry.entityId, newArea);
      entry.oldVal = oldVal;
    }
  }

  function bufferLogTableMove(pos: CursorPos) {
    if (selectedTable.value) {
      bufferStore.addUndoBufferAction({
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
    if (resizedTable.value) {
      bufferStore.addUndoBufferAction({
        entities: [{
          action: 'resize',
          type: "table",
          entityId: resizedTable.value.id,
          oldVal: width,
        }]
      });
    }
  }

  function bufferLogColChange(col: TableCol, oldVal: TableCol) {
    if (selectedTable.value) {
      bufferStore.addUndoBufferAction({
        entities: [{
          action: 'change',
          type: "tableCol",
          entityId: `${selectedTable.value.id}.${col.id}`,
          oldVal: oldVal,
        }]
      });
    }
  }

  function bufferLogTableChange(oldVal: Table) {
    if (selectedTable.value) {
      bufferStore.addUndoBufferAction({
        entities: [{
          action: 'change',
          type: "table",
          entityId: selectedTable.value.id,
          oldVal: oldVal,
        }]
      });
    }
  }

  function bufferLogCommentAreaCreate(areaId: string) {
    bufferStore.addUndoBufferAction({
      entities: [{
        action: 'create',
        type: "commentArea",
        entityId: areaId,
        oldVal: undefined,
      }]
    });
  }

  function bufferLogCommentAreaDelete(area: CommentArea) {
    bufferStore.addUndoBufferAction({
      entities: [{
        action: 'delete',
        type: "commentArea",
        entityId: area.id,
        oldVal: cloneDeep(area),
      }]
    });
  }

  function bufferLogCommentAreaChange(oldVal: CommentArea) {
    bufferStore.addUndoBufferAction({
      entities: [{
        action: 'change',
        type: "commentArea",
        entityId: oldVal.id,
        oldVal: oldVal,
      }]
    });
  }

  function bufferLogCommentAreaMove(
    oldVal: CursorPos,
    tableIdsInside: string[],
    areaIdsInside: string[]
  ) {
    if (movedCommentArea.value != undefined) {
      const entities: BufferEntity[] = [];
      entities.push({
        action: 'move',
        type: "commentArea",
        entityId: movedCommentArea.value.id,
        oldVal: oldVal,
      });

      const area = movedCommentArea.value;

      const deltaX = area.posX - oldVal.x;
      const deltaY = area.posY - oldVal.y;

      for (const tableId of tableIdsInside) {
        const table = tablesMap.value.get(tableId);
        if (table) {
          entities.push({
            action: 'move',
            type: "table",
            entityId: table.id,
            oldVal: {
              x: table.posX - deltaX,
              y: table.posY - deltaY
            },
          });
        }
      }

      for (const areaId of areaIdsInside) {
        const _area = commentAreasMap.value.get(areaId);
        if (_area) {
          entities.push({
            action: 'move',
            type: "commentArea",
            entityId: _area.id,
            oldVal: {
              x: _area.posX - deltaX,
              y: _area.posY - deltaY
            },
          });
        }
      }

      bufferStore.addUndoBufferAction({
        entities
      });
    }
  }

  function bufferLogCommentAreaResize(oldVal: AreaSize) {
    if (resizedCommentArea.value != undefined) {
      bufferStore.addUndoBufferAction({
        entities: [{
          action: 'resize',
          type: "commentArea",
          entityId: resizedCommentArea.value.id,
          oldVal: cloneDeep(oldVal),
        }]
      });
    }
  }

  // Helpers

  // Helper to create non-mtm relation
  function createSimpleRelation(
    firstTableId: string,
    secondTableId: string,
    type: RelationshipType
  ): BufferEntity[] {
    const firstTable = tablesMap.value.get(firstTableId);
    const secondTable = tablesMap.value.get(secondTableId);

    if (!firstTable || !secondTable) {
      console.error("Table not found", firstTableId, secondTableId);
      actionStore.resetAction();
      return [];
    }

    const foreignKey = generateNewForeignKey(
      secondTable,
      [ 'ioto', 'noto' ].includes(type),
      [ 'ioto', 'iotm', 'mtm' ].includes(type),
      currentSettings.value.namingConvention
    )!;

    const secondPrimary = secondTable.cols.find(it => it.primaryKey);

    if (!secondPrimary) {
      console.error("Second table has no primary key", secondTable);

      actionStore.resetAction();

      return [];
    }

    firstTable.cols.push(cloneDeep(foreignKey));

    const rel = cloneDeep(createNewRelationship(
      foreignKey.id,
      firstTable.id,

      secondPrimary.id,
      secondTable.id,
      type
    ));

    relationsMap.value.set(rel.id, rel);

    return [{
      action: 'create',
      type: "tableCol",
      entityId: `${ firstTable.id }.${ foreignKey.id }.${ secondTable.cols.length}`,
      oldVal: undefined,
    }, {
      action: 'create',
      type: "relation",
      entityId: rel.id,
      oldVal: undefined,
    }] as BufferEntity[];
  }

  function deleteRelationship(relation: DatabaseRelationship, deleteColumn: boolean = false) {
    const bufferEntries: BufferEntity[] = [];
    const firstTable = tablesMap.value.get(relation.firstTableId);

    if (!firstTable) { return []; }

    const oldFKIndex = firstTable.cols.findIndex(it => it.id == relation.firstTableColId);

    if (oldFKIndex == -1) { return []; }

    const oldFK = firstTable.cols[oldFKIndex];

    if (deleteColumn) {
      bufferEntries.push({
        action: 'delete',
        type: 'tableCol',
        entityId: `${firstTable.id}.${oldFK.id}.${oldFKIndex}`,
        oldVal: cloneDeep(oldFK),
      });

      firstTable.cols.splice(oldFKIndex, 1);
    } else {
      bufferEntries.push({
        action: 'change',
        type: 'tableCol',
        entityId: `${firstTable.id}.${oldFK.id}.${oldFKIndex}`,
        oldVal: cloneDeep(oldFK),
      });

      oldFK.foreignKey = false;
    }

    bufferEntries.push({
      action: 'delete',
      type: 'relation',
      entityId: relation.id,
      oldVal: cloneDeep(relation)
    });

    relationsMap.value.delete(relation.id);

    return bufferEntries;
  }

  function mtmRelationExists(first: Table, second: Table): DatabaseRelationship | undefined {
    const mtmRels = relations.value.filter(it => it.type == 'mtm' && it.secondTableId == first.id);

    return mtmRels.find(relation => {
      const pivot = tablesMap.value.get(relation.firstTableId);
      if (!pivot) return false;

      return relations.value.some(it =>
        it.type === 'mtm' &&
                it.firstTableId === pivot.id &&
                it.secondTableId === second.id);
    });
  }

  function deleteTable(table: Table) {
    if (!tablesMap.value.has(table.id)) {
      return [];
    }

    const bufferEntities: BufferEntity[] = [];

    const existingRelations = relations.value.filter(it =>
      it.firstTableId == table.id || it.secondTableId == table.id);

    existingRelations.forEach( it =>
      bufferEntities.push(...deleteRelationship(it, false)));

    tablesMap.value.delete(table.id);

    return bufferEntities;
  }

  // Import helpers for setting all data at once (used by export store)
  function setAllTables(newTables: Table[]) {
    tablesMap.value.clear();
    newTables.forEach(table => tablesMap.value.set(table.id, table));
  }

  function setAllRelations(newRelations: DatabaseRelationship[]) {
    relationsMap.value.clear();
    newRelations.forEach(rel => relationsMap.value.set(rel.id, rel));
  }

  function setAllCommentAreas(newAreas: CommentArea[]) {
    commentAreasMap.value.clear();
    newAreas.forEach(area => commentAreasMap.value.set(area.id, area));
  }

  // Helper function to update relation type based on FK column properties
  function updateRelationTypeFromColumn(relation: DatabaseRelationship, fkColumn: TableCol): RelationshipType | null {
    // Skip MTM relations as they have different rules
    if (relation.type === 'mtm') return null;

    const isIdentifying = fkColumn.notNull;
    const isOneToOne = fkColumn.unique;

    // Determine new type based on column properties
    if (isOneToOne) {
      return isIdentifying ? 'ioto' : 'noto';
    } else {
      return isIdentifying ? 'iotm' : 'notm';
    }
  }

  // Monitor FK columns and update relation types accordingly
  watch(
    () => tables.value.flatMap(table =>
      table.cols
        .filter(col => col.foreignKey)
        .map(col => ({
          tableId: table.id,
          colId: col.id,
          notNull: col.notNull,
          unique: col.unique
        }))
    ),
    (newFKStates, oldFKStates) => {
      if (!oldFKStates) return; // Skip initial run

      // Check each FK column for changes
      newFKStates.forEach(newState => {
        const oldState = oldFKStates.find(
          s => s.tableId === newState.tableId && s.colId === newState.colId
        );

        // If notNull or unique changed, update the relation
        if (oldState && (oldState.notNull !== newState.notNull || oldState.unique !== newState.unique)) {
          const relation = relations.value.find(r => r.firstTableColId === newState.colId);

          if (relation) {
            const table = tablesMap.value.get(newState.tableId);
            const fkColumn = table?.cols.find(c => c.id === newState.colId);

            if (fkColumn) {
              const newType = updateRelationTypeFromColumn(relation, fkColumn);

              if (newType && newType !== relation.type) {
                // Log the change to the buffer
                bufferStore.addUndoBufferAction({
                  entities: [{
                    action: 'change',
                    type: 'relation',
                    entityId: relation.id,
                    oldVal: cloneDeep(relation)
                  }]
                });

                // Update the relation type
                relation.type = newType;
              }
            }
          }
        }
      });
    },
    { deep: true }
  );

  // Monitor PK column type changes and update corresponding FK columns
  watch(
    () => tables.value.flatMap(table =>
      table.cols
        .filter(col => col.primaryKey)
        .map(col => ({
          tableId: table.id,
          colId: col.id,
          typeName: col.type.displayName,
          modifierValues: col.modifierValues
        }))
    ),
    (newPKStates, oldPKStates) => {
      if (!oldPKStates || !currentSettings.value.updateForeignKeysOnPrimaryChange) return;

      // Check each PK column for type changes
      newPKStates.forEach(newState => {
        const oldState = oldPKStates.find(
          s => s.tableId === newState.tableId && s.colId === newState.colId
        );

        // If type changed, update all FK columns that reference this PK
        if (oldState && oldState.typeName !== newState.typeName) {
          // Find all relations that reference this PK
          const affectedRelations = relations.value.filter(
            r => r.secondTableColId === newState.colId
          );

          affectedRelations.forEach(relation => {
            const fkTable = tablesMap.value.get(relation.firstTableId);
            const fkColumn = fkTable?.cols.find(c => c.id === relation.firstTableColId);
            const pkTable = tablesMap.value.get(newState.tableId);
            const pkColumn = pkTable?.cols.find(c => c.id === newState.colId);

            if (fkColumn && pkColumn && fkTable) {
              const fkIndex = fkTable.cols.indexOf(fkColumn);

              // Convert SERIAL types to their integer equivalents for FK columns
              let fkType = pkColumn.type;
              if (pkColumn.type.primitive === 'serial') {
                const serialToIntMap: Record<string, string> = {
                  'SMALLSERIAL': 'SMALLINT',
                  'SERIAL': 'INTEGER',
                  'BIGSERIAL': 'BIGINT'
                };
                const intTypeName = serialToIntMap[pkColumn.type.displayName];
                if (intTypeName) {
                  const intType = currentDatabaseColumnTypes.value.find(
                    t => t.displayName === intTypeName
                  );
                  if (intType) {
                    fkType = intType;
                  }
                }
              }

              // Log the change to the buffer
              bufferStore.addUndoBufferAction({
                entities: [{
                  action: 'change',
                  type: 'tableCol',
                  entityId: `${fkTable.id}.${fkColumn.id}.${fkIndex}`,
                  oldVal: cloneDeep(fkColumn)
                }]
              });

              // Update FK column type and modifiers to match PK
              fkColumn.type = fkType;
              fkColumn.modifierValues = pkColumn.modifierValues;
            }
          });
        }
      });
    },
    { deep: true }
  );


  return {
    tables,
    selectedTable,
    resizedTable,
    newTableIndex, // Must be returned to preserve state

    focusedTable,

    relations,

    duplicateTableNames,
    isManualCreation,

    addTable,
    selectTable,
    setResizedTable,
    moveSelectedTable,
    resizeSelectedTable,
    deleteSelectedTable,

    addTableCol,
    deleteTableCol,

    // Comment area creation
    tempCommentArea,
    startCreatingCommentArea,
    storeCommentArea,
    resetCreatingCommentArea,

    // Existing comments areas
    commentAreas,
    resizedCommentArea,
    movedCommentArea,
    setResizedCommentArea,
    resizeCommentArea,
    setMovedCommentArea,
    moveCommentArea,
    deleteCommentArea,

    createRelationship,
    resetRelationshipCreation,

    createNewProject,

    // Buffer actions
    bufferDeleteTable,
    bufferRestoreTable,
    bufferSetTablePos,
    bufferSetTableWidth,
    bufferSetTableVal,

    bufferDeleteCol,
    bufferRestoreCol,
    bufferRevertColumnVal,

    bufferDeleteRelation,
    bufferRestoreRelation,
    bufferChangeRelation,

    bufferSetCommentAreaPos,
    bufferSetCommentAreaSize,
    bufferDeleteCommentArea,
    bufferRestoreCommentArea,
    bufferSetCommentAreaValues,

    bufferLogTableMove,
    bufferLogTableResize,
    bufferLogColChange,
    bufferLogTableChange,

    bufferLogCommentAreaCreate,
    bufferLogCommentAreaDelete,
    bufferLogCommentAreaChange,
    bufferLogCommentAreaMove,
    bufferLogCommentAreaResize,


    getTablesInsideArea,
    getAreasInsideArea,

    // Import helpers
    setAllTables,
    setAllRelations,
    setAllCommentAreas,

    // Expose maps for direct access when needed
    tablesMap,
    relationsMap,
    commentAreasMap,
  };
}, {
  persist: {
    key: `__ermd_design`,
    pick: [
      'tablesMap', 'newTableIndex', 'relationsMap', 'commentAreasMap'
    ],
    serializer: {
      serialize: (state) => {
        // Convert Maps to arrays for storage
        const toSave = {
          tables: [...(state.tablesMap as Map<string, Table>).values()],
          relations: [...(state.relationsMap as Map<string, DatabaseRelationship>).values()],
          commentAreas: [...(state.commentAreasMap as Map<string, CommentArea>).values()],
          newTableIndex: state.newTableIndex
        };
        return JSON.stringify(toSave, (_key, value) => {
          if (typeof value === 'bigint') {
            return { __type: 'bigint', value: value.toString() };
          }
          return value;
        });
      },
      deserialize: (value) => {
        const parsed = JSON.parse(value, (_key, value) => {
          if (value && value.__type === 'bigint') {
            return BigInt(value.value);
          }
          return value;
        });
        // Convert arrays to Maps for hydration
        return {
          tablesMap: new Map(parsed.tables?.map((t: Table) => [t.id, t]) ?? []),
          relationsMap: new Map(parsed.relations?.map((r: DatabaseRelationship) => [r.id, r]) ?? []),
          commentAreasMap: new Map(parsed.commentAreas?.map((a: CommentArea) => [a.id, a]) ?? []),
          newTableIndex: parsed.newTableIndex ?? 0
        };
      }
    }
  }
});
