import { defineStore } from "pinia";
import { ref } from "vue";
import type { UserAction } from "@/types/actions.ts";

export const useActionsStore = defineStore('actions', () => {
    const currentAction = ref<UserAction>(undefined);

    const setAction = (val: UserAction) => {
        currentAction.value = val;
    }

    return {
        currentAction,

        setAction,
    }
});