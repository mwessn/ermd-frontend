<template type="svg">
    <line
      stroke-linecap="round"
      :stroke-width="3"
      stroke="var(--color-monolithicCyanTsunami)"
      stroke-opacity="50%"
      :stroke-dasharray="dashed ? RELATION_DASH_PATTERN : undefined"
      :x1="x1"
      :y1="y1"
      :x2="mouseX"
      :y2="mouseY"
    />
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useLineTracker } from "@/components/designer/scripts/useLineTracker.ts";
import { RELATION_DASH_PATTERN } from "@/types/constants.ts";

const props = defineProps<{
  tableId: string
  scaleFactor: number
  offsetX: number
  offsetY: number
  mouseX: number
  mouseY: number
  dashed: boolean
}>();

const x1 = ref<number>(0);
const y1 = ref<number>(0);

const calculateLineStart = () => {
  const headerDOM = document.getElementById(`table-header-${props.tableId}`);
  if (!headerDOM) return;

  const rect = headerDOM.getBoundingClientRect();
  // Center of the header
  x1.value = (rect.x + rect.width / 2) / props.scaleFactor - props.offsetX;
  y1.value = (rect.y + rect.height / 2) / props.scaleFactor - props.offsetY;
};

useLineTracker(calculateLineStart);
</script>
