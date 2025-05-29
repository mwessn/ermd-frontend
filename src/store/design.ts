import { defineStore } from "pinia";
import { newTable, type Table } from "@/types/table.ts";
import { ref } from "vue";

export const useDesignStore = defineStore('design', () => {
    const tables = ref<Table[]>([]);
    const newTableIndex = ref<number>(1);

    const selectedTable = ref<Table | undefined>(undefined);

    const addTable = (posX: number, posY: number) => {
        const table = { ...newTable };
        table.name += newTableIndex.value
        table.posX = posX;
        table.posY = posY;

        tables.value.push(table);

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
            const index = tables.value.indexOf(selectedTable.value);
            if (index != -1) {
                // sanity check
                tables.value.splice(index, 1);
                selectedTable.value = undefined;
            }
        }
    }

    const createNewProject = () => {
        tables.value = [];
        newTableIndex.value = 1;
    }

    return {
        tables,
        selectedTable,

        addTable,

        selectTable,
        moveSelectedTable,
        deleteSelectedTable,

        createNewProject,
    }
})