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
        { type: entityType, entityId }
      );
      resetFocus();
      actionStore.setAction(undefined);
      return true;
    } else if (actionStore.currentAction === 'linkComment' && linkingComment.value) {
      // Link existing comment to entity
      const oldVal = cloneDeep(linkingComment.value);
      linkingComment.value.linkedTo = { type: entityType, entityId };
      designStore.bufferLogCommentChange(oldVal);
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
