import { defineStore } from "pinia";
import { newTable, type Table } from "@/types/table.ts";
import { ref } from "vue";

export const useDesignStore = defineStore('design', () => {
    const tables = ref<Table[]>([]);

    const selectedTable = ref<Table | undefined>(undefined);

    const addTable = (posX: number, posY: number) => {
        const table = { ...newTable };
        table.posX = posX;
        table.posY = posY;

        tables.value.push(table);
    }

    const selectTable = (id: string) => {
        const table = tables.value.find(it => it.id == id);
        if (table) {
            selectedTable.value = table;
        }
    }

    const createNewProject = () => {
        tables.value = [];
    }

    return {
        tables,

        addTable,
        selectTable,

        createNewProject,
    }
})