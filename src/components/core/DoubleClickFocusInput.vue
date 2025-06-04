<template>
  <input
      v-model="model"
      :type="type"
      class="cursor-inherit"
      ref="inputRef"
      tabindex="-1"
      @focusout="deselectAll"
      @mousedown.left.prevent
      @mouseup.left.prevent
      @dblclick.left="focusInput"
  >
</template>

<script setup lang="ts">
import { computed, useTemplateRef } from "vue";

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'text'
  }
});

const emit = defineEmits(['update:modelValue']);

const model = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const inputRef = useTemplateRef('inputRef');

const focusInput = () => {
  inputRef.value?.focus();
}

const selectAll = () => {
  inputRef.value?.select();
};

const deselectAll = () => {
  // If input has any active text selection, deselect all
  inputRef.value?.setSelectionRange(-1, -1);
}

const focusSelectAll = () => {
  deselectAll();
  focusInput();
  selectAll();
}

defineExpose({ focusSelectAll });
</script>