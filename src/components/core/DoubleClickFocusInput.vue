<template>
  <input
      v-model="model"
      :type="type"
      :id="id"
      :maxlength="length"
      class="cursor-inherit p-1 overflow-ellipsis align-middle"
      ref="inputRef"
      autocomplete="off"
      tabindex="-1"

      @mousedown.left.prevent
      @mouseup.left.prevent
      @dblclick.left="focusInput"

      @focus="onFocus"
      @change="onChange"

      @focusout="deselectAll"

      @keydown.enter.prevent="emit('enterKey')"
      @keyup.delete="onDelete"

      @keydown.shift="onShiftKey"
  >
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";

const props = defineProps({
  modelValue: {
    type: [String, Number],
    required: true
  },
  id: {
    type: String,
    required: false
  },
  type: {
    type: String,
    default: 'text'
  },
  length: {
    type: Number,
    default: 63,
  },
  allowShiftKey: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'enterKey', 'deleteKey', 'valueChange']);

const model = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

// Previous input value handle

const oldVal = ref<string | number>(props.modelValue);

const onFocus = () => {
  oldVal.value = props.modelValue;
}

const onChange = () => {
  emit('valueChange', oldVal.value, model.value);
}

// Input focus state handle

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

const onDelete = (evt: KeyboardEvent) => {
  if (evt.shiftKey && evt.key == 'Delete') {
    // Emit delete event on Shift + Del
    emit('deleteKey');
  }
}

const onShiftKey = (e: KeyboardEvent) => {
  if (!props.allowShiftKey) {
    e.preventDefault();
  }
}

defineExpose({ focusSelectAll });
</script>