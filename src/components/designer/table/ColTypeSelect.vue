<template>
  <div
      class="w-full relative"
      tabindex="-1"
  >
    <input
        v-model="inputValue"
        class="cursor-inherit p-1 overflow-ellipsis w-full"

        :id="`${col.id}-type-input`"
        ref="inputRef"
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

        @keydown.enter="onEnter"

        @focusout="onFocusOut"
    >

    <div
        class="absolute left-full bottom-0 bg-accentGray text-sm rounded-r-lg rounded-tl-lg"
    >
      <div v-if="col.type.modifier && col.modifierValues" class="flex justify-center border-b border-b-accentDarkGray">
        <div
            v-for="(mod, index) in col.type.modifier"
            class="p-1 w-full max-w-36 not-last:border-r border-r-accentDarkGray text-center"
        >
          <p>
            {{ $t(mod.hint) }}
          </p>
          <div class="border-b border-b-accentDarkGray my-1" />
          <input
              class="w-full text-center"
              v-model="col.modifierValues[index]"

              placeholder="null"

              :min="mod.minValue"
              :max="mod.maxValue"

              :name="mod.hint"

              :title="mod.hint"
          >
        </div>
      </div>

      <div class="flex text-center">
        <ColPropertyCheckbox
            v-model="col.primaryKey"
            label="PK"
            :disabled="!colCanBePrimary(col)"
        />
        <ColPropertyCheckbox
            v-model="col.notNull"
            label="NN"
            :disabled="!colCanBeNullable(col)"
        />
        <ColPropertyCheckbox
            v-model="col.unique"
            label="U"
        />
        <ColPropertyCheckbox
            v-model="col.autoIncrement"
            label="AI"
            :disabled="colCanAutoIncrement(col)"
        />

        <div class="p-2 border-l border-l-accentDarkGray grid gap-2">
          <p class="wrap-break-word">{{ $t('Default') }}</p>
          <input
              v-model="col.defaultValue"
              placeholder="null"
              class="self-end border-b text-center"
              type="text"
              name="column default value"
          >
        </div>
      </div>
  </div>

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

          :key="`${col.id}-${index}`"
          :id="`${col.id}-${index}`"

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
import { colCanAutoIncrement, colCanBeNullable, colCanBePrimary, type TableCol } from "@/types/table.ts";
import ColPropertyCheckbox from "@/components/designer/table/ColPropertyCheckbox.vue";

const props = defineProps({
  col: {
    type: Object as PropType<TableCol>,
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
    props.col.type.displayName
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

  const el = document.getElementById(`${props.col.id}-${index}`);

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
    inputValue.value = props.col.type.displayName;
  }
}

const selectType = (_name?: string) => {
  const name = _name ?? matchedNames.value[selectedOption.value ?? 0];
  const selected = currentDatabaseColumnTypes.value[name];

  if (selected) {
    props.col.type = cloneDeep(selected);
    inputValue.value = name;
    selectedOption.value = undefined;
    dropdownVisible.value = false;
  } else {
    dropdownVisible.value = false;
    inputValue.value = props.col.type.displayName;
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

watch(() => props.col.type, () => {
  inputValue.value = props.col.type.displayName;
});

function focus() {
  inputRef.value?.focus();
}

defineExpose({ focus });

</script>