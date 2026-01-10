<template type="svg">
  <g>
    <line
        ref="lineRef"
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
import { computed, nextTick, onMounted, type PropType, ref, watch } from "vue";
import type { DatabaseRelationship, RelationshipType } from "@/types/relationships.ts";
import { useDesignStore } from "@/store/design.ts";
import type { Table } from "@/types/table.ts";
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
    RELATION_LINE_OFFSET
} from "@/types/constants.ts";

const props = defineProps({
  relation: {
    type: Object as PropType<DatabaseRelationship>,
    required: true
  },
  scaleFactor: {
    type: Number,
    required: true
  },
  offsetX: {
    type: Number,
    required: true
  },
  offsetY: {
    type: Number,
    required: true
  }
});

const nonIdentifyingTypes: RelationshipType[] = [
    'notm',
    'noto'
];

const manyRelationshipTypes: RelationshipType[] = [
    'notm',
    'iotm',
    'mtm'
];

const isManyRelationship = computed(() => manyRelationshipTypes.includes(props.relation.type));

// Increase circle size on zooming out
const circleRadius = computed(() => clamp(
    RELATION_BASE_CIRCLE_SIZE + RELATION_BASE_CIRCLE_SIZE * RELATION_CIRCLE_SIZE_MULTIPLIER * (1 - props.scaleFactor),
    RELATION_BASE_CIRCLE_SIZE,
    RELATION_MAX_CIRCLE_SIZE)
);

// Increase triangle size on zooming out
const triangleRadius = computed(() => clamp(
    RELATION_BASE_TRIANGLE_RADIUS + RELATION_BASE_TRIANGLE_RADIUS * RELATION_TRIANGLE_RADIUS_MULTIPLIER * (1 - props.scaleFactor),
    RELATION_BASE_TRIANGLE_RADIUS,
    RELATION_MAX_TRIANGLE_RADIUS)
);

// Increase line width on zooming out
const lineWidth = computed(() => clamp(
    RELATION_BASE_LINE_WIDTH + RELATION_BASE_LINE_WIDTH * RELATION_LINE_WIDTH_MULTIPLIER * (1 - props.scaleFactor),
    RELATION_BASE_LINE_WIDTH,
    RELATION_MAX_LINE_WIDTH)
);

// Make the line come out of the triangle tip / circle center
const x1offset = computed(() =>
    (isManyRelationship.value ? triangleRadius.value : circleRadius.value) *
    (anchor1side.value == 'r' ? -1 : 1)
);

// Non-identifying are dashed
const lineDash = computed(() => nonIdentifyingTypes.includes(props.relation.type) ? RELATION_DASH_PATTERN : undefined);

const { tables, selectedTable } = storeToRefs(useDesignStore());

const lineColor = computed(() => selectedTable.value && props.relation.firstTableId == selectedTable.value.id ?
    'var(--color-monolithicCyanTsunami)' :
    'var(--color-lycheeIce)'
);

const firstTable = ref<Table>(tables.value.find(it => it.id == props.relation.firstTableId)!)
const secondTable = ref<Table>(tables.value.find(it => it.id == props.relation.secondTableId)!)

const x1 = ref<number>(0);
const y1 = ref<number>(0);
const x2 = ref<number>(0);
const y2 = ref<number>(0);

const trianglePoints = computed(() => {
  if (isManyRelationship.value) {
    const points = [];
    const baseAngle = anchor1side.value == 'r' ? 0 : Math.PI; // 0° or 180°
    for (let i = 0; i < 3; i++) {
      const angle = baseAngle + (i * 2 * Math.PI / 3); // each 120° apart
      const px = x1.value + triangleRadius.value * Math.cos(angle);
      const py = y1.value + triangleRadius.value * Math.sin(angle);
      points.push(`${px},${py}`);
    }

    return points.join(" ");
  } else {
    return undefined;
  }
});

const anchor1side = ref<'r' | 'l'>('r');

const calculateLineCoordinates = () => {
  const firstTableDOM = document.getElementById(`table-${ props.relation.firstTableId }`);
  const secondTableDOM = document.getElementById(`table-${ props.relation.secondTableId }`);

  if (firstTableDOM && secondTableDOM) {
    const firstLeftOfSecond = firstTableDOM.getBoundingClientRect().x <= secondTableDOM.getBoundingClientRect().x;

    anchor1side.value = firstLeftOfSecond ? 'r' : 'l';

    const anchor1 = document.getElementById(`anchor-${ props.relation.firstTableColId }-${ anchor1side.value }`);
    const anchor2 = document.getElementById(`anchor-${ props.relation.secondTableColId }-${ firstLeftOfSecond ? 'l' : 'r' }`);

    if (anchor1 && anchor2) {
      const firstPos = anchor1.getBoundingClientRect();
      x1.value = firstPos.x / props.scaleFactor - props.offsetX;
      y1.value = firstPos.y / props.scaleFactor - props.offsetY;

      const secondPos = anchor2.getBoundingClientRect();
      // Little offset to prevent line corners from sticking out
      x2.value = secondPos.x / props.scaleFactor - props.offsetX + (firstLeftOfSecond ? RELATION_LINE_OFFSET : -RELATION_LINE_OFFSET);
      y2.value = secondPos.y / props.scaleFactor - props.offsetY;
    }
  }
}

watch(
    () => [
        firstTable.value.posX,
        firstTable.value.posY,
        secondTable.value.posX,
        secondTable.value.posY,
        firstTable.value.widthPx,
        secondTable.value.widthPx
    ],
    async () => {
      await nextTick();
      calculateLineCoordinates();
    },
    { deep: true }
);

onMounted(async () => {
  await nextTick();
  calculateLineCoordinates();
})

</script>

<style scoped>

</style>