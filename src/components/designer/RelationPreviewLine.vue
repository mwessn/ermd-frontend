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
import { useDesignStore } from "@/store/design.ts";
import { RELATION_DASH_PATTERN } from "@/types/constants.ts";

const props = defineProps<{
  tableId: string
  scaleFactor: number
  offsetX: number
  offsetY: number
  mouseX: number
  mouseY: number
  dashed: boolean
  isMtm: boolean
}>();

const designStore = useDesignStore();

const x1 = ref<number>(0);
const y1 = ref<number>(0);

function getAnchorId(side: 'l' | 'r'): string {
  if (props.isMtm) {
    const table = designStore.tablesMap.get(props.tableId);
    const pkCol = table?.cols.find(c => c.primaryKey);
    if (pkCol) return `anchor-${pkCol.id}-${side}`;
  }
  return `anchor-newcol-${props.tableId}-${side}`;
}

const calculateLineStart = () => {
  const mouseIsRight = props.mouseX > x1.value;
  const side = mouseIsRight ? 'r' : 'l';
  const anchor = document.getElementById(getAnchorId(side));
  if (!anchor) return;

  const rect = anchor.getBoundingClientRect();
  x1.value = rect.x / props.scaleFactor - props.offsetX;
  y1.value = rect.y / props.scaleFactor - props.offsetY;
};

useLineTracker(calculateLineStart);
</script>
