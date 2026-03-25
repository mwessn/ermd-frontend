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
import { computed } from "vue";
import { useDesignStore } from "@/store/design.ts";
import {
  RELATION_DASH_PATTERN,
  TABLE_HEADER_HEIGHT,
  TABLE_ROW_HEIGHT
} from "@/types/constants.ts";

const props = defineProps<{
  tableId: string
  mouseX: number
  mouseY: number
  dashed: boolean
  isMtm: boolean
}>();

const designStore = useDesignStore();

const table = computed(() => designStore.tablesMap.get(props.tableId));

const anchorColIndex = computed(() => {
  if (!table.value) return -1;
  if (props.isMtm) {
    const pkIndex = table.value.cols.findIndex(c => c.primaryKey);
    if (pkIndex !== -1) return pkIndex;
  }
  return table.value.cols.length;
});

const x1 = computed(() => {
  if (!table.value) return 0;
  const mouseIsRight = props.mouseX > table.value.posX + table.value.widthPx / 2;
  return mouseIsRight
    ? table.value.posX + table.value.widthPx
    : table.value.posX;
});

const y1 = computed(() => {
  if (!table.value || anchorColIndex.value === -1) return 0;
  return table.value.posY + TABLE_HEADER_HEIGHT + anchorColIndex.value * TABLE_ROW_HEIGHT + (TABLE_ROW_HEIGHT - 1) / 2;
});
</script>
