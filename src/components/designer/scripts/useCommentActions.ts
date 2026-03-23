import { useActionsStore } from "@/store/action.ts";
import { useDesignStore } from "@/store/design.ts";
import { storeToRefs } from "pinia";
import { cloneDeep } from "lodash-es";
import { resetFocus } from "@/utils/utils.ts";

export function useCommentActions() {
  const actionStore = useActionsStore();
  const designStore = useDesignStore();
  const { linkingComment } = storeToRefs(designStore);

  const handleEntityClick = (
    evt: MouseEvent,
    entityType: 'column' | 'table' | 'group',
    entityId: string
  ) => {
    // Only handle if we're in comment or linkComment mode
    if (actionStore.currentAction !== 'comment' && actionStore.currentAction !== 'linkComment') {
      return false;
    }

    // Stop propagation to prevent parent handlers from firing
    evt.stopPropagation();

    const clickX = evt.clientX;
    const clickY = evt.clientY;

    if (actionStore.currentAction === 'comment') {
      // Create comment linked to entity
      designStore.addComment(
        clickX,
        clickY,
        {
          type: entityType,
          entityId: entityId,
          offsetX: 0,
          offsetY: 0
        }
      );
      resetFocus();
      actionStore.setAction(undefined);
      return true;
    } else if (actionStore.currentAction === 'linkComment' && linkingComment.value) {
      // Link existing comment to entity
      const oldVal = cloneDeep(linkingComment.value);
      const parent = designStore.getLinkedEntity?.({
        type: entityType,
        entityId: entityId,
        offsetX: 0,
        offsetY: 0
      });
      if (parent) {
        const isOnLeft = linkingComment.value.posX < parent.posX + parent.width / 2;
        linkingComment.value.linkedTo = {
          type: entityType,
          entityId: entityId,
          offsetX: isOnLeft
            ? linkingComment.value.posX - parent.posX
            : linkingComment.value.posX - parent.posX - parent.width,
          offsetY: linkingComment.value.posY - parent.posY
        };
        designStore.bufferLogCommentChange(oldVal);
      }
      resetFocus();
      designStore.setLinkingComment(undefined);
      actionStore.setAction(undefined);
      return true;
    }
    return false;
  };

  return {
    handleEntityClick
  };
}
