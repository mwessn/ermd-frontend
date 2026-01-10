<template>
    <input
      :id="props.id"
      ref="inputRef"
      v-model="model"
      :type="props.type"
      :maxlength="props.length"
      :placeholder="props.placeholder"
      class="cursor-inherit p-1 overflow-ellipsis align-middle"
      autocomplete="off"
      tabindex="-1"

      @mousedown.left.prevent
      @mouseup.left.prevent
      @dblclick.left="focusInput"

      @focus="onFocus"
      @change="onChange"

      @focusout="deselectAll"

      @keydown.enter.exact.prevent="emit('enterKey')"
      @keyup.delete="onDelete"

      @keydown.alt.prevent
    >
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from "vue";

const props = withDefaults(defineProps<{
  id?: string
  type?: string
  length?: number
  placeholder?: string
}>(), {
  id: undefined,
  type: 'text',
  length: 63,
  placeholder: undefined
});

const model = defineModel<string | number>({ required: true });

const emit = defineEmits<{
  enterKey: []
  deleteKey: []
  valueChange: [oldVal: string | number, newVal: string | number]
}>();

// Previous input value handle

const oldVal = ref<string | number>(model.value);

const onFocus = () => {
  oldVal.value = model.value;
};

const onChange = () => {
  emit('valueChange', oldVal.value, model.value);
};

// Input focus state handle

const inputRef = useTemplateRef('inputRef');

const focusInput = () => {
  inputRef.value?.focus();
};

const selectAll = () => {
  inputRef.value?.select();
};

const deselectAll = () => {
  // If input has any active text selection, deselect all
  inputRef.value?.setSelectionRange(-1, -1);
};

const focusSelectAll = () => {
  deselectAll();
  focusInput();
  selectAll();
};

const onDelete = (evt: KeyboardEvent) => {
  if (evt.shiftKey && evt.key == 'Delete') {
    // Emit delete event on Shift + Del
    emit('deleteKey');
  }
};

defineExpose({ focusSelectAll });
</script>