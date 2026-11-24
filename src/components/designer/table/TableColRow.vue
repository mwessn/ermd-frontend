<template>
    <div
      :id="`col-${col.id}`"
      ref="rowRef"
      class="flex items-center w-full h-table-row not-last:border-b relative group/cols outline-none focus-within:bg-headerBlack focus-within:text-textColor"

      :tabindex="props.nonFocusableRow ? undefined : -1"
      :aria-label="props.nonFocusableRow ? 'New column input' : `Column ${col.name || 'unnamed'}, press Delete to remove`"
      role="row"

      @focusin="onRowFocus"
      @focusout="onFocusOut"

      @mousedown.left="onMouseDown"
      @keyup.enter.exact="onRowEnterKey"
      @keyup.delete.exact.stop="emit('deleteCol');"
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

        class="w-1/2 group-last/cols:rounded-b-xl"
        :class="[{ 'border-r' : !props.nonFocusableRow }, highlightColumnClass]"

        :title="col.name"

        @focus="showColumnProps = true"

        @enter-key="focusColType"
        @delete-key="emit('deleteCol');"
        @keyup.delete.stop

        @value-change="onColNameChange"
      />
      <div v-if="showColType" class="w-1/2 min-w-0 flex items-center pr-2">
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
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from "vue";
import { colCanAutoIncrement, colCanBePrimary, type TableCol } from "@/types/table.ts";
import DoubleClickFocusInput from "@/components/core/DoubleClickFocusInput.vue";
import { useDesignStore } from "@/store/design.ts";
import { useActionsStore } from "@/store/action.ts";
import { storeToRefs } from "pinia";
import { cloneDeep } from "lodash-es";
import { SQL_IDENTIFIER_REGEX } from "@/types/misc.ts";
import ColTypeSelect from "@/components/designer/table/ColTypeSelect.vue";
import { resetFocus } from "@/utils/utils.ts";
import { type ColumnType, getDefaultModifierParams } from "@/types/TableColumnTypes/tableField.ts";
import ColumnProperties from "@/components/designer/table/ColumnProperties/ColumnProperties.vue";

const designStore = useDesignStore();
const { bufferLogColChange, linkCommentTo } = designStore;
const { linkingComment } = storeToRefs(designStore);
const actionStore = useActionsStore();

const col = defineModel<TableCol>('col', { required: true });

const props = withDefaults(defineProps<{
  tableId: string
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
  colCommentClick: [evt: MouseEvent, colId: string]
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

const onMouseDown = (evt: MouseEvent) => {
  if (!props.nonFocusableRow) {
    const entityId = `${props.tableId}.${col.value.id}`;

    if (actionStore.currentAction === 'comment') {
      emit('colCommentClick', evt, col.value.id);
      resetFocus();
      actionStore.setAction(undefined);
      evt.stopPropagation();
      return;
    }

    if (linkingComment.value) {
      linkCommentTo('column', entityId);
      resetFocus();
      actionStore.setAction(undefined);
      evt.stopPropagation();
      return;
    }
  }

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

const onRowFocus = () => {
  showColumnProps.value = true;
  if (!props.nonFocusableRow) {
    designStore.setFocusedCol(col.value, props.tableId);
  }
};

function onFocusOut(event: FocusEvent) {
  if (!event.relatedTarget || !rowRef.value?.contains(event.relatedTarget as Node)) {
    showColumnProps.value = false;
    designStore.setFocusedCol(undefined);
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

defineExpose({ focusColName, focusColType, focusRow });
</script>
