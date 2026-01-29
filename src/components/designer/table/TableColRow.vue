<template>
    <div
      ref="rowRef"
      class="flex items-center w-full not-last:border-b relative group/cols"

      :tabindex="props.nonFocusableRow ? undefined : -1"
      :aria-label="props.nonFocusableRow ? 'New column input' : `Column ${col.name || 'unnamed'}, press Delete to remove`"
      role="row"

      @focus="showColumnProps = true"
      @focusout="onFocusOut"

      @mousedown.left="onMouseDown"
      @keyup.enter.exact="onRowEnterKey"
      @keyup.delete.exact.stop="emit('deleteCol');"

      @keyup.alt.prevent="onRowKeyUp"
    >
      <div
        v-if="showColType"
        class="h-1 w-1 rounded-full p-1 border ml-1.5 mr-0.5"
        :class="rowIndicatorStyles"
      />
      <DoubleClickFocusInput
        ref="colNameRef"
        v-model="col.name"

        :name="`colName-${col.id}`"

        class="w-full group-last/cols:rounded-b-xl"
        :class="[{ 'border-r' : !props.nonFocusableRow }, highlightColumnClass]"

        :title="col.name"

        @focus="showColumnProps = true"

        @enter-key="focusColType"
        @delete-key="emit('deleteCol');"
        @keyup.delete.stop

        @value-change="onColNameChange"
      />
      <div v-if="showColType" class="min-w-1/2 flex items-center pr-2">
        <ColTypeSelect
          v-if="rowRef"
          ref="colTypeRef"
          v-model:col="col"

          :root-div="rowRef"
          aria-label="Column type selector"

          @value-change="onColTypeChange"

          @on-enter-key="onFocusNext"

          @keydown.delete.stop
          @keyup.delete.stop
        />
      </div>

      <ColumnProperties
        v-if="showColumnProps && showColType"
        v-model:col="col"

        @change="onColTypeChange"

        @keydown.delete.stop
        @keyup.delete.stop
      />

      <div
        v-if="col.foreignKey || col.primaryKey"
        class="absolute full flex items-center justify-between z-0 pointer-events-none"
      >
        <div :id="`anchor-${col.id}-l`" />
        <div :id="`anchor-${col.id}-r`" />
      </div>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from "vue";
import { colCanAutoIncrement, colCanBeNullable, colCanBePrimary, type TableCol } from "@/types/table.ts";
import DoubleClickFocusInput from "@/components/core/DoubleClickFocusInput.vue";
import { useDesignStore } from "@/store/design.ts";
import { cloneDeep } from "lodash";
import { SQL_IDENTIFIER_REGEX } from "@/types/misc.ts";
import ColTypeSelect from "@/components/designer/table/ColTypeSelect.vue";
import { resetFocus } from "@/utils/utils.ts";
import { type ColumnType, getDefaultModifierParams } from "@/types/TableColumnTypes/tableField.ts";
import ColumnProperties from "@/components/designer/table/ColumnProperties/ColumnProperties.vue";

const { bufferLogColChange } = useDesignStore();

const col = defineModel<TableCol>('col', { required: true });

const props = withDefaults(defineProps<{
  isColNameDuplicate?: boolean
  nonFocusableRow?: boolean
}>(), {
  isColNameDuplicate: false,
  nonFocusableRow: false
});

const showColType = ref<boolean>(!props.nonFocusableRow);

watch(() => col.value.id, () => {
  // On storing a column prevent type selector from displaying on the new row
  showColType.value = !props.nonFocusableRow;
});

watch(() => col.value.type, (newType: ColumnType, oldType) => {
  // Prevent resetting to default on action buffer undo/redo
  if (newType.displayName != oldType.displayName) {
    col.value.modifierValues = getDefaultModifierParams(newType);
  }
  if (newType.primitive == 'serial') {
    col.value.primaryKey = true; // rest of the flags are handled in the next watcher
    return;
  }
  // Check PK flag
  if (col.value.primaryKey) {
    col.value.primaryKey = colCanBePrimary(col.value);
  }
  // Check AI flag
  if (col.value.autoIncrement) {
    col.value.autoIncrement = colCanAutoIncrement(col.value);
  }
});

watch(() => col.value.primaryKey, (newVal) => {
  // Set default PK flags
  if (newVal) {
    col.value.notNull = true;
    col.value.unique = true;
    col.value.autoIncrement = colCanAutoIncrement(col.value);
  }
});

const emit = defineEmits<{
  focusNext: []
  mouseDown: []
  deleteCol: []
  focusOut: []
}>();

const rowRef = useTemplateRef<HTMLDivElement>('rowRef');

const colTypeRef = useTemplateRef('colTypeRef');

const showColumnProps = ref<boolean>(false);

const preloadBackgroundColors: Record<string, string> = {
  primary: 'bg-amber-300',
  foreign: 'bg-orange-500',
  unique: 'bg-monolithicCyanTsunami',
  default: 'bg-lycheeIce'
};

const preloadBorderColors: Record<string, string> = {
  primary: 'border-amber-300',
  foreign: 'border-orange-500',
  unique: 'border-monolithicCyanTsunami',
  default: 'border-lycheeIce'
};

const rowIndicatorStyles = computed(() => {
  // priority: PK > FK > UNIQUE > default
  const base = col.value.primaryKey
    ? "primary"
    : col.value.foreignKey
      ? "foreign"
      : col.value.unique
        ? "unique"
        : "default";

  const border = preloadBorderColors[base];
  const bg = col.value.notNull ? preloadBackgroundColors[base] : "";

  return [border, bg];
});

const onMouseDown = () => {
  emit('mouseDown');
  rowRef.value?.focus();
};

const colNameRef = useTemplateRef('colNameRef');

const focusColName = () => {
  colNameRef.value?.focusSelectAll();
};

const focusRow = () => {
  rowRef.value?.focus();
};

const focusColType = async () => {
  if (col.value.name) {
    // For new column row, save first then focus type
    if (props.nonFocusableRow) {
      emit('focusNext');
      return;
    }

    showColumnProps.value = true;
    await nextTick();
    colTypeRef.value?.focus();
  } else {
    resetFocus();
  }
};

const onRowEnterKey = (evt: InputEvent) => {
  if (!(evt.target instanceof HTMLInputElement)) {
    focusColName();
  }
};

const onFocusNext = () => {
  emit('focusNext');
};

const onColNameChange = (oldVal: string | number) => {
  if (!props.nonFocusableRow) {
    const oldColVal = cloneDeep(col.value);
    oldColVal.name = String(oldVal);

    // Focus table to be able to add log entry
    emit('mouseDown');
    bufferLogColChange(col.value, oldColVal);
  }
};

const onColTypeChange = (oldVal: TableCol) => {
  if (!props.nonFocusableRow) {
    // Focus table to be able to add log entry
    emit('mouseDown');
    bufferLogColChange(col.value, oldVal);

    // Return the focus to the row to properly handle focusout later
    rowRef.value?.focus();
  }
};

function onFocusOut(event: FocusEvent) {
  if (!event.relatedTarget || !rowRef.value?.contains(event.relatedTarget as Node)) {
    showColumnProps.value = false;
  }
}

const highlightColumnClass = computed(() => {
  if (props.isColNameDuplicate) { return '!bg-yellow-400'; }
  if (
    !SQL_IDENTIFIER_REGEX.test(col.value.name) &&
      (!props.nonFocusableRow || col.value.name.length > 0)
  ) { return '!bg-red-400'; }

  return '';
});

const onRowKeyUp = (e: KeyboardEvent) => {
  if (!e.altKey || col.value.type.primitive == 'serial') { return; } // serial column flags are locked

  const oldVal = cloneDeep(col.value);
  let changed = false;

  switch (e.key.toLowerCase()) {
    case 'p':
      if (colCanBePrimary(col.value)) {
        col.value.primaryKey = !col.value.primaryKey;
        changed = true;
      }
      break;
    case 'n':
      if (colCanBeNullable(col.value)) {
        col.value.notNull = !col.value.notNull;
        changed = true;
      }
      break;
    case 'u':
      if (!col.value.primaryKey) {
        col.value.unique = !col.value.unique;
        changed = true;
      }
      break;
    case 'a':
      if (!col.value.primaryKey && colCanAutoIncrement(col.value)) {
        col.value.autoIncrement = !col.value.autoIncrement;
        changed = true;
      }
      break;
  }

  if (changed) {
    onColTypeChange(oldVal);
  }
};

defineExpose({ focusColName, focusColType, focusRow });
</script>
