<template>
    <div
      class="w-full relative"
      tabindex="-1"
    >
      <div class="flex items-center gap-1">
        <input
          :id="`${col.id}-type-input`"
          ref="inputRef"

          v-model="inputValue"
          class="cursor-inherit p-1 overflow-ellipsis w-full min-w-0"
          :class="{ 'opacity-50 cursor-not-allowed': isTypeDisabled }"
          tabindex="-1"

          :title="$t(disabledTitle)"
          :disabled="isTypeDisabled"

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
          v-if="hasExtras"
          class="flex items-center gap-1 max-w-1/2 shrink-0 overflow-hidden"
        >
          <span
            v-if="col.defaultValue != undefined && col.defaultValue !== ''"
            class="text-monolithicCyanTsunami truncate"
          >
            {{ col.defaultValue }}
          </span>
          <span
            v-if="col.modifierValues && col.modifierValues.length > 0 && col.modifierValues[0]"
            class="truncate"
          >
            ({{ col.modifierValues.join(', ') }})
          </span>
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
import { cloneDeep } from "lodash-es";
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

const hasExtras = computed(() =>
  (col.value.defaultValue != undefined && col.value.defaultValue !== '') ||
  (col.value.modifierValues && col.value.modifierValues.length > 0 && col.value.modifierValues[0]));

const inputRef = useTemplateRef('inputRef');

const settingsStore = useSettingsStore();
const { columnTypeNames, currentDatabaseColumnTypes, currentSettings } = storeToRefs(settingsStore);

const selectAll = () => {
  inputRef.value?.select();
};

const deselectAll = () => {
  // If input has any active text selection, deselect all
  inputRef.value?.setSelectionRange(-1, -1);
};

const focusSelectAll = () => {
  if (isTypeDisabled.value) return;

  emit('focus');

  deselectAll();
  selectAll();

  selectTypeOption(0);

  dropdownVisible.value = true;
};

const inputValue = ref<string>(col.value.type.displayName);

// FK columns cannot have their type manually edited when auto-sync is enabled
const isTypeDisabled = computed(() =>
  col.value.foreignKey && currentSettings.value.updateForeignKeysOnPrimaryChange);

const disabledTitle = computed(() =>
  isTypeDisabled.value
    ? 'FK type is managed by its referenced PK. Disable "Update FK types when PK type changes" in settings to edit manually.'
    : inputValue.value);

// Pre-compute lowercase names for faster filtering/sorting
const columnTypeNamesLower = computed(() =>
  columnTypeNames.value.map(name => ({ name, lower: name.toLowerCase() })));

const matchedNames = computed(() => {
  const search = inputValue.value.toLowerCase();

  // Early return: empty search shows all types in original order
  if (!search) {
    return columnTypeNames.value;
  }

  return columnTypeNamesLower.value
    .filter(({ lower }) => lower.includes(search))
    .sort((a, b) => {
      const exactA = a.lower === search, exactB = b.lower === search;
      if (exactA !== exactB) return exactA ? -1 : 1;

      const startsA = a.lower.startsWith(search), startsB = b.lower.startsWith(search);
      if (startsA !== startsB) return startsA ? -1 : 1;

      return 0;
    })
    .map(({ name }) => name);
});


const selectedOption = ref<number | undefined>(undefined);

const selectTypeOption = (_index: number) => {
  if (isTypeDisabled.value) return;

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

watch(() => col.value.type.displayName, (newDisplayName) => {
  if (inputValue.value !== newDisplayName) {
    inputValue.value = newDisplayName;
  }
});

function focus() {
  inputRef.value?.focus();
}

defineExpose({ focus });
</script>
