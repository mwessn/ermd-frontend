import { defineStore } from "pinia";
import { ref } from "vue";
import type { UserAction } from "@/types/actions.ts";
import { useDesignStore } from "@/store/design.ts";

const RELATION_ACTIONS: UserAction[] = ['noto', 'ioto', 'notm', 'iotm', 'mtm'];

export const useActionsStore = defineStore('actions', () => {

  const designStore = useDesignStore();

  const currentAction = ref<UserAction>(undefined);
  const canSetAction = ref<boolean>(true);

  const setAction = (val: UserAction) => {
    if (canSetAction.value) {
      // Preserve first table selection when switching between relation types
      if (!val || !RELATION_ACTIONS.includes(val) || !RELATION_ACTIONS.includes(currentAction.value)) {
        designStore.resetRelationshipCreation();
      }
      currentAction.value = val;
    }
  };

  const resetAction = () => {
    currentAction.value = undefined;
    designStore.resetRelationshipCreation();
  };

  const allowAction = (allow: boolean = true) => {
    canSetAction.value = allow;
  };

  return {
    currentAction,

    setAction,
    resetAction,
    allowAction,
  };
});