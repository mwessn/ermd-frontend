<template>
    <div
      ref="rootDiv"
      class="bg-accentDarkGray p-1"
      tabindex="-1"
    >
      <div class="flex">
        <div
          v-for="color in colors"
          :key="color"
          class="h-5 w-5 not-last:border-r border-accentDarkGray"
          :style="{ background: color }"
          @click="onClick(color)"
        />
      </div>
    </div>
</template>

<script setup lang="ts">

import { onMounted, useTemplateRef } from "vue";
import {
  PASTEL_SATURATION_BASE,
  PASTEL_SATURATION_RANGE,
  PASTEL_LIGHTNESS_BASE,
  PASTEL_LIGHTNESS_RANGE
} from "@/types/constants.ts";

const model = defineModel({
  type: String,
  required: true
});

const props = withDefaults(defineProps<{
  colorCount?: number
}>(), {
  colorCount: 24
});

function generatePastelPalette(count: number): string[] {
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    const h = Math.floor((360 / count) * i);
    const s = PASTEL_SATURATION_BASE + Math.random() * PASTEL_SATURATION_RANGE;
    const l = PASTEL_LIGHTNESS_BASE + Math.random() * PASTEL_LIGHTNESS_RANGE;
    colors.push(`hsl(${h}, ${s}%, ${l}%)`);
  }
  return colors;
}

const colors = generatePastelPalette(props.colorCount);

const emit = defineEmits(['change']);

const onClick = (color: string) => {
  if (color !== model.value) {
    model.value = color;
    emit('change');
  }
};

const rootDiv = useTemplateRef('rootDiv');

onMounted(() => {
  rootDiv.value?.focus();
});
</script>