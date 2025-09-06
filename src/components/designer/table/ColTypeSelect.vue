<template>
  <div
      class="w-full relative"
      ref="rootDiv"
      tabindex="-1"
  >
    <input
        v-model="inputValue"
        class="cursor-inherit p-1 overflow-ellipsis w-full"
        :id="`${colId}-type-input`"
        ref="inputRef"
        autocomplete="off"
        tabindex="-1"

        @mousedown.left.prevent
        @mouseup.left.prevent
        @dblclick.left="focusSelectAll"

        @input="selectNextOption"
        @keyup.down="selectNextOption"
        @keyup.up="selectPrevOption"

        @keyup.enter="selectType()"

        @focusout="onFocusOut"
    >

    <div
      v-if="dropdownVisible && inputValue.length"
      class="w-full absolute b-1 l-0 p-2
       bg-accentGray border rounded-b shadow-lg
       max-h-36 overflow-visible overflow-y-scroll z-99"

      @focusout.stop

      @keydown.up.prevent
      @keydown.down.prevent
    >
      <div
          v-for="(name, index) in matchedNames"
          class="w-full bg-accentGray overflow-x-clip z-50 rounded p-1 overscroll-x-none"

          :class="{ 'border border-secondaryAccentGray' : selectedOption == index }"

          :key="`${colId}-${index}`"
          :id="`${colId}-${index}`"

          @keyup.enter="selectType(name)"

          @click="selectType(name)"
      >
        {{ name }}
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import { storeToRefs } from "pinia";
import { useSettingsStore } from "@/store/settings.ts";
import { cloneDeep } from "lodash";

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  },
  colId: {
    type: String,
    required: true
  }
});

const inputRef = useTemplateRef('inputRef');

const selectAll = () => {
  inputRef.value?.select();
};

const deselectAll = () => {
  // If input has any active text selection, deselect all
  inputRef.value?.setSelectionRange(-1, -1);
}

const focusSelectAll = () => {
  deselectAll();
  selectAll();

  selectTypeOption(0);

  dropdownVisible.value = true;
}

const inputValue = ref<string>(cloneDeep(props.modelValue));

const { columnTypeNames } = storeToRefs(useSettingsStore());

const matchedNames = computed(() =>
    columnTypeNames.value.filter(it =>
        it.toLowerCase().includes(inputValue.value.toLowerCase())
    )
);

const selectedOption = ref<number | undefined>(undefined);

const selectTypeOption = (index: number) => {
  if (index >= 0 && index < matchedNames.value.length) {
    selectedOption.value = index;

    const el = document.getElementById(`${props.colId}-${index}`);

    el?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest'
    });
  }
}

const selectNextOption = () => {
  selectedOption.value == undefined ?
      selectedOption.value = 0 :
      selectTypeOption(selectedOption.value + 1);
}

const selectPrevOption = () => {
  selectedOption.value == undefined ?
      selectedOption.value = 0 :
      selectTypeOption(selectedOption.value - 1);
}

const dropdownVisible = ref<boolean>(false);

const rootDiv = useTemplateRef('rootDiv');

const emit = defineEmits(['update:modelValue']);

function onFocusOut(event: FocusEvent) {
  if (rootDiv.value && !rootDiv.value.contains(event.relatedTarget as Node)) {
    dropdownVisible.value = false;
    inputValue.value = cloneDeep(props.modelValue);
  }
}

const selectType = (_name: string | undefined = undefined) => {
  const name = _name ?
      _name :
      matchedNames.value[selectedOption.value ?? 0];

  if (columnTypeNames.value.includes(name)) {
    emit('update:modelValue', name);

    dropdownVisible.value = false;
  }
}

watch(() => props.modelValue, () => {
  inputValue.value = props.modelValue;
});

</script>