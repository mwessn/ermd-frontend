import { defineStore, storeToRefs } from "pinia";
import { generateNewForeignKey, generateNewTable, type Table, type TableCol } from "@/types/table.ts";
import { computed, ref } from "vue";
import { useActionBuffer } from "@/store/actionBuffer.ts";
import { type CursorPos } from "@/components/designer/scripts/useDesignCanvas.ts";
import { cloneDeep } from "lodash";
import type { ActionBufferEntry, BufferEntity } from "@/types/actionsBuffer.ts";
import type { DatabaseRelationship, RelationshipType } from "@/types/relationships.ts";
import { useActionsStore } from "@/store/action.ts";
import { useSettingsStore } from "@/store/settings.ts";
import { createNewRelationship } from "@/types/relationships.ts";
import { clamp, unpluralize } from "@/utils/utils.ts";
import type { ColumnType } from "@/types/TableColumnTypes/tableField.ts";

export const useDesignStore = defineStore('design', () => {
    const bufferStore = useActionBuffer();
    const actionStore = useActionsStore();

    const {
        currentSettings,
        defaultPrimaryKey,
        defaultTableName,
    } = storeToRefs(useSettingsStore());

    const tables = ref<Table[]>([]);
    const newTableIndex = ref<number>(1);

    const relations = ref<DatabaseRelationship[]>([]);

    const selectedTable = ref<Table | undefined>(undefined);
    const resizedTable = ref<Table | undefined>(undefined);

    // Determine which table should have the highest z-offset
    const focusedTable = ref<Table | undefined>(undefined);

    // Flag to track whether a table is mounted after manual creation or loaded from localStorage
    const isManualCreation = ref<boolean>(false);

    const duplicateTableNames = computed(() => {
        const nameCount = tables.value.reduce((map, table) => {
            const name = table.name.trim().toLowerCase();
            return map.set(name, (map.get(name) || 0) + 1);
        }, new Map<string, number>());

        return new Set(
            [...nameCount].flatMap(([name, count]) => count > 1 ? [name] : [])
        );
    });

    // Table operations

    const addTable = (posX: number, posY: number, generatePrimary: boolean = true, saveBuffer: boolean = true, primaryType: ColumnType = defaultPrimaryKey.value) => {
        const table = generateNewTable(
            defaultTableName.value,
            newTableIndex.value,
            posX, posY,
            primaryType,
            generatePrimary,
        );

        tables.value.push(table);

        const bufferAction: ActionBufferEntry = {
            entities: [{
                action: 'create',
                type: 'table',
                entityId: table.id,
                oldVal: undefined,
            }]
        }

        if (saveBuffer) {
            bufferStore.addUndoBufferAction(bufferAction);
        }

        newTableIndex.value++;
        isManualCreation.value = true;

        return bufferAction.entities;
    }

    const selectTable = (val: Table | undefined = undefined) => {
        selectedTable.value = val;
    }

    const setResizedTable = (val: Table | undefined = undefined) => {
        resizedTable.value = val;
    }

    const snapToGrid = (value: number, gridSize: number = 10) => {
        return Math.round(value / gridSize) * gridSize;
    };

    const moveSelectedTable = (deltaX: number, deltaY: number) => {
        if (selectedTable.value) {
            const gridSize = currentSettings.value.snapToGrid ? 5 : 1;

            selectedTable.value.posX = snapToGrid(selectedTable.value.posX + deltaX, gridSize);
            selectedTable.value.posY = snapToGrid(selectedTable.value.posY + deltaY, gridSize);
        }
    }

    const resizeSelectedTable = (deltaX: number) => {
        if (selectedTable.value) {
            selectedTable.value.widthPx = clamp(selectedTable.value.widthPx + deltaX, 120, 480);
            // selectedTable.value.posY = snapToGrid(selectedTable.value.posY + deltaY, gridSize);
        }
    }

    const deleteSelectedTable = () => {
        if (selectedTable.value) {
            const deleteTableEntity: BufferEntity = {
                action: 'delete',
                type: "table",
                entityId: selectedTable.value.id,
                oldVal: cloneDeep(selectedTable.value),
            }

            const additionalDeleteEntities = deleteTable(selectedTable.value);

            bufferStore.addUndoBufferAction({
                entities: [
                    deleteTableEntity, // Table delete must be undone first
                    ...additionalDeleteEntities
                ]
            });

            selectedTable.value = undefined;
        }
    }

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
    }

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
                    bufferEntries.push(...deleteRelationship(rel, false))
                );

                bufferStore.addUndoBufferAction({
                    entities: bufferEntries
                });

                selectedTable.value.cols.splice(index, 1);
            }
        }
    }

    // Relationships

    const relationFirstTableId = ref<string | undefined>(undefined);

    const resetRelationshipCreation = () => {
        relationFirstTableId.value = undefined;
    }

    const createRelationship = (type: RelationshipType) => {
        if (selectedTable.value) {
            if (!relationFirstTableId.value) {
                // If first table not selected, select and exit

                let hasPK = true;
                if (type == 'mtm') {
                    // Check if selected table has primaryId column
                    hasPK = selectedTable.value.cols.find(col => col.primaryKey) == undefined;
                }

                if (hasPK != undefined) {
                    relationFirstTableId.value = cloneDeep(selectedTable.value.id);
                }
                return;
            } else {
                // If fist table already selected, create a relationship between it and the current

                // Check if selected table is not the same
                if (relationFirstTableId.value == selectedTable.value.id) {
                  return;
                }

                // Get first table
                const firstTable = tables.value.find(it => it.id == relationFirstTableId.value);

                if (firstTable) {
                    if (type != "mtm") {
                        // Check if relation between tables already exists
                        const existingRel = relations.value.find(it =>
                            (it.firstTableId == firstTable.id && it.secondTableId == selectedTable.value?.id) ||
                            (it.firstTableId == selectedTable.value?.id && it.secondTableId == firstTable.id)
                        );

                        const bufferEntries: BufferEntity[] = [];

                        if (existingRel) {
                            if (existingRel.type != type && existingRel.type != 'mtm') {

                                // Recreate relationship with updated type
                                bufferEntries.push(
                                    ...deleteRelationship(existingRel, true)
                                );

                                bufferEntries.push(
                                    ...createSimpleRelation(firstTable, selectedTable.value, type)
                                );

                                bufferStore.addUndoBufferAction({
                                    entities: bufferEntries
                                });
                            }

                            return;
                        }

                        const existingMtM = mtmRelationExists(firstTable, selectedTable.value)

                        if (existingMtM) {
                            const pivot = tables.value.find(it => it.id == existingMtM.firstTableId)!;
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

                        bufferEntries.push(
                            ...createSimpleRelation(firstTable, selectedTable.value, type)
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

                            const pivotTable = tables.value.find(it => it.id == pivotTableEntry[0].entityId)!;

                            const nameJoin = currentSettings.value.namingConvention == 'snake' ?
                                '_has_' :
                                'Has';

                            pivotTable.name = `${unpluralize(firstTable!.name)}${nameJoin}${selectedTable.value?.name}`;

                            const firstBufferEntry = createSimpleRelation(pivotTable, firstTable!, 'mtm');
                            const secondBufferEntry = createSimpleRelation(pivotTable, selectedTable.value!, 'mtm');

                            return [
                                ...pivotTableEntry,
                                ...firstBufferEntry,
                                ...secondBufferEntry
                            ]
                        }

                        // Check if MtM between given tables already exist
                        if (mtmRelationExists(firstTable, selectedTable.value)) {
                            return;
                        }

                        // Check if a simple relation between tables already exists
                        const existingRel = relations.value.find(it =>
                            (it.firstTableId == firstTable.id && it.secondTableId == selectedTable.value?.id) ||
                            (it.secondTableId == firstTable.id && it.firstTableId == selectedTable.value?.id)
                        );

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
                }

                actionStore.resetAction();
            }
        }
    }

    // Misc

    const createNewProject = () => {
        tables.value = [];
        newTableIndex.value = 1;

        relations.value = [];

        bufferStore.clearState();
    }

    // Buffer actions

    function bufferDeleteTable(bufferEntry: BufferEntity) {
        const table = tables.value.find(it => it.id == bufferEntry.entityId);
        if (table) {
            // Store copy to buffer and delete the table
            bufferEntry.oldVal = cloneDeep(table);

            // Relationships to the table should not exist at this point
            deleteTable(table);
        }
    }

    function bufferRestoreTable(bufferEntry: BufferEntity) {
        tables.value.push(cloneDeep(bufferEntry.oldVal as Table));
        bufferEntry.oldVal = undefined;
    }

    function bufferSetTablePos(bufferEntry: BufferEntity) {
        const table = tables.value.find(it => it.id == bufferEntry.entityId);
        if (table) {
            const pos = cloneDeep(bufferEntry.oldVal as CursorPos);
            // Swap buffer oldVal and current value
            bufferEntry.oldVal = {
                x: table.posX,
                y: table.posY
            }

            table.posX = pos.x;
            table.posY = pos.y;
        }
    }

    function bufferSetTableWidth(bufferEntry: BufferEntity) {
        const table = tables.value.find(it => it.id == bufferEntry.entityId);
        if (table) {
            const width = cloneDeep(bufferEntry.oldVal as number);

            bufferEntry.oldVal = cloneDeep(table.widthPx);

            table.widthPx = width;
        }
    }

    function bufferSetTableVal(bufferEntry: BufferEntity) {
        const tableIndex = tables.value.findIndex(it => it.id == bufferEntry.entityId);
        if (tableIndex != -1) {
            const oldVal = cloneDeep(tables.value[tableIndex]);

            tables.value[tableIndex] = cloneDeep(bufferEntry.oldVal as Table);

            bufferEntry.oldVal = oldVal;
        }
    }

    function bufferDeleteCol(bufferEntry: BufferEntity) {
        const [tableId, colId] = bufferEntry.entityId.split('.');
        if (!tableId || !colId) return;

        const table = tables.value.find(it => it.id == tableId);
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


        const table = tables.value.find(it => it.id == tableId);
        if (table) {
            table.cols.splice(parseInt(colIndex), 0, cloneDeep(bufferEntry.oldVal) as TableCol);

            bufferEntry.oldVal = undefined;
        }
    }

    function bufferRevertColumnVal(bufferEntry: BufferEntity) {
        const [tableId, colId] = bufferEntry.entityId.split('.');
        if (!tableId || !colId) return;

        const table = tables.value.find(it => it.id == tableId);
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
        const relation = relations.value.find(it => it.id == bufferEntry.entityId);
        if (relation) {
            bufferEntry.oldVal = cloneDeep(relation);
            const index = relations.value.indexOf(relation);
            relations.value.splice(index, 1);
        }
    }

    function bufferRestoreRelation(bufferEntry: BufferEntity) {
        relations.value.push(cloneDeep(bufferEntry.oldVal as DatabaseRelationship));
        bufferEntry.oldVal = undefined;
    }

    function bufferChangeRelation(bufferEntry: BufferEntity) {
        const relationIndex = relations.value.findIndex(it => it.id == bufferEntry.entityId);
        if (relationIndex != -1) {
            const oldVal = cloneDeep(relations.value[relationIndex]);
            relations.value[relationIndex] = bufferEntry.oldVal as DatabaseRelationship;
            bufferEntry.oldVal = oldVal;
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
                    entityId: `${selectedTable.value.id}`,
                    oldVal: oldVal,
                }]
            });
        }
    }

    // Helpers

    // Helper to create non-mtm relation
    function createSimpleRelation(firstTable: Table, secondTable: Table, type: RelationshipType): BufferEntity[] {
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

        relations.value.push(rel);

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
        }] as BufferEntity[]
    }

    function deleteRelationship(relation: DatabaseRelationship, deleteColumn: boolean = false) {
        const bufferEntries: BufferEntity[] = [];
        const firstTable = tables.value.find(it => it.id == relation.firstTableId);

        if (firstTable) {
            const oldFKIndex = firstTable.cols.findIndex(it => it.id == relation.firstTableColId);

            if (oldFKIndex != -1) {
                const oldFK = firstTable.cols[oldFKIndex];

                if (deleteColumn) {
                    bufferEntries.push({
                        action: 'delete',
                        type: 'tableCol',
                        entityId: `${firstTable.id}.${oldFK.id}.${oldFKIndex}`,
                        oldVal: cloneDeep(oldFK),
                    });

                    firstTable.cols.splice(oldFKIndex, 1);
                }

                bufferEntries.push({
                    action: 'delete',
                    type: 'relation',
                    entityId: relation.id,
                    oldVal: cloneDeep(relation)
                });

                const relationId = relations.value.indexOf(relation);

                relations.value.splice(relationId, 1);

            }
        }

        return bufferEntries;
    }

    function mtmRelationExists(first: Table, second: Table): DatabaseRelationship | undefined {
        const mtmRels = relations.value.filter(it => it.type == 'mtm' && it.secondTableId == first.id);

        return mtmRels.find(relation => {
            const pivot = tables.value.find(table => table.id === relation.firstTableId);
            if (!pivot) return false;

            return relations.value.some(it =>
                it.type === 'mtm' &&
                it.firstTableId === pivot.id &&
                it.secondTableId === second.id
            );
        });
    }

    function deleteTable(table: Table) {
        const index = tables.value.indexOf(table);

        if (index != -1) {
            const bufferEntities: BufferEntity[] = [];

            const existingRelations = relations.value.filter(it =>
                it.firstTableId == table.id || it.secondTableId == table.id
            );

            existingRelations.forEach( it =>
                bufferEntities.push(...deleteRelationship(it, false))
            );

            tables.value.splice(index, 1);

            return bufferEntities;
        }

        return [];
    }

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

        resetRelationshipCreation,
        createRelationship,

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

        bufferLogTableMove,
        bufferLogTableResize,
        bufferLogColChange,
        bufferLogTableChange,
    }
}, {
    persist: {
        key: `__ermd_design`,
        pick: [
            'tables', 'newTableIndex', 'relations'
        ],
    }
});