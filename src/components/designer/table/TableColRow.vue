<template>
  <div
    class="flex w-full not-last:border-b relative group/cols"
    :tabindex="nonFocusableRow ? undefined : -1"
    ref="rowRef"
    @mousedown.left="onMouseDown"
    @keyup.delete.stop="emit('deleteCol');"
  >
    <DoubleClickFocusInput
        v-model="col.name"
        :id="col.id"
        class="w-1/2 group-last/cols:rounded-bl-xl"
        :class="{ 'border-r' : notBlankOrEmpty(col.name), '!bg-red-400': isColNameDuplicate  }"
        ref="colNameRef"
        @focusout="emit('focusOut')"
        @enter-key="emit('focusNext')"
        @delete-key="emit('deleteCol');"
    />
    <div class="w-1/2">
    </div>
  </div>
</template>

<script setup lang="ts">
import { type PropType, useTemplateRef } from "vue";
import type { TableCol } from "@/types/table.ts";
import DoubleClickFocusInput from "@/components/core/DoubleClickFocusInput.vue";
import { notBlankOrEmpty } from "@/utils/utils.ts";

defineProps({
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

defineExpose({ focusColName });

</script>

<style scoped>

</style>