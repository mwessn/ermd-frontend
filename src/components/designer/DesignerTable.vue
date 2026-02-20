<template>
    <div
      ref="tableRef"
      class="min-w-40 max-w-160 absolute group/table focus:outline-0"
      tabindex="-1"

      :class="focusedTable?.id == table.id ? 'z-20' : 'z-10'"

      :style="{ top: table.posY + 'px', left: table.posX + 'px', width: table.widthPx + 'px' }"

      @click="focusedTable = table"

      @focus="selectTable(table)"
      @focusout="onFocusOut"
    >
      <div class="z-20 bg-accentGray rounded-b-lg">
        <div
          :id="`table-header-${table.id}`"
          class="w-full border-b border-b-accentDarkGray flex items-center justify-between bg-monolithicCyanTsunami relative"
          @mousedown.left="onHeaderMouseDown"
        >
          <DoubleClickFocusInput
            :id="`name-${table.id}`"
            ref="nameInputRef"
            v-model="table.name"
            type="text"
            class="w-full p-2 bg-monolithicCyanTsunami"
            :class="[highlightNameClass]"

            :title="table.name"

            @mousedown.left="focusTable"
            @enter-key="focusNextInput(0)"
            @value-change="onTableNameChange"
          />
          <!--    Table resize handle -->
          <div
            class="radial-accentGray h-6 w-8 cursor-col-resize"
            @mousedown.left="setResizedTable(table)"
            @mouseup.left="setResizedTable()"
          />

          <!-- Left/right anchors for comment links -->
          <div class="absolute inset-0 flex items-center justify-between pointer-events-none">
            <div :id="`anchor-table-${table.id}-l`" class="w-0 h-0" />
            <div :id="`anchor-table-${table.id}-r`" class="w-0 h-0" />
          </div>
        </div>
        <div class="w-full min-h-4">
          <TableColRow
            v-for="(col, index) in table.cols"
            :key="col.id"
            ref="tableColumns"
            v-model:col="table.cols[index]"
            :table-id="table.id"
            :is-col-name-duplicate="duplicateColNames.has(col.name.toLowerCase())"
            @focus-next="focusNextInput(index + 1)"
            @mouse-down="selectTable(table)"

            @keydown.delete.stop
            @keyup.delete.stop
            @delete-col="onDeleteCol(col)"
          />

          <TableColRow
            ref="newColRef"
            v-model:col="newTableCol"
            :table-id="table.id"
            non-focusable-row
            @focus-next="storeNewCol"
            @focus-out="storeNewCol(false)"
            @mouse-down="focusTable()"
          />
        </div>
      </div>

      <!--    Pseudo border   -->
      <div
        class="absolute w-full p-1 h-14/15 z-[-1] top-4 right-0 rounded-b-xl
      bg-transparent group-hover/table:bg-lycheeIce group-focus/table:bg-monolithicCyanTsunami"
      />
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef } from "vue";
import { generateNewTableCol, type Table, type TableCol } from "@/types/table.ts";
import { useDesignStore } from "@/store/design.ts";
import { useActionsStore } from "@/store/action.ts";
import DoubleClickFocusInput from "@/components/core/DoubleClickFocusInput.vue";
import { notBlankOrEmpty, resetFocus, sleep } from "@/utils/utils.ts";
import TableColRow from "@/components/designer/table/TableColRow.vue";
import { cloneDeep } from "lodash";
import { SQL_IDENTIFIER_REGEX } from "@/types/misc.ts";
import { useSettingsStore } from "@/store/settings.ts";
import { storeToRefs } from "pinia";
import { defaultPrimaryTypes } from "@/types/TableColumnTypes/tableField.ts";
import { FOCUS_DELAY_MS, COMMENT_LINK_OFFSET } from "@/types/constants.ts";

const designStore = useDesignStore();
const {
  selectTable,
  setResizedTable,
  addTableCol,
  deleteTableCol,
  bufferLogTableChange,
  addComment,
  linkCommentTo,
} = designStore;

const actionStore = useActionsStore();

const { focusedTable, isManualCreation, linkingComment } = storeToRefs(designStore);

const props = defineProps<{
  table: Table
  isNameDuplicate: boolean
}>();

const table = computed(() => props.table);

const { currentSettings } = storeToRefs(useSettingsStore());

const highlightNameClass = computed(() => {
  if (props.isNameDuplicate) { return '!bg-yellow-400'; }
  if (
    !SQL_IDENTIFIER_REGEX.test(table.value.name)
  ) { return '!bg-red-400'; }

  return '';
});

const tableRef = useTemplateRef('tableRef');

const focusTable = () => {
  tableRef.value?.focus();
};

const onHeaderMouseDown = (evt: MouseEvent) => {
  if (actionStore.currentAction === 'comment') {
    const headerEl = document.getElementById(`table-header-${table.value.id}`);
    const rect = headerEl?.getBoundingClientRect();

    if (rect) {
      const scale = rect.width / table.value.widthPx;
      const isOnLeft = evt.clientX < (rect.left + rect.right) / 2;
      const canvasY = table.value.posY + (evt.clientY - rect.top) / scale;
      const canvasX = isOnLeft
        ? table.value.posX - COMMENT_LINK_OFFSET
        : table.value.posX + table.value.widthPx + COMMENT_LINK_OFFSET;

      addComment(canvasX, canvasY, { type: 'table', entityId: table.value.id, offsetX: 0, offsetY: 0 });
    }

    resetFocus();
    actionStore.setAction(undefined);
    evt.stopPropagation();
    return;
  }

  if (linkingComment.value) {
    linkCommentTo('table', table.value.id);
    resetFocus();
    actionStore.setAction(undefined);
    evt.stopPropagation();
    return;
  }
};

const onFocusOut = () => {
  selectTable();
};

const newTableCol = ref<TableCol>(generateNewTableCol(
  defaultPrimaryTypes[currentSettings.value.databaseEngine]
));

const nameInputRef = useTemplateRef('nameInputRef');

const columnsRef = useTemplateRef('tableColumns');

const newColRef = useTemplateRef('newColRef');

const focusNextInput = (index: number) => {
  if (columnsRef.value && index < columnsRef.value.length) {
    columnsRef.value[index]?.focusColName();
  } else {
    newColRef.value?.focusColName();
  }
};

const isSavingNewCol = ref<boolean>(false);

const storeNewCol = async (refocus: boolean = true) => {
  // Saving value by pressing enter also un-focuses the input,
  // which causes this method to trigger twice.
  // To prevent it, we do an action state check
  if (!isSavingNewCol.value) {
    isSavingNewCol.value = true;
    // If name not blank, add a new column
    if (notBlankOrEmpty(newTableCol.value.name)) {
      // Force select table to be able to save
      selectTable(table.value);
      const res = addTableCol(newTableCol.value);
      if (res) {
        const savedColIndex = table.value.cols.length - 1;
        newTableCol.value = generateNewTableCol(
          defaultPrimaryTypes[currentSettings.value.databaseEngine]
        );
        if (refocus) {
          // Focus the type selector of the just-saved column
          await nextTick();
          columnsRef.value?.[savedColIndex]?.focusColType();
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
};

const onDeleteCol = async (col: TableCol) => {
  const index = table.value.cols.indexOf(col);
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
};

const onTableNameChange = (oldVal: string | number) => {
  const oldTable = cloneDeep(table.value);
  oldTable.name = String(oldVal);

  selectTable(table.value);
  bufferLogTableChange(oldTable);
};

const duplicateColNames = computed(() => {
  const nameCount = table.value.cols.reduce((map, col) => {
    const name = col.name.trim().toLowerCase();
    return map.set(name, (map.get(name) || 0) + 1);
  }, new Map<string, number>());

  return new Set(
    [...nameCount].flatMap(([name, count]) => count > 1 ? [name] : [])
  );
});

onMounted(async () => {
  // When a new table is created manually, focus table name input and select all content
  if (isManualCreation.value) {
    // Sleep for a short time after mount, otherwise won't focus
    // nextTick() is not enough
    await sleep(FOCUS_DELAY_MS);
    nameInputRef.value?.focusSelectAll();
  }
});
</script>
