
import { onMounted, onUnmounted } from 'vue';
import { useActionsStore } from '@/store/action.ts';
import type { UserAction } from "@/types/actions.ts";
import { useDesignStore } from "@/store/design.ts";
import { resetFocus } from "@/utils/utils.ts";

export function useKeyboardShortcuts(centerView: () => void) {
    const actionsStore = useActionsStore();
    const designStore = useDesignStore();

    const setAction = (val: UserAction) => {
        actionsStore.setAction(val);
    };

    const onKeydown = (evt: KeyboardEvent) => {
        const key = evt.key.toLowerCase();
        if (!evt.ctrlKey) {
            switch (key) {
                case 'escape':
                    setAction(undefined);
                    break;
                case 't':
                    setAction('table');
                    break;
                case 'b':
                    setAction('oto');
                    break;
                case 'n':
                    setAction('otm');
                    break;
                case 'm':
                    setAction('mtm');
                    break;
                case 'c':
                    setAction('comment');
                    break;
                case 'x':
                    centerView();
                    break;
                case 'delete':
                    designStore.deleteSelectedTable();
                    resetFocus();
                    break;
            }
        } else {
            switch (key) {
                case 'c':
                    console.log('copy');
                    break;
                case 'v':
                    console.log('paste');
                    break;
            }
        }
    };

    onMounted(() => {
        window.addEventListener('keydown', onKeydown);
    });

    onUnmounted(() => {
        window.removeEventListener('keydown', onKeydown);
    });

    return {
        setAction,
    }
}
