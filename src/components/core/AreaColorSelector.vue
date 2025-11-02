<template>
  <div class="bg-accentDarkGray p-1" tabindex="-1" ref="rootDiv">
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

const model = defineModel({
  type: String,
  required: true
});

const props = defineProps({
  colorCount: {
    type: Number,
    default: 24
  }
});

function generatePastelPalette(count: number): string[] {
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    const h = Math.floor((360 / count) * i);
    const s = 70 + Math.random() * 10; // 70–80%
    const l = 80 + Math.random() * 5;  // 80–85%
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
}

const rootDiv = useTemplateRef('rootDiv');

onMounted(() => {
  rootDiv.value?.focus();
});
</script>