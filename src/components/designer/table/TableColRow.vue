<template>
  <div
    class="flex items-center w-full not-last:border-b relative group/cols"
    ref="rowRef"

    :tabindex="nonFocusableRow ? undefined : -1"

    @focus="showColumnProps = true"
    @focusout="onFocusOut"

    @mousedown.left="onMouseDown"
    @keyup.enter="onRowEnterKey"
    @keyup.delete.stop="emit('deleteCol');"

    @keyup.alt.prevent="onRowKeyUp"
  >
    <div
        v-if="showColType"
        class="h-1 w-1 rounded-full p-1 border ml-1.5 mr-0.5"
        :class="rowIndicatorStyles"
    />
    <DoubleClickFocusInput
        v-model="col.name"
        ref="colNameRef"

        :name="`colName-${col.id}`"

        class="w-full group-last/cols:rounded-b-xl"
        :class="[{ 'border-r' : !nonFocusableRow }, highlightColumnClass]"

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
          :col="col"
          ref="colTypeRef"

          :col-id="col.id"
          :root-div="rowRef!"

          @value-change="onColTypeChange"

          @on-enter-key="onFocusNext"

          @keydown.delete.stop
          @keyup.delete.stop
      />
    </div>

    <ColumnProperties
        v-if="showColumnProps && showColType"
        :col="col"

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
import { computed, nextTick, type PropType, ref, useTemplateRef, watch } from "vue";
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

const props = defineProps({
  col: {
    type: Object as PropType<TableCol>,
    required: true
  },
  isColNameDuplicate: {
    type: Boolean,
    default: false
  },
  nonFocusableRow: {
    type: Boolean,
    default: false
  }
});

const showColType = ref<boolean>(!props.nonFocusableRow);

watch(() => props.col.id, () => {
  // On storing a column prevent type selector from displaying on the new row
  showColType.value = !props.nonFocusableRow;
});

watch(() => props.col.type, (newType: ColumnType, oldType) => {
  // Prevent resetting to default on action buffer undo/redo
  if (newType.displayName != oldType.displayName) {
    props.col.modifierValues = getDefaultModifierParams(newType);
  }
  if (newType.primitive == 'serial') {
    props.col!.primaryKey = true; // rest of the flags are handled in the next watcher
    return;
  }
  // Check PK flag
  if (props.col.primaryKey) {
    props.col.primaryKey = colCanBePrimary(props.col);
  }
  // Check AI flag
  if (props.col.autoIncrement) {
    props.col.autoIncrement = colCanAutoIncrement(props.col);
  }
});

watch(() => props.col.primaryKey, (newVal) => {
  // Set default PK flags
  if (newVal) {
    props.col.notNull = true;
    props.col.unique = true;
    props.col.autoIncrement = colCanAutoIncrement(props.col);
  }
});

const emit = defineEmits(['focusNext', 'mouseDown', 'deleteCol', 'focusOut']);

const rowRef = useTemplateRef<HTMLDivElement>('rowRef');

const colTypeRef = useTemplateRef('colTypeRef');

const showColumnProps = ref<boolean>(false);

const preloadBackgroundColors = {
  primary: 'bg-amber-300',
  foreign: 'bg-orange-500',
  unique: 'bg-monolithicCyanTsunami',
  default: 'bg-lycheeIce'
}

const preloadBorderColors = {
  primary: 'border-amber-300',
  foreign: 'border-orange-500',
  unique: 'border-monolithicCyanTsunami',
  default: 'border-lycheeIce'
}

const rowIndicatorStyles = computed(() => {
  // priority: PK > FK > UNIQUE > default
  const base = props.col.primaryKey
      ? "primary"
      : props.col.foreignKey
          ? "foreign"
          : props.col.unique
              ? "unique"
              : "default";

  const border = preloadBorderColors[base];
  const bg = props.col.notNull ? preloadBackgroundColors[base] : "";

  return [border, bg];
});

const onMouseDown = () => {
  emit('mouseDown');
  rowRef.value?.focus();
}

const colNameRef = useTemplateRef('colNameRef');

const focusColName = () => {
  colNameRef.value?.focusSelectAll();
}

const focusRow = () => {
  rowRef.value?.focus();
}

const focusColType = async () => {
  if (props.col.name) {
    if (props.nonFocusableRow) {
      showColType.value = true;
    }

    await nextTick();
    colTypeRef.value?.focus();
  } else {
    resetFocus();
  }
}

const onRowEnterKey = (evt: InputEvent) => {
  if (!(evt.target instanceof HTMLInputElement)) {
    focusColName();
  }
}

const onFocusNext = () => {
  emit('focusNext');
}

const onColNameChange = (oldVal: string) => {
  if (!props.nonFocusableRow) {
    const oldColVal = cloneDeep(props.col);
    oldColVal.name = oldVal;

    // Focus table to be able to add log entry
    emit('mouseDown');
    bufferLogColChange(props.col, oldColVal);
  }
}

const onColTypeChange = (oldVal: TableCol) => {
  if (!props.nonFocusableRow) {
    // Focus table to be able to add log entry
    emit('mouseDown');
    bufferLogColChange(
        props.col,
        oldVal
    )
  }
}

function onFocusOut(event: FocusEvent) {
  if (!event.relatedTarget || !rowRef.value?.contains(event.relatedTarget as Node)) {
    showColumnProps.value = false;
  }
}

const highlightColumnClass = computed(() => {
  if (props.isColNameDuplicate) { return '!bg-yellow-400' }
  if (
      !SQL_IDENTIFIER_REGEX.test(props.col.name) &&
      (!props.nonFocusableRow || props.col.name.length > 0)
  ) { return '!bg-red-400' }

  return '';
});

const onRowKeyUp = (e: KeyboardEvent) => {
  if (!e.altKey || props.col!.type.primitive == 'serial') { return; } // serial column flags are locked

  const col = props.col;
  const oldVal = cloneDeep(col);
  switch (e.key.toLowerCase()) {
    case 'p':
      if (colCanBePrimary(col)) {
        col.primaryKey = !col.primaryKey;
        break;
      }
      return;
    case 'n':
      if (colCanBeNullable(col)) {
        col.notNull = !col.notNull;
        break;
      }
      return;
    case 'u':
      if (!col.primaryKey) {
        col.unique = !col.unique;
        break;
      }
      return;
    case 'a':
      if (!col.primaryKey && colCanAutoIncrement(col)) {
        col.autoIncrement = !col.autoIncrement;
        break;
      }
      return;
    default:
      return;
  }
  onColTypeChange(oldVal);
}

defineExpose({ focusColName, focusColType, focusRow });

</script>