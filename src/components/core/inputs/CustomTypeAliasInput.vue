<template>
    <div class="relative">
      <TextInput
        ref="inputRef"
        v-model="currentValue"

        :label="EngineNamingMap[aliasedEngine]"
        :suggestion="inputSuggestion"

        uppercase

        @focus-input="inputActive = true"
        @blur-input="onFocusOut"
      />

      <div
        v-if="inputActive"
        ref="rootDiv"
        :class="lastInputValue ? 'block' : 'hidden'"
        class="fixed p-2 bg-accentDarkGray text-accentGray
              rounded-lg z-99 select-none max-h-56 overflow-auto w-96"
        tabindex="-1"
      >
        <div
          v-for="option in displayOptions"
          :key="option"
          class="p-1 cursor-pointer"
          tabindex="-1"
          @click="onTypeClick(option)"
        >
          {{ option }}
        </div>
      </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";
import {
  type DatabaseEngine,
  EngineNamingMap,
  enginesWithCompositeTypes
} from "@/types/TableColumnTypes/tableField.ts";
import { useSettingsStore } from "@/store/settings.ts";
import TextInput from "@/components/core/inputs/TextInput.vue";
import { cloneDeep } from "lodash";

const model = defineModel({ type: String, required: true });

const props = defineProps<{
  aliasedEngine: DatabaseEngine
}>();

const rootDiv = useTemplateRef('rootDiv');
const inputRef = useTemplateRef('inputRef');

const settingsStore = useSettingsStore();

const inputActive = ref<boolean>(false);

const availableTypes = computed(() => Object.values(settingsStore.engineColumnTypes[props.aliasedEngine!]));

const typeOptions = computed(() => availableTypes.value.map(it => it.displayName));

const currentValue = ref<string>(cloneDeep(model.value));

const specialKeywords: string[] = [
  '$MODIFIER',
  '$USERDEF()',
  '$FLAG()',
  '$ENUM_FROM',
  enginesWithCompositeTypes.includes(props.aliasedEngine) ? '$COMPOSITE' : undefined,
].filter(Boolean) as string[];

const lastInputValue = computed(() => {
  const separators = ['?', ':', '$'];

  let lastValue = cloneDeep(currentValue.value);

  for (const sep of separators) {
    const parts = lastValue.split(sep);
    if (parts.length > 1) {
      lastValue = parts.pop()!;
      if (sep === '$') {
        lastValue = '$' + lastValue;
      }
    }
  }

  return lastValue;
});

const selectOptions = computed(() =>
  lastInputValue.value.startsWith('$') ?
    specialKeywords :
    typeOptions.value);

const displayOptions = computed(() =>
  selectOptions.value.filter(it => it.startsWith(lastInputValue.value.toUpperCase())));

const inputSuggestion = computed(() =>
  lastInputValue.value && displayOptions.value.length > 0 ?
    currentValue.value + displayOptions.value[0].substring(lastInputValue.value.length) :
    undefined);

const onTypeClick = (val: string) => {
  const appendString = lastInputValue.value.startsWith('$') ?
    specialKeywords.find(it => it == val) :
    availableTypes.value.find(it => it.displayName === val)?.displayName ?? undefined;

  if (appendString) {
    const endPos = currentValue.value.length - lastInputValue.value.length;
    currentValue.value = currentValue.value.slice(0, endPos) + appendString;
  }

  inputRef.value?.focusInput();
};

function onFocusOut(event: FocusEvent) {
  if (!event) { return; }
  if (!event.relatedTarget || !rootDiv.value!.contains(event.relatedTarget as Node)) {
    inputActive.value = false;
  }
}

</script>