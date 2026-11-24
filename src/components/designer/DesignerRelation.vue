<template type="svg">
    <g>
      <line
        stroke-linecap="round"
        :stroke-width="lineWidth"
        :stroke="lineColor"
        :stroke-dasharray="lineDash"
        stroke-opacity="50%"
        :x1="x1 - x1offset"
        :y1="y1"
        :x2="x2"
        :y2="y2"
      />
      <polyline
        v-if="isManyRelationship"
        :points="trianglePoints"
        :fill="lineColor"
      />
      <circle
        v-else
        :r="circleRadius"
        :cx="x1"
        :cy="y1"
        :fill="lineColor"
      />
    </g>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { DatabaseRelationship } from "@/types/relationships.ts";
import { useDesignStore } from "@/store/design.ts";
import { clamp } from "@/utils/utils.ts";
import { storeToRefs } from "pinia";
import {
  RELATION_BASE_CIRCLE_SIZE,
  RELATION_CIRCLE_SIZE_MULTIPLIER,
  RELATION_MAX_CIRCLE_SIZE,
  RELATION_BASE_TRIANGLE_RADIUS,
  RELATION_TRIANGLE_RADIUS_MULTIPLIER,
  RELATION_MAX_TRIANGLE_RADIUS,
  RELATION_BASE_LINE_WIDTH,
  RELATION_LINE_WIDTH_MULTIPLIER,
  RELATION_MAX_LINE_WIDTH,
  RELATION_DASH_PATTERN,
  TABLE_HEADER_HEIGHT,
  TABLE_ROW_HEIGHT
} from "@/types/constants.ts";

const designStore = useDesignStore();

const props = defineProps<{
  relation: DatabaseRelationship
  scaleFactor: number
}>();

const fkColumn = computed(() => {
  const table = designStore.tablesMap.get(props.relation.firstTableId);
  return table?.cols.find(c => c.id === props.relation.firstTableColId);
});

const isManyRelationship = computed(() => fkColumn.value ? !fkColumn.value.unique : false);

// Increase circle size on zooming out
const circleRadius = computed(() => clamp(
  RELATION_BASE_CIRCLE_SIZE + RELATION_BASE_CIRCLE_SIZE * RELATION_CIRCLE_SIZE_MULTIPLIER * (1 - props.scaleFactor),
  RELATION_BASE_CIRCLE_SIZE,
  RELATION_MAX_CIRCLE_SIZE
));

// Increase triangle size on zooming out
const triangleRadius = computed(() => clamp(
  RELATION_BASE_TRIANGLE_RADIUS + RELATION_BASE_TRIANGLE_RADIUS * RELATION_TRIANGLE_RADIUS_MULTIPLIER * (1 - props.scaleFactor),
  RELATION_BASE_TRIANGLE_RADIUS,
  RELATION_MAX_TRIANGLE_RADIUS
));

// Increase line width on zooming out
const lineWidth = computed(() => clamp(
  RELATION_BASE_LINE_WIDTH + RELATION_BASE_LINE_WIDTH * RELATION_LINE_WIDTH_MULTIPLIER * (1 - props.scaleFactor),
  RELATION_BASE_LINE_WIDTH,
  RELATION_MAX_LINE_WIDTH
));

// Non-identifying are dashed
const lineDash = computed(() => fkColumn.value && !fkColumn.value.notNull ? RELATION_DASH_PATTERN : undefined);

const { selectedTable } = storeToRefs(designStore);

const lineColor = computed(() =>
  selectedTable.value && props.relation.firstTableId == selectedTable.value.id
    ? 'var(--color-monolithicCyanTsunami)'
    : 'var(--color-lycheeIce)');

// Reactive anchor positions from store state
const firstTable = computed(() => designStore.tablesMap.get(props.relation.firstTableId));
const secondTable = computed(() => designStore.tablesMap.get(props.relation.secondTableId));

const firstColIndex = computed(() =>
  firstTable.value?.cols.findIndex(c => c.id === props.relation.firstTableColId) ?? -1);
const secondColIndex = computed(() =>
  secondTable.value?.cols.findIndex(c => c.id === props.relation.secondTableColId) ?? -1);

const colAnchorY = (tablePosY: number, colIndex: number) =>
  tablePosY + TABLE_HEADER_HEIGHT + colIndex * TABLE_ROW_HEIGHT + TABLE_ROW_HEIGHT / 2;

const anchor1side = computed<'r' | 'l'>(() =>
  (firstTable.value && secondTable.value && firstTable.value.posX <= secondTable.value.posX)
    ? 'r' : 'l');

const x1 = computed(() => {
  if (!firstTable.value || firstColIndex.value === -1) return 0;
  return anchor1side.value === 'r'
    ? firstTable.value.posX + firstTable.value.widthPx
    : firstTable.value.posX;
});

const y1 = computed(() => {
  if (!firstTable.value || firstColIndex.value === -1) return 0;
  return colAnchorY(firstTable.value.posY, firstColIndex.value);
});

const x2 = computed(() => {
  if (!secondTable.value || secondColIndex.value === -1) return 0;
  const isLeft = anchor1side.value === 'r';
  const baseX = isLeft
    ? secondTable.value.posX
    : secondTable.value.posX + secondTable.value.widthPx;
  return baseX;
});

const y2 = computed(() => {
  if (!secondTable.value || secondColIndex.value === -1) return 0;
  return colAnchorY(secondTable.value.posY, secondColIndex.value);
});

// Make the line come out of the triangle tip / circle center
const x1offset = computed(() =>
  (isManyRelationship.value ? triangleRadius.value : circleRadius.value) *
    (anchor1side.value == 'r' ? -1 : 1));

const trianglePoints = computed(() => {
  if (isManyRelationship.value) {
    const points: string[] = [];
    const baseAngle = anchor1side.value == 'r' ? 0 : Math.PI;
    for (let i = 0; i < 3; i++) {
      const angle = baseAngle + (i * 2 * Math.PI / 3);
      const px = x1.value + triangleRadius.value * Math.cos(angle);
      const py = y1.value + triangleRadius.value * Math.sin(angle);
      points.push(`${px},${py}`);
    }
    return points.join(" ");
  } else {
    return undefined;
  }
});
</script>
