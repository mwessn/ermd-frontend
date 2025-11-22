<template>
  <div>
    <div class="p-2 rounded-lg bg-backgroundDark">
      <p class="text-accentGray">
        {{ label }}
      </p>
      <input
          v-model="model"
          type="number"
          class="p-2 bg-accentDarkGray rounded w-full text-center"
          :min="minValue"
          :max="maxValue"
          @change="onChange"
      >
    </div>
    <p v-if="hint" class="text-sm text-accentGray my-2 text-left">
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { clamp } from "@/utils/utils.ts";

const model = defineModel({ type: Number, required: true });

const props = defineProps({
  label: { type: String, required: true },
  minValue: { type: Number, default: 0 },
  maxValue: { type: Number, default: 60 },
  hint: { type: String, default: "" },
});

const onChange = () => {
  model.value = clamp(model.value, props.minValue, props.maxValue);
}
</script>