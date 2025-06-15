<template type="svg">
  <line
      ref="lineRef"
      :stroke-width="lineWidth"
      :stroke="lineColor"
      :x1="x1"
      :y1="y1"
      :x2="x2"
      :y2="y2"
      tabindex="-1"
      @mousedown="console.log('mouse')"
      @focus="console.log('focus')"
      @mousever="console.log('hover')"
  />
  <circle
    :r="circleRadius"
    :cx="x1"
    :cy="y1"
    :fill="lineColor"
  />
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, type PropType, ref, useTemplateRef, watch } from "vue";
import type { DatabaseRelationship } from "@/types/relationships.ts";
import { useDesignStore } from "@/store/design.ts";
import type { Table } from "@/types/table.ts";
import { clamp } from "@/utils/utils.ts";

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

const baseCircleSize = 6;
const circleSizeMultiplier = 1.4;
const maxCircleSize = 16;

// Increase circle size on zooming out
const circleRadius = computed(() => clamp(
    baseCircleSize + baseCircleSize * circleSizeMultiplier * (1 - props.scaleFactor),
    baseCircleSize,
    maxCircleSize)
);

const baseLineWidth = 3;
const lineWidthMultiplier = 1.4;
const maxLineWidth = 8;

// Increase circle size on zooming out
const lineWidth = computed(() => clamp(
    baseLineWidth + baseLineWidth * lineWidthMultiplier * (1 - props.scaleFactor),
    baseLineWidth,
    maxLineWidth)
);

const { tables } = useDesignStore();

const lineRef = useTemplateRef('lineRef');

const lineColor = computed(() => ['noto', 'notm'].includes(props.relation.type) ? 'var(--color-lycheeIce)' : 'var(--color-monolithicCyanTsunami)');

const firstTable = ref<Table>(tables.find(it => it.id == props.relation.firstTableId)!)
const secondTable = ref<Table>(tables.find(it => it.id == props.relation.secondTableId)!)

const x1 = ref<number>(0);
const y1 = ref<number>(0);
const x2 = ref<number>(0);
const y2 = ref<number>(0);

const calculateLineCoordinates = () => {
  const firstTableDOM = document.getElementById(`table-${ props.relation.firstTableId }`);
  const secondTableDOM = document.getElementById(`table-${ props.relation.secondTableId }`);

  if (firstTableDOM && secondTableDOM) {
    const firstLeftOfSecond = firstTableDOM.getBoundingClientRect().x <= secondTableDOM.getBoundingClientRect().x

    const anchor1 = document.getElementById(`anchor-${ props.relation.firstTableColId }-${ firstLeftOfSecond ? 'r' : 'l' }`);
    const anchor2 = document.getElementById(`anchor-${ props.relation.secondTableColId }-${ firstLeftOfSecond ? 'l' : 'r' }`);

    // Little offset to prevent line corners from sticking out
    const offsetPx = 5;

    if (anchor1 && anchor2) {
      const firstPos = anchor1.getBoundingClientRect();
      x1.value = firstPos.x / props.scaleFactor - props.offsetX;
      y1.value = firstPos.y / props.scaleFactor - props.offsetY;

      const secondPos = anchor2.getBoundingClientRect();
      x2.value = secondPos.x / props.scaleFactor - props.offsetX + (firstLeftOfSecond ? offsetPx : -offsetPx);
      y2.value = secondPos.y / props.scaleFactor - props.offsetY;
    }
  }
}

watch(
    () => [
        firstTable.value.posX,
        firstTable.value.posY,
        secondTable.value.posX,
        secondTable.value.posY
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