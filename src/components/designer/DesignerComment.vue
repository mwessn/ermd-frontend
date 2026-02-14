<template>
    <div
      :id="`comment-${comment.id}`"
      ref="commentRef"
      class="absolute rounded-lg overflow-hidden"
      :class="[
        COMMENT_SIZE_CLASSES,
        { 'ring-2 ring-blue-500': isSelected || isLinkedEntitySelected }
      ]"
      :style="{
        top: comment.posY + 'px',
        left: comment.posX + 'px',
        backgroundColor: comment.color,
        borderWidth: '2px',
        borderStyle: 'solid',
        borderColor: getBorderColor(),
        zIndex: isSelected ? 60 : 50
      }"
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-1 bg-black/20 relative">
        <div class="flex items-center gap-2">
          <!-- Link button (only for standalone comments) -->
          <FontAwesomeIcon
            v-if="!comment.linkedTo"
            :icon="faLink"
            class="cursor-pointer text-xs hover:text-blue-400"
            title="Link to entity (click here, then click table/group/column)"
            @click.stop="onStartLinking"
          />

          <!-- Linked indicator (only show if linked) -->
          <FontAwesomeIcon
            v-if="comment.linkedTo"
            :icon="faLink"
            class="text-blue-400 text-xs"
            title="Linked comment"
          />

          <!-- Unlink button (only for linked comments) -->
          <FontAwesomeIcon
            v-if="comment.linkedTo"
            :icon="faLinkSlash"
            class="cursor-pointer text-xs hover:text-red-400"
            title="Unlink from entity"
            @click.stop="onUnlink"
          />
        </div>

        <div class="flex items-center gap-2">
          <!-- Delete button -->
          <FontAwesomeIcon
            :icon="faTrashCan"
            class="cursor-pointer text-xs hover:text-red-400"
            title="Delete comment"
            @click.stop="onDelete"
          />

          <!-- Drag handle -->
          <div
            class="h-4 w-4 bg-black/20 radial-accentGray cursor-move"
            title="Drag to move comment"
            @mousedown.left="onMouseDown"
          />
        </div>

        <!-- Left/right anchors for comment links -->
        <div class="absolute inset-0 flex items-center justify-between pointer-events-none">
          <div :id="`anchor-comment-${comment.id}-l`" class="w-0 h-0" />
          <div :id="`anchor-comment-${comment.id}-r`" class="w-0 h-0" />
        </div>
      </div>

      <!-- Text area (auto-sizes within constraints) -->
      <textarea
        v-model="commentText"
        placeholder="Enter comment..."
        class="w-full h-full p-2 bg-transparent resize-none outline-none"
        @input="onTextChange"
        @mousedown.stop
      />
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faLink, faLinkSlash, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { COMMENT_SIZE_CLASSES } from '@/types/constants.ts';
import { useDesignStore } from '@/store/design.ts';
import { useActionsStore } from '@/store/action.ts';
import type { Comment } from '@/types/comments.ts';
import { cloneDeep } from 'lodash';

const props = defineProps<{
  comment: Comment;
}>();

const designStore = useDesignStore();
const actionsStore = useActionsStore();

const commentRef = ref<HTMLDivElement>();
const commentText = ref(props.comment.text);

// Sync with prop changes (for undo/redo)
watch(() => props.comment.text, (newText) => {
  commentText.value = newText;
});

const isSelected = computed(() => {
  return designStore.movedComment?.id === props.comment.id;
});

// Highlight when linked table/column is selected (NOT for groups)
const isLinkedEntitySelected = computed(() => {
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

function getBorderColor(): string {
  if (isLinkedEntitySelected.value) return '#3b82f6'; // Highlight color
  if (props.comment.linkedTo) return '#3b82f6'; // Linked (blue)
  return '#6b7280'; // Standalone (gray)
}

function onMouseDown() {
  designStore.setMovedComment(props.comment);
  // Drag handling will be implemented via parent component (DesignCanvas)
}

function onUnlink() {
  designStore.unlinkComment(props.comment.id);
}

function onStartLinking() {
  // Set this comment as the one being linked and set action to linkComment
  designStore.setLinkingComment(props.comment);
  actionsStore.setAction('linkComment');
}

function onDelete() {
  designStore.deleteComment(props.comment.id);
}

function onTextChange() {
  const oldVal = cloneDeep(props.comment);
  // Update the comment in the store directly
  const comment = designStore.commentsMap.get(props.comment.id);
  if (comment) {
    comment.text = commentText.value;
    designStore.bufferLogCommentChange(oldVal);
  }
}
</script>
