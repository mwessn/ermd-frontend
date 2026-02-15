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
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useDesignStore } from '@/store/design.ts';
import type { Comment } from '@/types/comments.ts';

const props = defineProps<{
  comment: Comment;
  scaleFactor: number;
  offsetX: number;
  offsetY: number;
}>();

const designStore = useDesignStore();

const commentX = ref(0);
const commentY = ref(0);
const entityX = ref(0);
const entityY = ref(0);

// Highlight when linked table/column is selected
const isHighlighted = computed(() => {
  if (!props.comment.linkedTo) return false;

  // Groups don't highlight
  if (props.comment.linkedTo.type === 'group') return false;

  // Check if linked table is selected
  if (props.comment.linkedTo.type === 'table') {
    return designStore.selectedTable?.id === props.comment.linkedTo.entityId;
  }

  // Check if linked column's table is selected
  if (props.comment.linkedTo.type === 'column') {
    const [tableId] = props.comment.linkedTo.entityId.split('.');
    return designStore.selectedTable?.id === tableId;
  }

  return false;
});

const lineColor = computed(() =>
    isHighlighted.value ?
        'var(--color-monolithicCyanTsunami)' :
        'var(--color-lycheeIce)'
);

function updateCoordinates() {
  if (!props.comment.linkedTo) return;

  // Get entity element to determine relative positions
  let entityEl: HTMLElement | null = null;
  switch (props.comment.linkedTo.type) {
    case 'group':
      entityEl = document.getElementById(`group-header-${props.comment.linkedTo.entityId}`);
      break;
    case 'table':
      entityEl = document.getElementById(`table-header-${props.comment.linkedTo.entityId}`);
      break;
    case 'column': {
      const [, colId] = props.comment.linkedTo.entityId.split('.');
      entityEl = document.getElementById(`col-${colId}`);
      break;
    }
  }

  if (!entityEl) return;

  const commentEl = document.getElementById(`comment-${props.comment.id}`);
  if (!commentEl) return;

  const entityRect = entityEl.getBoundingClientRect();
  const commentRect = commentEl.getBoundingClientRect();

  const entityCenterX = entityRect.left + entityRect.width / 2;
  const commentCenterX = commentRect.left + commentRect.width / 2;

  // Determine which side the comment is on relative to entity
  const commentLeftOfEntity = commentCenterX < entityCenterX;

  // Use the comment anchor that faces the entity
  const commentAnchorSide = commentLeftOfEntity ? '-r' : '-l';
  const commentAnchor = document.getElementById(`anchor-comment-${props.comment.id}${commentAnchorSide}`);

  // Use the entity anchor that faces the comment
  const entityAnchorSide = commentLeftOfEntity ? '-l' : '-r';
  const entityAnchorId = getEntityAnchorId(props.comment.linkedTo, entityAnchorSide);
  const entityAnchor = document.getElementById(entityAnchorId);

  if (!commentAnchor || !entityAnchor) return;

  const commentAnchorRect = commentAnchor.getBoundingClientRect();
  commentX.value = commentAnchorRect.left / props.scaleFactor - props.offsetX;
  commentY.value = commentAnchorRect.top / props.scaleFactor - props.offsetY;

  const entityAnchorRect = entityAnchor.getBoundingClientRect();
  entityX.value = entityAnchorRect.left / props.scaleFactor - props.offsetX;
  entityY.value = entityAnchorRect.top / props.scaleFactor - props.offsetY;
}

function getEntityAnchorId(linkedTo: { type: string; entityId: string }, side: string): string {
  switch (linkedTo.type) {
    case 'group':
      return `anchor-group-${linkedTo.entityId}${side}`;
    case 'table':
      return `anchor-table-${linkedTo.entityId}${side}`;
    case 'column': {
      const [, colId] = linkedTo.entityId.split('.');
      return `anchor-${colId}${side}`;
    }
    default:
      return '';
  }
}

// Watch for position changes
watch(
  () => [
    props.comment.posX,
    props.comment.posY,
    props.scaleFactor,
    props.offsetX,
    props.offsetY,
    // Watch entity positions based on type
    ...(props.comment.linkedTo?.type === 'table' || props.comment.linkedTo?.type === 'column'
      ? [designStore.tables.find(t => {
        if (props.comment.linkedTo?.type === 'table') {
          return t.id === props.comment.linkedTo.entityId;
        } else {
          const [tableId] = props.comment.linkedTo!.entityId.split('.');
          return t.id === tableId;
        }
      })?.posX,
      designStore.tables.find(t => {
        if (props.comment.linkedTo?.type === 'table') {
          return t.id === props.comment.linkedTo.entityId;
        } else {
          const [tableId] = props.comment.linkedTo!.entityId.split('.');
          return t.id === tableId;
        }
      })?.posY,
      designStore.tables.find(t => {
        if (props.comment.linkedTo?.type === 'table') {
          return t.id === props.comment.linkedTo.entityId;
        } else {
          const [tableId] = props.comment.linkedTo!.entityId.split('.');
          return t.id === tableId;
        }
      })?.widthPx]
      : []),
    ...(props.comment.linkedTo?.type === 'group'
      ? [designStore.groups.find(g => g.id === props.comment.linkedTo!.entityId)?.posX,
        designStore.groups.find(g => g.id === props.comment.linkedTo!.entityId)?.posY,
        designStore.groups.find(g => g.id === props.comment.linkedTo!.entityId)?.size.width]
      : [])
  ],
  async () => {
    await nextTick();
    updateCoordinates();
  },
  { deep: true, immediate: true }
);

// Also update on mount
onMounted(async () => {
  await nextTick();
  updateCoordinates();
});
</script>
