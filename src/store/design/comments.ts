import type { Comment, CommentLinkedTo, CommentLinkType } from "@/types/comments.ts";
import type { CursorPos } from "@/components/designer/scripts/useDesignCanvas.ts";
import type { DesignState } from "./tables.ts";
import type { BufferEntity } from "@/types/actionsBuffer.ts";
import { generateComment } from "@/types/comments.ts";
import { cloneDeep } from "lodash";
import type { useActionBuffer } from "@/store/actionBuffer.ts";
import { watch } from "vue";

export function createCommentOperations(
  state: () => DesignState,
  stores: {
    bufferStore: ReturnType<typeof useActionBuffer>;
  }
) {
  const addComment = (clickX: number, clickY: number, linkedTo?: CommentLinkedTo) => {
    const posX = clickX;
    const posY = clickY;

    if (linkedTo) {
      const parent = getLinkedEntity(linkedTo);
      if (parent) {
        const isOnLeft = posX < parent.posX + parent.width / 2;
        linkedTo.offsetX = isOnLeft
          ? posX - parent.posX
          : posX - parent.posX - parent.width;
        linkedTo.offsetY = posY - parent.posY;
      }
    }

    const comment = generateComment({ x: posX, y: posY }, linkedTo);
    state().commentsMap.value.set(comment.id, comment);
    bufferLogCommentCreate(comment.id);
  };

  const deleteComment = (commentId: string) => {
    const comment = state().commentsMap.value.get(commentId);
    if (comment) {
      bufferLogCommentDelete(comment);
      state().commentsMap.value.delete(commentId);
    }
  };

  const unlinkComment = (commentId: string) => {
    const comment = state().commentsMap.value.get(commentId);
    if (comment && comment.linkedTo) {
      const oldVal = cloneDeep(comment);
      comment.linkedTo = null;
      bufferLogCommentChange(oldVal);
    }
  };

  const linkCommentTo = (type: CommentLinkType, entityId: string) => {
    const comment = state().linkingComment.value;
    if (!comment) return;

    const oldVal = cloneDeep(comment);
    const linkedTo: CommentLinkedTo = { type, entityId, offsetX: 0, offsetY: 0 };
    const parent = getLinkedEntity(linkedTo);

    if (parent) {
      const isOnLeft = comment.posX < parent.posX + parent.width / 2;
      linkedTo.offsetX = isOnLeft
        ? comment.posX - parent.posX
        : comment.posX - parent.posX - parent.width;
      linkedTo.offsetY = comment.posY - parent.posY;
    }

    comment.linkedTo = linkedTo;
    bufferLogCommentChange(oldVal);
    state().linkingComment.value = undefined;
  };

  const updateCommentPosition = (commentId: string, newX: number, newY: number) => {
    const comment = state().commentsMap.value.get(commentId);
    if (!comment) return;

    const oldVal: CursorPos = {
      x: comment.posX,
      y: comment.posY
    };

    comment.posX = newX;
    comment.posY = newY;

    // If linked, recalculate offsetX/offsetY from parent
    if (comment.linkedTo) {
      const parent = getLinkedEntity(comment.linkedTo);
      if (parent) {
        // Determine which side the comment is on
        const isOnLeft = newX < parent.posX + parent.width / 2;

        if (isOnLeft) {
          // Left side: offset from left edge
          comment.linkedTo.offsetX = newX - parent.posX;
        } else {
          // Right side: offset from right edge
          comment.linkedTo.offsetX = newX - parent.posX - parent.width;
        }
        comment.linkedTo.offsetY = newY - parent.posY;
      }
    }

    bufferLogCommentMove(oldVal, commentId);
  };

  const syncLinkedCommentPosition = (comment: Comment) => {
    if (!comment.linkedTo) return;

    const parent = getLinkedEntity(comment.linkedTo);
    if (parent) {
      // Determine which side the comment is on based on current position
      const isOnLeft = comment.posX < parent.posX + parent.width / 2;

      if (isOnLeft) {
        // Left side: position relative to left edge (offset is from left edge)
        comment.posX = parent.posX + comment.linkedTo.offsetX;
      } else {
        // Right side: position relative to right edge (offset is from right edge)
        comment.posX = parent.posX + parent.width + comment.linkedTo.offsetX;
      }
      comment.posY = parent.posY + comment.linkedTo.offsetY;
    }
  };

  const getLinkedEntity = (linkedTo: CommentLinkedTo) => {
    const { groupsMap, tablesMap } = state();

    switch (linkedTo.type) {
      case 'group': {
        const group = groupsMap.value.get(linkedTo.entityId);
        return group ? {
          posX: group.posX,
          posY: group.posY,
          width: group.size.width
        } : null;
      }
      case 'table': {
        const table = tablesMap.value.get(linkedTo.entityId);
        if (!table) return null;

        return {
          posX: table.posX,
          posY: table.posY,
          width: table.widthPx
        };
      }
      case 'column': {
        const [tableId] = linkedTo.entityId.split('.');
        const table = tablesMap.value.get(tableId);
        if (!table) return null;

        return {
          posX: table.posX,
          posY: table.posY,
          width: table.widthPx
        };
      }
      default:
        return null;
    }
  };

  // Buffer actions

  function bufferRestoreComment(entry: BufferEntity) {
    const comment = cloneDeep(entry.oldVal as Comment);
    state().commentsMap.value.set(comment.id, comment);
    entry.oldVal = undefined;
  }

  function bufferDeleteComment(entry: BufferEntity) {
    const comment = state().commentsMap.value.get(entry.entityId);
    if (comment) {
      entry.oldVal = cloneDeep(comment);
      state().commentsMap.value.delete(entry.entityId);
    }
  }

  function bufferSetCommentVal(entry: BufferEntity) {
    const existingComment = state().commentsMap.value.get(entry.entityId);
    if (existingComment) {
      const oldVal = cloneDeep(existingComment);
      const newComment = cloneDeep(entry.oldVal as Comment);
      state().commentsMap.value.set(entry.entityId, newComment);
      entry.oldVal = oldVal;
    }
  }

  function bufferSetCommentPos(entry: BufferEntity) {
    const comment = state().commentsMap.value.get(entry.entityId);
    if (comment) {
      const oldVal: CursorPos = {
        x: comment.posX,
        y: comment.posY
      };

      const bufferPos = cloneDeep(entry.oldVal as CursorPos);

      comment.posX = bufferPos.x;
      comment.posY = bufferPos.y;

      // Recalculate offsets if linked
      if (comment.linkedTo) {
        const parent = getLinkedEntity(comment.linkedTo);
        if (parent) {
          // Determine which side the comment is on
          const isOnLeft = comment.posX < parent.posX + parent.width / 2;

          if (isOnLeft) {
            // Left side: offset from left edge
            comment.linkedTo.offsetX = comment.posX - parent.posX;
          } else {
            // Right side: offset from right edge
            comment.linkedTo.offsetX = comment.posX - parent.posX - parent.width;
          }
          comment.linkedTo.offsetY = comment.posY - parent.posY;
        }
      }

      entry.oldVal = oldVal;
    }
  }

  // Buffer loggers

  function bufferLogCommentCreate(commentId: string) {
    stores.bufferStore.addUndoBufferAction({
      entities: [{
        action: 'create',
        type: "comment",
        entityId: commentId,
        oldVal: undefined,
      }]
    });
  }

  function bufferLogCommentDelete(comment: Comment) {
    stores.bufferStore.addUndoBufferAction({
      entities: [{
        action: 'delete',
        type: "comment",
        entityId: comment.id,
        oldVal: cloneDeep(comment),
      }]
    });
  }

  function bufferLogCommentChange(oldVal: Comment) {
    stores.bufferStore.addUndoBufferAction({
      entities: [{
        action: 'change',
        type: "comment",
        entityId: oldVal.id,
        oldVal: oldVal,
      }]
    });
  }

  function bufferLogCommentMove(oldVal: CursorPos, commentId: string) {
    stores.bufferStore.addUndoBufferAction({
      entities: [{
        action: 'move',
        type: "comment",
        entityId: commentId,
        oldVal: cloneDeep(oldVal),
      }]
    });
  }

  // Watch entity positions and sync linked comments
  watch(
    () => {
      const { tables, groups, comments } = state();
      return [
        ...tables.value.map(t => ({ id: t.id, posX: t.posX, posY: t.posY, widthPx: t.widthPx })),
        ...groups.value.map(g => ({ id: g.id, posX: g.posX, posY: g.posY, width: g.size.width })),
        comments.value.length // Also watch when comments are added/removed
      ];
    },
    () => {
      const { comments } = state();
      // Sync all linked comments with their parent entities
      comments.value
        .filter(c => c.linkedTo)
        .forEach(syncLinkedCommentPosition);
    },
    { deep: true }
  );

  return {
    addComment,
    deleteComment,
    unlinkComment,
    linkCommentTo,
    updateCommentPosition,
    syncLinkedCommentPosition,
    getLinkedEntity,
    bufferRestoreComment,
    bufferDeleteComment,
    bufferSetCommentVal,
    bufferSetCommentPos,
    bufferLogCommentCreate,
    bufferLogCommentDelete,
    bufferLogCommentChange,
    bufferLogCommentMove,
  };
}
