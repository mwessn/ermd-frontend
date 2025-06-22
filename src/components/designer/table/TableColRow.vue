<template>
  <div
    class="flex w-full not-last:border-b relative group/cols"
    :tabindex="nonFocusableRow ? undefined : -1"
    ref="rowRef"
    @mousedown.left="onMouseDown"
    @keyup.enter="onRowEnterKey"
    @keyup.delete.stop="emit('deleteCol');"
  >
    <DoubleClickFocusInput
        v-model="col.name"
        :name="`colName-${col.id}`"
        class="w-1/2 group-last/cols:rounded-bl-xl "
        :class="[{ 'border-r' : !nonFocusableRow }, highlightColumnClass]"
        ref="colNameRef"
        @focusout="emit('focusOut')"
        @enter-key="emit('focusNext')"
        @delete-key="emit('deleteCol');"
        @keyup.delete.stop

        @value-change="onColNameChange"
    />
    <div class="w-1/2">
    </div>

    <div v-if="col.foreignKey || col.primaryKey" class="absolute full flex items-center justify-between z-0 pointer-events-none">
      <div :id="`anchor-${col.id}-l`" />
      <div :id="`anchor-${col.id}-r`" />
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, type PropType, useTemplateRef } from "vue";
import type { TableCol } from "@/types/table.ts";
import DoubleClickFocusInput from "@/components/core/DoubleClickFocusInput.vue";
import { useDesignStore } from "@/store/design.ts";
import { cloneDeep } from "lodash";
import { SQL_IDENTIFIER_REGEX } from "@/types/misc.ts";

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

const emit = defineEmits(['focusNext', 'mouseDown', 'deleteCol', 'focusOut']);

const rowRef = useTemplateRef('rowRef');

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

const onRowEnterKey = (evt: InputEvent) => {
  if (!(evt.target instanceof HTMLInputElement)) {
    focusColName();
  }
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

const highlightColumnClass = computed(() => {
  if (props.isColNameDuplicate) { return '!bg-yellow-400' }
  if (
      !SQL_IDENTIFIER_REGEX.test(props.col.name) &&
      (!props.nonFocusableRow || props.col.name.length > 0)
  ) { return '!bg-red-400' }

  return '';
})

defineExpose({ focusColName, focusRow });

</script>

<style scoped>

</style>