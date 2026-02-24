import { defineStore, storeToRefs } from "pinia";
import { generateNewForeignKey, type Table, type TableCol } from "@/types/table.ts";
import { computed, ref, watch } from "vue";
import { useActionBuffer } from "@/store/actionBuffer.ts";
import { type CursorPos } from "@/components/designer/scripts/useDesignCanvas.ts";
import { cloneDeep } from "lodash";
import type { BufferEntity } from "@/types/actionsBuffer.ts";
import type { DatabaseRelationship, RelationshipType } from "@/types/relationships.ts";
import { useActionsStore } from "@/store/action.ts";
import { useSettingsStore } from "@/store/settings.ts";
import { createNewRelationship } from "@/types/relationships.ts";
import { unpluralize } from "@/utils/utils.ts";
import { type Group } from "@/types/misc.ts";
import type { Comment } from "@/types/comments.ts";
import { useExportStore } from "@/store/export.ts";
import { GRID_SNAP_SIZE, DEFAULT_GRID_SIZE } from "@/types/constants.ts";

import { createTableOperations } from "./design/tables.ts";
import { createColumnOperations } from "./design/columns.ts";
import { createRelationOperations } from "./design/relations.ts";
import { createGroupOperations } from "./design/groups.ts";
import { createCommentOperations } from "./design/comments.ts";
import { useNotificationStore } from "@/store/ui/notifications.ts";
import i18n from "@/utils/i18n.ts";

export const useDesignStore = defineStore(
  'design',
  () => {
    const bufferStore = useActionBuffer();
    const actionStore = useActionsStore();
    const notificationStore =  useNotificationStore();

    const settingsStore = useSettingsStore();
    const {
      currentSettings,
    } = storeToRefs(settingsStore);

    // Primary storage as Maps for O(1) lookups
    const tablesMap = ref<Map<string, Table>>(new Map());
    const relationsMap = ref<Map<string, DatabaseRelationship>>(new Map());
    const groupsMap = ref<Map<string, Group>>(new Map());
    const commentsMap = ref<Map<string, Comment>>(new Map());

    // Computed arrays for component iteration
    const tables = computed(() => [...tablesMap.value.values()]);
    const relations = computed(() => [...relationsMap.value.values()]);
    const groups = computed(() => [...groupsMap.value.values()]);
    const comments = computed(() => [...commentsMap.value.values()]);

    // Map relations by PK column ID for fast lookup
    const relationsByPKColumnId = computed(() => {
      const map = new Map<string, DatabaseRelationship[]>();
      for (const relation of relationsMap.value.values()) {
        const existing = map.get(relation.secondTableColId) || [];
        existing.push(relation);
        map.set(relation.secondTableColId, existing);
      }
      return map;
    });

    const newTableIndex = ref<number>(1);

    const gridSize = computed(() => currentSettings.value.snapToGrid ? GRID_SNAP_SIZE : 1);

    const selectedTable = ref<Table | undefined>(undefined);
    const resizedTable = ref<Table | undefined>(undefined);

    // Determine which table should have the highest z-offset
    const focusedTable = ref<Table | undefined>(undefined);

    const tempGroup = ref<Group | undefined>(undefined);
    const resizedGroup = ref<Group | undefined>(undefined);
    const movedGroup = ref<Group | undefined>(undefined);

    const movedComment = ref<Comment | undefined>(undefined);
    const linkingComment = ref<Comment | undefined>(undefined);

    const relationFirstTableId = ref<string | undefined>(undefined);

    interface FocusedCol {
      col: TableCol;
      tableId: string;
    }

    const focusedCol = ref<FocusedCol | undefined>(undefined);

    const setFocusedCol = (col: TableCol | undefined, tableId?: string) => {
      focusedCol.value = col && tableId ? { col, tableId } : undefined;
    };

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

    // ==================== MODULES ====================

    const getState = () => ({
      tablesMap,
      relationsMap,
      groupsMap,
      commentsMap,
      tables,
      relations,
      groups,
      comments,
      selectedTable,
      movedComment,
      linkingComment,
      resizedTable,
      focusedTable,
      tempGroup,
      resizedGroup,
      movedGroup,
      relationFirstTableId,
      newTableIndex,
      isManualCreation,
      relationsByPKColumnId,
    });

    const tableOps = createTableOperations(getState, { bufferStore, settingsStore }, gridSize);
    const columnOps = createColumnOperations(getState, { bufferStore, settingsStore });
    const relationOps = createRelationOperations(getState);
    const groupOps = createGroupOperations(getState, { bufferStore }, gridSize, currentSettings);
    const commentOps = createCommentOperations(getState, { bufferStore });

    // ==================== CROSS-DOMAIN OPERATIONS ====================

    const snapToGrid = (value: number, gridSizeVal: number = DEFAULT_GRID_SIZE) => {
      return Math.round(value / gridSizeVal) * gridSizeVal;
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

          // Delete relations where this column is the FK
          const fkRelations = relations.value.filter(it => it.firstTableColId == col.id);
          fkRelations.forEach(rel =>
            bufferEntries.push(...deleteRelationship(rel, false)));

          // Delete relations where this column is the PK
          const pkRelations = relations.value.filter(it => it.secondTableColId == col.id);
          pkRelations.forEach(rel =>
            bufferEntries.push(...deleteRelationship(rel, currentSettings.value.deleteForeignKeyColumnOnRelationDelete)));

          // Handle linked comments based on setting
          const columnEntityId = `${selectedTable.value.id}.${col.id}`;
          const linkedComments = comments.value.filter(c =>
            c.linkedTo?.type === 'column' && c.linkedTo.entityId === columnEntityId);

          if (currentSettings.value.deleteLinkedCommentsWithEntity) {
            // Delete linked comments
            for (const comment of linkedComments) {
              bufferEntries.push({
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
              bufferEntries.push({
                action: 'change',
                type: 'comment',
                entityId: comment.id,
                oldVal: cloneDeep(comment)
              });
              comment.linkedTo = null;
            }
          }

          bufferStore.addUndoBufferAction({
            entities: bufferEntries
          });

          selectedTable.value.cols.splice(index, 1);
        }
      }
    };

    const bufferLogColChange = (col: TableCol, oldVal: TableCol) => {
      const bufferEntries = columnOps.buildColChangeEntries(col, oldVal);

      // If PK was removed, delete relations referencing this column as PK
      if (oldVal.primaryKey && !col.primaryKey) {
        const pkRelations = relations.value.filter(r => r.secondTableColId === col.id);
        pkRelations.forEach(rel =>
          bufferEntries.push(...deleteRelationship(rel, currentSettings.value.deleteForeignKeyColumnOnRelationDelete)));
      }

      if (bufferEntries.length > 0) {
        bufferStore.addUndoBufferAction({ entities: bufferEntries });
      }
    };


    const moveGroup = (
      deltaX: number,
      deltaY: number,
      tableIdsInside: string[],
      areaIdsInside: string[],
      commentIdsInside: string[]
    ) => {
      if (movedGroup.value) {
        const area = movedGroup.value;
        area.posX = snapToGrid(area.posX + deltaX, gridSize.value);
        area.posY = snapToGrid(area.posY + deltaY, gridSize.value);

        for (const areaId of areaIdsInside) {
          const _area = groupsMap.value.get(areaId);
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

        // Move standalone comments inside group
        for (const commentId of commentIdsInside) {
          const comment = commentsMap.value.get(commentId);
          if (comment) {
            comment.posX = snapToGrid(comment.posX + deltaX, gridSize.value);
            comment.posY = snapToGrid(comment.posY + deltaY, gridSize.value);
          }
        }
      }
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

          actionStore.resetAction();
          return;
        }

        const existingMtM = relationOps.mtmRelationExists(firstTable, selectedTable.value);

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


          const pivotTableEntry = tableOps.addTable(
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
        if (relationOps.mtmRelationExists(firstTable, selectedTable.value)) {
          return;
        }

        // Verify both tables have primary keys before creating pivot
        const firstHasPK = firstTable.cols.some(col => col.primaryKey);
        const secondHasPK = selectedTable.value.cols.some(col => col.primaryKey);
        if (!firstHasPK || !secondHasPK) {
          const tableName = !firstHasPK ? firstTable.name : selectedTable.value.name;
          notificationStore.show(i18n.global.t('notifications.noPrimaryKey', { tableName }), 'error');
          actionStore.resetAction();
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


    // ==================== BUFFER ACTIONS (Cross-domain) ====================

    function bufferDeleteTable(bufferEntry: BufferEntity) {
      const table = tablesMap.value.get(bufferEntry.entityId);
      if (table) {
        // Store copy to buffer and delete the table
        bufferEntry.oldVal = cloneDeep(table);

        // Relationships to the table should not exist at this point
        deleteTable(table);
      }
    }

    function bufferLogGroupMove(
      oldVal: CursorPos,
      tableIdsInside: string[],
      areaIdsInside: string[],
      commentIdsInside: string[]
    ) {
      if (movedGroup.value != undefined) {
        const entities: BufferEntity[] = [];
        entities.push({
          action: 'move',
          type: "group",
          entityId: movedGroup.value.id,
          oldVal: oldVal,
        });

        const area = movedGroup.value;

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
          const _area = groupsMap.value.get(areaId);
          if (_area) {
            entities.push({
              action: 'move',
              type: "group",
              entityId: _area.id,
              oldVal: {
                x: _area.posX - deltaX,
                y: _area.posY - deltaY
              },
            });
          }
        }

        for (const commentId of commentIdsInside) {
          const comment = commentsMap.value.get(commentId);
          if (comment) {
            entities.push({
              action: 'move',
              type: "comment",
              entityId: comment.id,
              oldVal: {
                x: comment.posX - deltaX,
                y: comment.posY - deltaY
              },
            });
          }
        }

        bufferStore.addUndoBufferAction({
          entities
        });
      }
    }

    // ==================== HELPERS (Cross-domain) ====================

    // Helper to create non-mtm relation
    function createSimpleRelation(
      firstTableId: string,
      secondTableId: string,
      type: RelationshipType
    ): BufferEntity[] {
      const firstTable = tablesMap.value.get(firstTableId);
      const secondTable = tablesMap.value.get(secondTableId);

      if (!firstTable || !secondTable) {
        notificationStore.show(i18n.global.t('notifications.tableNotFound', { firstTableId, secondTableId }), 'error');
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
        notificationStore.show(i18n.global.t('notifications.noPrimaryKey', { tableName: secondTable.name }), 'error');

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

    function deleteTable(table: Table) {
      if (!tablesMap.value.has(table.id)) {
        return [];
      }

      const bufferEntities: BufferEntity[] = [];

      const existingRelations = relations.value.filter(it =>
        it.firstTableId == table.id || it.secondTableId == table.id);

      existingRelations.forEach( it =>
        bufferEntities.push(...deleteRelationship(it, false)));

      // Handle linked comments based on setting
      const linkedComments = comments.value.filter(c => {
        if (!c.linkedTo) return false;

        // Table-linked comments
        if (c.linkedTo.type === 'table' && c.linkedTo.entityId === table.id) {
          return true;
        }

        // Column-linked comments
        if (c.linkedTo.type === 'column') {
          const [tableId] = c.linkedTo.entityId.split('.');
          return tableId === table.id;
        }

        return false;
      });

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

      tablesMap.value.delete(table.id);

      return bufferEntities;
    }

    // ==================== MISC OPERATIONS ====================

    const createNewProject = () => {
      tablesMap.value.clear();
      newTableIndex.value = 1;

      relationsMap.value.clear();
      groupsMap.value.clear();
      commentsMap.value.clear();

      bufferStore.clearState();

      useExportStore().resetProjectInfo();

      notificationStore.show(i18n.global.t('notifications.projectCleared'), 'success');
    };

    const setMovedComment = (comment: Comment | undefined = undefined) => {
      movedComment.value = comment;
    };

    const setLinkingComment = (comment: Comment | undefined = undefined) => {
      linkingComment.value = comment;
    };

    // Import helpers for setting all data at once (used by export store)
    function setAllTables(newTables: Table[]) {
      tablesMap.value.clear();
      newTables.forEach(table => tablesMap.value.set(table.id, table));
    }

    function setAllRelations(newRelations: DatabaseRelationship[]) {
      relationsMap.value.clear();
      newRelations.forEach(rel => relationsMap.value.set(rel.id, rel));
    }

    function setAllGroups(newGroups: Group[]) {
      groupsMap.value.clear();
      newGroups.forEach(group => groupsMap.value.set(group.id, group));
    }

    function setAllComments(newComments: Comment[]) {
      commentsMap.value.clear();
      newComments.forEach(comment => commentsMap.value.set(comment.id, comment));
    }

    // ==================== WATCHERS ====================

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
          }))),
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

    // Monitor when PK flag is removed from a column and delete corresponding relations
    watch(
      () => tables.value.flatMap(table =>
        table.cols.map(col => ({
          tableId: table.id,
          colId: col.id,
          isPrimaryKey: col.primaryKey
        }))),
      (newStates, oldStates) => {
        if (!oldStates) return; // Skip initial run

        // Check for columns that lost their PK flag
        newStates.forEach(newState => {
          const oldState = oldStates.find(
            s => s.tableId === newState.tableId && s.colId === newState.colId
          );

          // If a column lost its PK flag, delete all relations that reference it as PK
          if (oldState && oldState.isPrimaryKey && !newState.isPrimaryKey) {
            const affectedRelations = relations.value.filter(
              r => r.secondTableColId === newState.colId
            );

            if (affectedRelations.length > 0) {
              const bufferEntries: BufferEntity[] = [];

              affectedRelations.forEach(relation => {
                bufferEntries.push(...deleteRelationship(
                  relation,
                  currentSettings.value.deleteForeignKeyColumnOnRelationDelete
                ));
              });

              // Log all relation deletions as a single undo action
              if (bufferEntries.length > 0) {
                bufferStore.addUndoBufferAction({
                  entities: bufferEntries
                });
              }
            }
          }
        });
      },
      { deep: true }
    );


    // ==================== RETURN API ====================

    return {
    // State
      tables,
      relations,
      groups,
      comments,
      selectedTable,
      movedComment,
      linkingComment,
      resizedTable,
      focusedTable,
      tempGroup,
      resizedGroup,
      movedGroup,
      newTableIndex,
      duplicateTableNames,
      isManualCreation,

      // Table operations (from module + cross-domain)
      ...tableOps,
      deleteSelectedTable,
      bufferDeleteTable,

      // Column operations (from module + cross-domain)
      ...columnOps,
      bufferLogColChange,
      deleteTableCol,

      // Relation operations (from module + cross-domain)
      ...relationOps,
      createRelationship,

      // Group operations (from module + cross-domain)
      ...groupOps,
      moveGroup,
      bufferLogGroupMove,

      // Comment operations (from module)
      ...commentOps,
      setMovedComment,
      setLinkingComment,

      // Column focus tracking
      focusedCol,
      setFocusedCol,

      // Canvas operations
      snapToGrid,
      createNewProject,

      // Import helpers
      setAllTables,
      setAllRelations,
      setAllGroups,
      setAllComments,

      // Expose maps for direct access when needed
      tablesMap,
      relationsMap,
      groupsMap,
      commentsMap,
    };
  },
  {
    persist: {
      key: `__ermd_design`,
      pick: [
        'tablesMap', 'newTableIndex', 'relationsMap', 'groupsMap', 'commentsMap'
      ],
      serializer: {
        serialize: (state) => {
        // Convert Maps to arrays for storage
          const toSave = {
            tables: [...(state.tablesMap as Map<string, Table>).values()],
            relations: [...(state.relationsMap as Map<string, DatabaseRelationship>).values()],
            groups: [...(state.groupsMap as Map<string, Group>).values()],
            comments: [...(state.commentsMap as Map<string, Comment>).values()],
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
            groupsMap: new Map(parsed.groups?.map((g: Group) => [g.id, g]) ?? []),
            commentsMap: new Map(parsed.comments?.map((c: Comment) => [c.id, c]) ?? []),
            newTableIndex: parsed.newTableIndex ?? 0
          };
        }
      }
    }
  }
);
