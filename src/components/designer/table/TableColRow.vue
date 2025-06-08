<template>
  <div
    class="flex w-full not-last:border-b relative group/cols"
    tabindex="-1"
    ref="rowRef"
    @mousedown.left="onMouseDown"
    @keyup.delete.stop="emit('deleteCol');"
  >
    <DoubleClickFocusInput
        v-model="col.name"
        class="w-1/2 group-last/cols:rounded-bl-xl"
        :class="{ 'border-r' : notBlankOrEmpty(col.name), '!bg-red-400': isColNameDuplicate  }"
        ref="colNameRef"
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
  }
});

const emit = defineEmits(['focusNext', 'mouseDown', 'deleteCol']);

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