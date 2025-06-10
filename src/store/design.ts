import { defineStore } from "pinia";
import { generateNewTable, type Table, type TableCol } from "@/types/table.ts";
import { computed, ref } from "vue";
import { appConfig } from "@/app.config.ts";
import { useActionBuffer } from "@/store/actionBuffer.ts";
import { type CursorPos } from "@/components/designer/scripts/useDesignCanvas.ts";
import { cloneDeep } from "lodash";
import type { BufferEntity } from "@/types/actionsBuffer.ts";

export const useDesignStore = defineStore('design', () => {
    const bufferStore = useActionBuffer();

    const tables = ref<Table[]>([]);
    const newTableIndex = ref<number>(1);

    const selectedTable = ref<Table | undefined>(undefined);

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

    const addTable = (posX: number, posY: number) => {
        const table = generateNewTable(newTableIndex.value, posX, posY);

        tables.value.push(table);

        bufferStore.addUndoBufferAction({
            action: 'create',
            entities: [{
                type: 'table',
                entityId: table.id,
                oldVal: undefined,
            }]
        })

        newTableIndex.value++;
        isManualCreation.value = true;
    }

    const selectTable = (val: Table | undefined = undefined) => {
        selectedTable.value = val;
    }

    const moveSelectedTable = (deltaX: number, deltaY: number) => {
        if (selectedTable.value) {
            selectedTable.value.posX += deltaX;
            selectedTable.value.posY += deltaY;
        }
    }

    const deleteSelectedTable = () => {
        if (selectedTable.value) {
            // 'Delete' buffer entry should only be added in this method
            bufferStore.addUndoBufferAction({
                action: 'delete',
                entities: [{
                    type: "table",
                    entityId: selectedTable.value.id,
                    oldVal: cloneDeep(selectedTable.value),
                }]
            });

            deleteTable(selectedTable.value);

            selectedTable.value = undefined;
        }
    }

    // Columns operation

    const addTableCol = (col: TableCol) => {
        if (selectedTable.value) {
            selectedTable.value.cols.push(cloneDeep(col));

            bufferStore.addUndoBufferAction({
                action: 'create',
                entities: [{
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
                bufferStore.addUndoBufferAction({
                    action: 'delete',
                    entities: [{
                        type: "tableCol",
                        entityId: `${selectedTable.value.id}.${col.id}.${index}`,
                        oldVal: cloneDeep(col),
                    }]
                });

                selectedTable.value.cols.splice(index, 1);
            }
        }
    }

    // Misc

    const createNewProject = () => {
        tables.value = [];
        newTableIndex.value = 1;

        bufferStore.clearState();
    }

    // Buffer actions

    function bufferDeleteTable(bufferEntry: BufferEntity) {
        const table = tables.value.find(it => it.id == bufferEntry.entityId);
        if (table) {
            // Store copy to buffer and delete the table
            bufferEntry.oldVal = cloneDeep(table);
            deleteTable(table);
        }
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

    function bufferRestoreTable(bufferEntry: BufferEntity) {
        tables.value.push(cloneDeep(bufferEntry.oldVal as Table));
        bufferEntry.oldVal = undefined;
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
                const buff = cloneDeep(table.cols[colIndex]);
                table.cols[colIndex] = (bufferEntry.oldVal as TableCol);
                bufferEntry.oldVal = buff;
            }
        }
    }

    function bufferLogTableMove(pos: CursorPos) {
        if (selectedTable.value) {
            bufferStore.addUndoBufferAction({
                action: 'move',
                entities: [{
                    type: "table",
                    entityId: selectedTable.value.id,
                    oldVal: pos,
                }]
            });
        }
    }

    function bufferLogColChange(col: TableCol, oldVal: TableCol) {
        if (selectedTable.value) {
            bufferStore.addUndoBufferAction({
                action: 'change',
                entities: [{
                    type: "tableCol",
                    entityId: `${selectedTable.value.id}.${col.id}`,
                    oldVal: oldVal,
                }]
            });
        }
    }

    // Helpers

    function deleteTable(table: Table) {
        const index = tables.value.indexOf(table);
        // Sanity check
        if (index != -1) {
            tables.value.splice(index, 1);
        }
    }

    return {
        tables,
        selectedTable,
        newTableIndex, // Must be returned to preserve state

        duplicateTableNames,
        isManualCreation,

        addTable,
        selectTable,
        moveSelectedTable,
        deleteSelectedTable,

        addTableCol,
        deleteTableCol,

        createNewProject,

        // Buffer actions
        bufferDeleteTable,
        bufferSetTablePos,
        bufferRestoreTable,

        bufferDeleteCol,
        bufferRestoreCol,
        bufferRevertColumnVal,

        bufferLogTableMove,
        bufferLogColChange,
    }
}, {
    persist: {
        // Disregard states from previous versions
        // In case there were breaking changes.
        // Import from JSON should be consistent between versions.
        key: `__ermd_${ appConfig.appVersion }__design`,
        pick: [
            'tables', 'newTableIndex'
        ],
    }
});