<template>
  <div
    class="flex w-full not-last:border-b relative group/cols"
    ref="rowRef"

    :tabindex="nonFocusableRow ? undefined : -1"

    @focus="showColumnProps = true"
    @focusout="onFocusOut"

    @mousedown.left="onMouseDown"
    @keyup.enter="onRowEnterKey"
    @keyup.delete.stop="emit('deleteCol');"
  >
    <DoubleClickFocusInput
        v-model="col.name"
        ref="colNameRef"

        :name="`colName-${col.id}`"

        class="w-full group-last/cols:rounded-bl-xl "
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

          @on-enter-key="onFocusNext"

          @keydown.delete.stop
          @keyup.delete.stop
      />
      <div>
        <FontAwesomeIcon
            class="cursor-pointer"
            :icon="showColumnProps ? faChevronLeft : faChevronRight"
            @click="showColumnProps = !showColumnProps"
        />
      </div>
    </div>

    <ColumnProperties
        v-if="showColumnProps && showColType"
        :col="col"
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
import { colCanAutoIncrement, colCanBePrimary, type TableCol } from "@/types/table.ts";
import DoubleClickFocusInput from "@/components/core/DoubleClickFocusInput.vue";
import { useDesignStore } from "@/store/design.ts";
import { cloneDeep } from "lodash";
import { SQL_IDENTIFIER_REGEX } from "@/types/misc.ts";
import ColTypeSelect from "@/components/designer/table/ColTypeSelect.vue";
import { resetFocus } from "@/utils/utils.ts";
import { type ColumnType, getDefaultModifierParams } from "@/types/TableColumnTypes/tableField.ts";
import ColumnProperties from "@/components/designer/table/ColumnProperties.vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";

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
  showColType.value = !props.nonFocusableRow;
});

watch(() => props.col.type, (newType: ColumnType) => {
  props.col.modifierValues = getDefaultModifierParams(newType);
  if (props.col.primaryKey) {
    props.col.primaryKey = colCanBePrimary(props.col);
  }
  if (props.col.autoIncrement) {
    props.col.autoIncrement = colCanAutoIncrement(props.col);
  }
});

watch(() => props.col.primaryKey, (newVal: boolean) => {
  if (newVal) {
    props.col.notNull = true;
  }
});

const emit = defineEmits(['focusNext', 'mouseDown', 'deleteCol', 'focusOut']);

const rowRef = useTemplateRef('rowRef');

const colTypeRef = useTemplateRef('colTypeRef');

const showColumnProps = ref<boolean>(false);

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

defineExpose({ focusColName, focusColType, focusRow });

</script>