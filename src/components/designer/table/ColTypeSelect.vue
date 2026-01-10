<template>
    <div
      class="w-full relative"
      tabindex="-1"
    >
      <div class="flex items-center">
        <input
          :id="`${col.id}-type-input`"
          ref="inputRef"

          v-model="inputValue"
          class="cursor-inherit p-1 overflow-ellipsis w-full"
          tabindex="-1"

          :title="inputValue"

          autocomplete="off"

          @mousedown.left.prevent
          @mouseup.left.prevent
          @dblclick.left="focusSelectAll"
          @focus="focusSelectAll"

          @input="selectTypeOption(0)"
          @keyup.down="selectNextOption"
          @keyup.up="selectPrevOption"

          @keydown.enter.exact="onEnter"

          @focusout="onFocusOut"

          @keydown.shift.prevent
        >
        <div
          v-if="col.modifierValues && col.modifierValues.length > 0 && col.modifierValues[0]"
        >
          ({{ col.modifierValues.join(', ') }})
        </div>
      </div>


      <div
        v-if="dropdownVisible"
        ref="rootDiv"

        class="w-full absolute b-1 l-0 p-2 min-w-max
       bg-accentGray border rounded-b shadow-lg
       max-h-36 overflow-x-visible overflow-y-scroll z-999"
        tabindex="-1"

        @focusout.stop
        @click.stop

        @keydown.up.prevent
        @keydown.down.prevent
      >
        <div
          v-for="(name, index) in matchedNames"
          :id="`${col.id}-${index}`"

          :key="`${col.id}-${index}`"

          class="w-full bg-accentGray overflow-x-clip z-999 rounded p-1 overscroll-x-none"
          :class="{ 'border border-secondaryAccentGray' : selectedOption == index }"

          @focusout.stop

          @mouseup.left="onOptionClick(index)"
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
import { type TableCol } from "@/types/table.ts";

const col = defineModel<TableCol>('col', { required: true });

const props = defineProps<{
  rootDiv: HTMLDivElement
}>();

const emit = defineEmits<{
  onEnterKey: []
  focus: []
  valueChange: [oldVal: TableCol]
}>();

const inputRef = useTemplateRef('inputRef');

const { columnTypeNames, currentDatabaseColumnTypes } = storeToRefs(useSettingsStore());

const selectAll = () => {
  inputRef.value?.select();
};

const deselectAll = () => {
  // If input has any active text selection, deselect all
  inputRef.value?.setSelectionRange(-1, -1);
};

const focusSelectAll = () => {
  emit('focus');

  deselectAll();
  selectAll();

  selectTypeOption(0);

  dropdownVisible.value = true;
};

const inputValue = ref<string>(col.value.type.displayName);

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

  const el = document.getElementById(`${col.value.id}-${index}`);

  el?.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: 'nearest'
  });
};

const selectNextOption = () => {
  if (selectedOption.value == undefined) {
    selectedOption.value = 0;
  } else {
    selectTypeOption(selectedOption.value + 1);
  }
};

const selectPrevOption = () => {
  if (selectedOption.value == undefined) {
    selectedOption.value = 0;
  } else {
    selectTypeOption(selectedOption.value - 1);
  }
};

const dropdownVisible = ref<boolean>(false);


function onFocusOut(event: FocusEvent) {
  if (!event.relatedTarget || !props.rootDiv.contains(event.relatedTarget as Node)) {
    dropdownVisible.value = false;
    inputValue.value = col.value.type.displayName;
  }
}

const selectType = (_name?: string) => {
  const name = _name ?? matchedNames.value[selectedOption.value ?? 0];
  const selected = currentDatabaseColumnTypes.value
    .find(it => it.displayName == name);

  if (selected) {
    col.value.type = cloneDeep(selected);
    inputValue.value = name;
    selectedOption.value = undefined;
    dropdownVisible.value = false;
  } else {
    dropdownVisible.value = false;
    inputValue.value = col.value.type.displayName;
  }
};

const onEnter = () => {
  if (!dropdownVisible.value) {
    emit('onEnterKey');
  } else {
    selectType();
  }
};

const onOptionClick = (index: number) => {
  const oldVal = cloneDeep(col.value);
  selectTypeOption(index);
  selectType();
  emit('valueChange', oldVal);
};

watch(() => col.value.type, () => {
  inputValue.value = col.value.type.displayName;
});

function focus() {
  inputRef.value?.focus();
}

defineExpose({ focus });
</script>
