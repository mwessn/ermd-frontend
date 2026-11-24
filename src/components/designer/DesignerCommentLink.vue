<template>
    <g v-if="comment.linkedTo">
      <line
        :x1="commentX"
        :y1="commentY"
        :x2="entityX"
        :y2="entityY"
        :stroke="lineColor"
        :stroke-width="isHighlighted ? 3 : 2"
        :opacity="isHighlighted ? 1 : 0.7"
      />
    </g>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDesignStore } from '@/store/design.ts';
import type { Comment } from '@/types/comments.ts';
import {
  COMMENT_WIDTH,
  TABLE_HEADER_HEIGHT,
  TABLE_ROW_HEIGHT
} from "@/types/constants.ts";

const COMMENT_HEADER_CENTER_Y = 16; // p-1 (4px) + h-6 drag handle (24px) + p-1 (4px) = 32px, center at 16
const GROUP_HEADER_CENTER_Y = 16; // p-2 header ≈ 32px, center at 16

const props = defineProps<{
  comment: Comment;
}>();

const designStore = useDesignStore();

// Highlight when linked table/column is selected
const isHighlighted = computed(() => {
  if (!props.comment.linkedTo) return false;
  if (props.comment.linkedTo.type === 'group') return false;

  if (props.comment.linkedTo.type === 'table') {
    return designStore.selectedTable?.id === props.comment.linkedTo.entityId;
  }

  if (props.comment.linkedTo.type === 'column') {
    const [tableId] = props.comment.linkedTo.entityId.split('.');
    return designStore.selectedTable?.id === tableId;
  }

  return false;
});

const lineColor = computed(() =>
  isHighlighted.value
    ? 'var(--color-monolithicCyanTsunami)'
    : 'var(--color-lycheeIce)');

// Entity anchor position from store state
const entityAnchor = computed(() => {
  if (!props.comment.linkedTo) return undefined;
  const { type, entityId } = props.comment.linkedTo;

  if (type === 'group') {
    const group = designStore.groupsMap.get(entityId);
    if (!group) return undefined;
    return {
      posX: group.posX,
      centerY: group.posY + GROUP_HEADER_CENTER_Y,
      width: group.size.width,
    };
  }

  if (type === 'table') {
    const table = designStore.tablesMap.get(entityId);
    if (!table) return undefined;
    return {
      posX: table.posX,
      centerY: table.posY + TABLE_HEADER_HEIGHT / 2,
      width: table.widthPx,
    };
  }

  if (type === 'column') {
    const [tableId, colId] = entityId.split('.');
    const table = designStore.tablesMap.get(tableId);
    if (!table) return undefined;
    const colIndex = table.cols.findIndex(c => c.id === colId);
    if (colIndex === -1) return undefined;
    return {
      posX: table.posX,
      centerY: table.posY + TABLE_HEADER_HEIGHT + colIndex * TABLE_ROW_HEIGHT + TABLE_ROW_HEIGHT / 2,
      width: table.widthPx,
    };
  }

  return undefined;
});

// Comment anchor: left/right edge at header center
const commentCenterX = computed(() => props.comment.posX + COMMENT_WIDTH / 2);

const commentLeftOfEntity = computed(() => {
  if (!entityAnchor.value) return true;
  return commentCenterX.value < entityAnchor.value.posX + entityAnchor.value.width / 2;
});

const commentX = computed(() =>
  commentLeftOfEntity.value
    ? props.comment.posX + COMMENT_WIDTH
    : props.comment.posX);

const commentY = computed(() =>
  props.comment.posY + COMMENT_HEADER_CENTER_Y);

const entityX = computed(() => {
  if (!entityAnchor.value) return 0;
  return commentLeftOfEntity.value
    ? entityAnchor.value.posX
    : entityAnchor.value.posX + entityAnchor.value.width;
});

const entityY = computed(() => entityAnchor.value?.centerY ?? 0);
</script>
