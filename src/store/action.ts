import { defineStore } from "pinia";
import { ref } from "vue";
import type { UserAction } from "@/types/actions.ts";

export const useActionsStore = defineStore('actions', () => {

    const currentAction = ref<UserAction>(undefined);
    const canSetAction = ref<boolean>(true);

    const setAction = (val: UserAction) => {
        if (canSetAction) {
            currentAction.value = val;
        }
    }

    const allowAction = (allow: boolean = true) => {
        canSetAction.value = allow;
    }

    return {
        currentAction,

        setAction,
        allowAction,
    }
});