<template>
  <div
      class="w-48 absolute z-10 group/table focus:z-20 focus:outline-0"
      tabindex="-1"
      ref="tableRef"
      :style="{ top: table.posY + 'px', left: table.posX + 'px' }"
      @focus="selectTable(table)"
      @focusout="selectTable()"
  >
<!--    Table handle -->
<!--    <div class="w-full h-4 bg-accentDarkGray radial-accentGray z-20" />-->
    <div class="z-20 bg-accentGray rounded-b-lg">
      <div class="w-full border-b border-b-accentDarkGray">
        <DoubleClickFocusInput
            v-model="table.name"
            type="text"
            class="w-full p-2 bg-monolithicCyanTsunami"
            :class="{ '!bg-red-400': isNameDuplicate }"
            ref="nameInputRef"
            @mousedown.left="focusTable"
            @enter-key="focusNextInput(0)"
        />
      </div>
      <div class="w-full min-h-4">
        <TableColRow
          v-for="(col, index) in table.cols"
          :col="col"
          :key="col.id"
          :is-col-name-duplicate="duplicateColNames.has(col.name.toLowerCase())"
          ref="tableColumns"
          @focus-next="focusNextInput(index + 1)"
          @mouse-down="selectTable(table)"

          @keydown.delete.stop
          @keyup.delete.stop
          @delete-col="onDeleteCol(col)"
        />

        <TableColRow
            :col="newTableCol"
            ref="newColRef"
            @focus-next="storeNewCol"
            @mouse-down="focusTable()"
        />

      </div>
    </div>

    <!--    Pseudo border   -->
    <div class="absolute w-[104%] h-[calc(100%+3px)] z-[-1] top-0 -right-[2%] rounded-b-xl
     bg-transparent group-hover/table:bg-lycheeIce group-focus/table:bg-monolithicCyanTsunami"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, type PropType, ref, useTemplateRef } from "vue";
import { generateNewTableCol, type Table, type TableCol } from "@/types/table.ts";
import { useDesignStore } from "@/store/design.ts";
import DoubleClickFocusInput from "@/components/core/DoubleClickFocusInput.vue";
import { notBlankOrEmpty, resetFocus, sleep } from "@/utils/utils.ts";
import TableColRow from "@/components/designer/table/TableColRow.vue";

const { selectTable, isManualCreation, addTableCol, deleteTableCol } = useDesignStore();

const props = defineProps({
  table: {
    type: Object as PropType<Table>,
    required: true
  },
  isNameDuplicate: {
    type: Boolean,
    required: true
  }
});

const tableRef = useTemplateRef('tableRef');

const focusTable = () => {
  tableRef.value?.focus();
}

const newTableCol = ref<TableCol>(generateNewTableCol());

const nameInputRef = useTemplateRef('nameInputRef');

const columnsRef = useTemplateRef('tableColumns');

const newColRef = useTemplateRef('newColRef');

const focusNextInput = (index: number) => {
  if (columnsRef.value && index < columnsRef.value.length) {
    columnsRef.value[index]?.focusColName();
  } else {
    newColRef.value?.focusColName();
  }
}

const storeNewCol = () => {
  // If name not blank, add a new column
  if (notBlankOrEmpty(newTableCol.value.name)) {
    // Focus table root element to set selectedTable
    tableRef.value?.focus();
    const res = addTableCol(newTableCol.value);
    if (res) {
      newTableCol.value = generateNewTableCol();
      newColRef.value?.focusColName();
    }
  } else {
    // Else finish editing the table;
    resetFocus();
  }
}

const onDeleteCol = (col: TableCol) => {
  tableRef.value?.focus();
  deleteTableCol(col);
}

const duplicateColNames = computed(() => {
  const nameCount = props.table.cols.reduce((map, col) => {
    const name = col.name.trim().toLowerCase();
    return map.set(name, (map.get(name) || 0) + 1);
  }, new Map<string, number>());

  return new Set(
      [...nameCount].flatMap(([name, count]) => count > 1 ? [name] : [])
  );
});

onMounted(async () => {
  // When a new table is created manually, focus table name input and select all content
  if (isManualCreation) {
    await sleep(50); // Sleep for a short time after mount, otherwise won't focus
    nameInputRef.value?.focusSelectAll();
  }
});
</script>