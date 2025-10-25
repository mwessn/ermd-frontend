<template>
  <div
      class="w-full relative"
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
        @focus="focusSelectAll"

        @input="selectTypeOption(0)"
        @keyup.down="selectNextOption"
        @keyup.up="selectPrevOption"

        @keyup.enter="onEnter"

        @focusout="onFocusOut"
    >

    <div
      v-if="dropdownVisible"
      class="w-full absolute b-1 l-0 p-2 min-w-max
       bg-accentGray border rounded-b shadow-lg
       max-h-36 overflow-x-visible overflow-y-scroll z-999"

      ref="rootDiv"
      tabindex="-1"

      @focusout.stop
      @click.stop

      @keydown.up.prevent
      @keydown.down.prevent
    >
      <div
          v-for="(name, index) in matchedNames"
          class="w-full bg-accentGray overflow-x-clip z-999 rounded p-1 overscroll-x-none"

          :class="{ 'border border-secondaryAccentGray' : selectedOption == index }"

          :key="`${colId}-${index}`"
          :id="`${colId}-${index}`"

          @focusout.stop

          @click="onOptionClick(index)"
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
import { clamp } from "@/utils/utils.ts";

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  },
  colId: {
    type: String,
    required: true
  },
  rootDiv: {
    type: HTMLDivElement,
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

const selectTypeOption = (_index: number) => {
  const index = clamp(_index, 0, matchedNames.value.length - 1);

  selectedOption.value = index;

  const el = document.getElementById(`${props.colId}-${index}`);

  el?.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: 'nearest'
  });
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

const emit = defineEmits(['update:modelValue']);

function onFocusOut(event: FocusEvent) {
  if (!event.relatedTarget || !props.rootDiv.contains(event.relatedTarget as Node)) {
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

    selectedOption.value = undefined;

    dropdownVisible.value = false;
  } else {
    dropdownVisible.value = false;
    inputValue.value = cloneDeep(props.modelValue);
  }
}

const onEnter = () => {
  selectType();
}

const onOptionClick = (index: number) => {
  selectTypeOption(index);
  selectType()
}

watch(() => props.modelValue, () => {
  inputValue.value = props.modelValue;
});

</script>