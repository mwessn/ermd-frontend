<template>
  <div
      class="w-full relative"
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
        @focus="focusSelectAll"

        @input="selectTypeOption(0)"
        @keyup.down="selectNextOption"
        @keyup.up="selectPrevOption"

        @keydown.enter="onEnter"

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

          @mouseup.left="onOptionClick(index)"
      >
        {{ name }}
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, type PropType, ref, useTemplateRef, watch } from "vue";
import { storeToRefs } from "pinia";
import { useSettingsStore } from "@/store/settings.ts";
import { cloneDeep } from "lodash";
import { clamp } from "@/utils/utils.ts";
import type { ColumnType } from "@/types/TableColumnTypes/tableField.ts";

const model = defineModel({
  type: Object as PropType<ColumnType>,
  required: true
});

const props = defineProps({
  colId: {
    type: String,
    required: true
  },
  rootDiv: {
    type: HTMLDivElement,
    required: true
  }
});

const emit = defineEmits(['onEnterKey']);

const inputRef = useTemplateRef('inputRef');

const { columnTypeNames, currentDatabaseColumnTypes } = storeToRefs(useSettingsStore());

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

const inputValue = ref<string>(
    model.value.displayName
);

const matchedNames = computed(() => {
  const search = inputValue.value.toLowerCase();

  return columnTypeNames.value
      .filter(name => name.toLowerCase().includes(search))
      .sort((a, b) => {
        const A = a.toLowerCase(), B = b.toLowerCase();

        const exactA = A === search, exactB = B === search;
        if (exactA !== exactB) return exactA ? -1 : 1;

        const startsA = A.startsWith(search), startsB = B.startsWith(search);
        if (startsA !== startsB) return startsA ? -1 : 1;

        return 0;
      });
});


const selectedOption = ref<number | undefined>(undefined);

const selectTypeOption = (_index: number) => {
  dropdownVisible.value = true;
  
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


function onFocusOut(event: FocusEvent) {
  if (!event.relatedTarget || !props.rootDiv.contains(event.relatedTarget as Node)) {
    dropdownVisible.value = false;
    inputValue.value = model.value.displayName;
  }
}

const selectType = (_name?: string) => {
  const name = _name ?? matchedNames.value[selectedOption.value ?? 0];
  const selected = currentDatabaseColumnTypes.value[name];

  if (selected) {
    model.value = cloneDeep(selected);
    inputValue.value = name;
    selectedOption.value = undefined;
    dropdownVisible.value = false;
  } else {
    dropdownVisible.value = false;
    inputValue.value = model.value.displayName;
  }
};

const onEnter = () => {
  selectType();
  emit('onEnterKey');
}

const onOptionClick = (index: number) => {
  selectTypeOption(index);
  selectType()
}

watch(() => model.value, () => {
  inputValue.value = model.value.displayName;
});

function focus() {
  inputRef.value?.focus();
}

defineExpose({ focus });

</script>