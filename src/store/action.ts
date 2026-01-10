import { defineStore } from "pinia";
import { ref } from "vue";
import type { UserAction } from "@/types/actions.ts";
import { useDesignStore } from "@/store/design.ts";

export const useActionsStore = defineStore('actions', () => {

  const designStore = useDesignStore();

  const currentAction = ref<UserAction>(undefined);
  const canSetAction = ref<boolean>(true);

  const setAction = (val: UserAction) => {
    if (canSetAction.value) {
      currentAction.value = val;
      designStore.resetRelationshipCreation();
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