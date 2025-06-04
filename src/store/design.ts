import { defineStore } from "pinia";
import { newTable, type Table } from "@/types/table.ts";
import { ref } from "vue";
import { appConfig } from "@/app.config.ts";
import { useActionBuffer } from "@/store/actionBuffer.ts";
import type { CursorPos } from "@/components/designer/scripts/useDesignCanvas.ts";
import { cloneDeep } from "lodash";
import type { BufferEntity } from "@/types/actionsBuffer.ts";

export const useDesignStore = defineStore('design', () => {
    const bufferStore = useActionBuffer();

    const tables = ref<Table[]>([]);
    const newTableIndex = ref<number>(1);

    const selectedTable = ref<Table | undefined>(undefined);

    const addTable = (posX: number, posY: number) => {
        const table = cloneDeep(newTable);
        table.name += newTableIndex.value
        table.posX = posX;
        table.posY = posY;

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

        addTable,

        selectTable,
        moveSelectedTable,
        deleteSelectedTable,

        createNewProject,

        // Buffer actions
        bufferDeleteTable,
        bufferSetTablePos,
        bufferRestoreTable,
        bufferLogTableMove,
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