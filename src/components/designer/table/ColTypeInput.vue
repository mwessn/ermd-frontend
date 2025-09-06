<template>
  <div class="min-w-9/12 w-full">
    <DoubleClickFocusInput
        v-model="colType"
        :name="`colName-${colId}`"
        class="w-1/2 group-last/cols:rounded-bl-xl"
        ref="colNameRef"
        @focusout="emit('focusOut')"
        @enter-key="emit('focusNext')"
        @delete-key="emit('deleteCol');"
        @keyup.delete.stop

        @value-change="onColNameChange"
    />
  </div>
  <div v-if="colModifier && colModifier.length" class="w-full flex items-center justify-between">
    <DoubleClickFocusInput
        v-for="(mod, index) in colModifier"
        v-model="mod"
  </div>
</template>

<script setup lang="ts">
import DoubleClickFocusInput from "@/components/core/DoubleClickFocusInput.vue";
import type { PropType } from "vue";

const colType = defineModel('colType', { type: String, required: true });
const colModifier = defineModel('colModifier', { type: Array as PropType<number[]>, required: false } );

const props = defineProps({
  colId: {
    type: String,
    required: true
  }
});
</script>

<style scoped>

</style>