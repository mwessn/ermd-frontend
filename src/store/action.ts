import { defineStore } from "pinia";
import { ref } from "vue";
import type { userAction } from "@/types/actions.ts";

export const useActionsStore = defineStore('actions', () => {
    const currentAction = ref<userAction>(undefined);

    const setAction = (val: userAction) => {
        currentAction.value = val;
    }

    return {
        currentAction,

        setAction,
    }
});