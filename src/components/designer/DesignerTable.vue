<template>
  <div
      class="w-48 absolute z-10 group/table focus:z-20 focus:outline-0"
      tabindex="-1"
      ref="tableRef"
      :style="{ top: table.posY + 'px', left: table.posX + 'px' }"
      @focus="selectTable(table)"
      @focusout="onFocusOut"
  >
<!--    Table handle -->
<!--    <div class="w-full h-4 bg-accentDarkGray radial-accentGray z-20" />-->
    <div class="z-20 bg-accentGray rounded-b-lg">
      <div class="w-full border-b border-b-accentDarkGray">
        <DoubleClickFocusInput
            v-model="table.name"
            :id="`name-${table.id}`"
            type="text"
            class="w-full p-2 bg-monolithicCyanTsunami"
            :class="[highlightNameClass]"
            ref="nameInputRef"

            @mousedown.left="focusTable"
            @enter-key="focusNextInput(0)"
            @value-change="onTableNameChange"
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
            @focus-out="storeNewCol(false)"
            @mouse-down="focusTable()"
            non-focusable-row
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
import { computed, nextTick, onMounted, type PropType, ref, useTemplateRef } from "vue";
import { generateNewTableCol, type Table, type TableCol } from "@/types/table.ts";
import { useDesignStore } from "@/store/design.ts";
import DoubleClickFocusInput from "@/components/core/DoubleClickFocusInput.vue";
import { notBlankOrEmpty, resetFocus, sleep } from "@/utils/utils.ts";
import TableColRow from "@/components/designer/table/TableColRow.vue";
import { cloneDeep } from "lodash";
import { SQL_IDENTIFIER_REGEX } from "@/types/misc.ts";

const { selectTable, isManualCreation, addTableCol, deleteTableCol, bufferLogTableChange } = useDesignStore();

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

const highlightNameClass = computed(() => {
  if (props.isNameDuplicate) { return '!bg-yellow-400' }
  if (
      !SQL_IDENTIFIER_REGEX.test(props.table.name)
  ) { return '!bg-red-400' }

  return '';
})

const tableRef = useTemplateRef('tableRef');

const focusTable = () => {
  tableRef.value?.focus();
}

const onFocusOut = () => {
  selectTable();
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

const isSavingNewCol = ref<boolean>(false);

const storeNewCol = (refocus: boolean = true) => {
  // Saving value by pressing enter also un-focuses the input,
  // which causes this method to trigger twice.
  // To prevent it, we do an action state check
  if (!isSavingNewCol.value) {
    isSavingNewCol.value = true;
    // If name not blank, add a new column
    if (notBlankOrEmpty(newTableCol.value.name)) {
      // Force select table to be able to save
      selectTable(props.table);
      const res = addTableCol(newTableCol.value);
      if (res) {
        newTableCol.value = generateNewTableCol();
        if (refocus) {
          newColRef.value?.focusColName();
        }
        // Reset selection
        selectTable();
      }
    } else {
      // Else finish editing the table;
      newTableCol.value.name = "";
      resetFocus();
    }
    isSavingNewCol.value = false;
  }
}

const onDeleteCol = async (col: TableCol) => {
  const index = props.table.cols.indexOf(col);
  tableRef.value?.focus();
  deleteTableCol(col);

  // Autofocus next row
  // Wait for rows to get re-rendered
  await nextTick();
  if (index != -1 && columnsRef.value && columnsRef.value.length > 0) {
    if (index < columnsRef.value.length) {
      // Focus next row
      columnsRef.value[index]?.focusRow();
    } else {
      // Focus last row
      columnsRef.value[index - 1]?.focusRow();
    }
  }
}

const onTableNameChange = (oldVal: string) => {
  const table = cloneDeep(props.table);
  table.name = oldVal;

  selectTable(props.table);
  bufferLogTableChange(table);
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
    // Sleep for a short time after mount, otherwise won't focus
    // nextTick() is not enough
    await sleep(50);
    nameInputRef.value?.focusSelectAll();
  }
});
</script>