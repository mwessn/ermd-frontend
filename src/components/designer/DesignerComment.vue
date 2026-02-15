<template>
    <div
      :id="`comment-${comment.id}`"
      ref="commentRef"
      class="absolute rounded-lg overflow-hidden
            slashed-accentDarkGray text-lycheeIce
            border border-accentDarkGray"
      :class="[
        COMMENT_SIZE_CLASSES,
        { 'ring-2 ring-monolithicCyanTsunami': isSelected || isLinkedEntitySelected }
      ]"
      :style="{
        top: comment.posY + 'px',
        left: comment.posX + 'px',
        zIndex: isSelected ? 60 : 50
      }"
    >
      <!-- Header -->
      <div
          class="flex items-center
              justify-between p-1
            bg-accentDarkGray relative"
      >
        <div class="flex items-center gap-2">
          <!-- Link button -->
          <FontAwesomeIcon
            v-if="!comment.linkedTo"
            :icon="faLink"
            class="cursor-pointer text-xs hover:opacity-60"
            title="Link to entity"
            @click.stop="onStartLinking"
          />

          <!-- Unlink button -->
          <FontAwesomeIcon
            v-if="comment.linkedTo"
            :icon="faLinkSlash"
            class="cursor-pointer text-xs hover:opacity-60"
            title="Unlink from entity"
            @click.stop="onUnlink"
          />
        </div>

        <div class="flex items-center gap-2">
          <!-- Delete button -->
          <FontAwesomeIcon
            :icon="faTrashCan"
            class="cursor-pointer text-xs hover:opacity-60"
            title="Delete comment"
            @click.stop="onDelete"
          />

          <!-- Drag handle -->
          <div
            class="h-6 w-6 radial-accentGray cursor-move"
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

      <!-- Comment body -->
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
