import type { Comment, CommentLinkedTo, CommentLinkType } from "@/types/comments.ts";
import type { CursorPos } from "@/components/designer/scripts/useDesignCanvas.ts";
import type { DesignState } from "./tables.ts";
import type { BufferEntity } from "@/types/actionsBuffer.ts";
import { generateComment } from "@/types/comments.ts";
import { cloneDeep } from "lodash-es";
import type { useActionBuffer } from "@/store/actionBuffer.ts";

export function createCommentOperations(
  state: () => DesignState,
  stores: {
    bufferStore: ReturnType<typeof useActionBuffer>;
  }
) {
  const addComment = (clickX: number, clickY: number, linkedTo?: CommentLinkedTo) => {
    const comment = generateComment({ x: clickX, y: clickY }, linkedTo);
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
    comment.linkedTo = { type, entityId };
    bufferLogCommentChange(oldVal);
    state().linkingComment.value = undefined;
  };

  /**
   * Move all comments linked to a specific table (or its columns) by delta.
   * Called from moveSelectedTable to keep linked comments in sync.
   */
  const moveCommentsLinkedToTable = (tableId: string, deltaX: number, deltaY: number) => {
    const { comments } = state();
    for (const comment of comments.value) {
      if (!comment.linkedTo) continue;

      if (
        (comment.linkedTo.type === 'table' && comment.linkedTo.entityId === tableId) ||
        (comment.linkedTo.type === 'column' && comment.linkedTo.entityId.startsWith(`${tableId}.`))
      ) {
        comment.posX += deltaX;
        comment.posY += deltaY;
      }
    }
  };

  /**
   * Move all comments linked to a specific group by delta.
   * Called from moveGroup to keep linked comments in sync.
   */
  const moveCommentsLinkedToGroup = (groupId: string, deltaX: number, deltaY: number) => {
    const { comments } = state();
    for (const comment of comments.value) {
      if (!comment.linkedTo) continue;

      if (comment.linkedTo.type === 'group' && comment.linkedTo.entityId === groupId) {
        comment.posX += deltaX;
        comment.posY += deltaY;
      }
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

  return {
    addComment,
    deleteComment,
    unlinkComment,
    linkCommentTo,
    moveCommentsLinkedToTable,
    moveCommentsLinkedToGroup,
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
