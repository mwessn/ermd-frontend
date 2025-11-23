<template>
  <div class="relative">
    <TextInput
        v-model="currentValue"
        :label="EngineNamingMap[aliasedEngine]"

        :suggestion="inputSuggestion"
        uppercase

        @focusInput="inputActive = true"
        @blurInput="onFocusOut"
    />

    <div
        v-if="inputActive && lastInputValue"
        class="fixed p-2 bg-accentDarkGray text-accentGray
              rounded-lg z-99 select-none max-h-56 overflow-auto w-96"
        tabindex="-1"
        ref="rootDiv"
    >
      <div
          v-for="option in displayOptions"
          class="p-1 cursor-pointer"
          tabindex="-1"
          @click="console.log(option)"
      >
        {{ option }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType, ref, useTemplateRef } from "vue";
import { type DatabaseEngine, EngineNamingMap } from "@/types/TableColumnTypes/tableField.ts";
import { useSettingsStore } from "@/store/settings.ts";
import TextInput from "@/components/core/inputs/TextInput.vue";
import { cloneDeep } from "lodash";

const model = defineModel({ type: String, required: true });

const props = defineProps({
  aliasedEngine: {
    type: String as PropType<DatabaseEngine>,
    required: true,
  }
});

const rootDiv = useTemplateRef('rootDiv');

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
    '$COMPOSITE',
]

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
      typeOptions.value
);

const displayOptions = computed(() =>
  selectOptions.value.filter(it => it.startsWith(lastInputValue.value.toUpperCase()))
);

const inputSuggestion = computed(() =>
    lastInputValue.value && displayOptions.value.length > 0 ?
      currentValue.value + displayOptions.value[0].substring(lastInputValue.value.length) :
      undefined
);

function onFocusOut(event: FocusEvent) {
  if (!event.relatedTarget || !rootDiv.value!.contains(event.relatedTarget as Node)) {
    inputActive.value = false;
  }
}

</script>