<template>
    <div
      class="flex items-center justify-between relative
              p-2 bg-backgroundDark rounded-lg my-2"
    >
      <p class="cursor-default text-textColor w-1/4">
        {{ label }}
      </p>
      <input
        ref="textInput"
        v-model="model"
        class="p-2 rounded bg-lycheeIce w-3/4 font-mono"
        :class="uppercase ? 'uppercase' : ''"
        type="text"
        autocomplete="off"
        @focus="emit('focusInput')"
        @blur="onFocusOut"
        @keydown.tab="onTab"
      >
      <div
        v-if="suggestion && suggestion != model"
        class="absolute top-0 left-1/4
          text-tinted pointer-events-none p-3 h-full flex items-center
            font-mono"
        :class="uppercase ? 'uppercase' : ''"
      >
        {{ suggestion }}
        <KeyDisplay
          class="ml-1 opacity-75 scale-75"
          text="tab"
          :square="false"
        />
      </div>
    </div>
</template>

<script setup lang="ts">
import { cloneDeep } from "lodash-es";
import { notBlankOrEmpty } from "@/utils/utils.ts";
import KeyDisplay from "@/components/core/KeyDisplay.vue";
import { useTemplateRef } from "vue";

const model = defineModel({ type: String, required: true });

const emit = defineEmits(['focusInput', 'blurInput']);

const props = withDefaults(defineProps<{
  label: string
  suggestion?: string
  uppercase?: boolean
}>(), {
  suggestion: '',
  uppercase: false
});

const onFocusOut = (evt: FocusEvent) => {
  emit('blurInput', evt);
};

const onTab = (evt: KeyboardEvent) => {
  if (notBlankOrEmpty(props.suggestion) && props.suggestion != model.value) {
    evt.preventDefault();
    model.value = cloneDeep(props.suggestion);
  }
};

const textInput = useTemplateRef('textInput');

const focusInput = () => {
  textInput.value?.focus();
};

defineExpose({ 'focusInput': focusInput });
</script>