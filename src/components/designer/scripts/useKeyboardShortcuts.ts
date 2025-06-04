
import { onMounted, onUnmounted } from 'vue';
import { useActionsStore } from '@/store/action.ts';
import type { UserAction } from "@/types/actions.ts";
import { useDesignStore } from "@/store/design.ts";
import { resetFocus } from "@/utils/utils.ts";
import { useActionBuffer } from "@/store/actionBuffer.ts";

export function useKeyboardShortcuts(centerView: () => void) {
    const actionsStore = useActionsStore();
    const designStore = useDesignStore();
    const bufferStore = useActionBuffer();

    const setAction = (val: UserAction) => {
        actionsStore.setAction(val);
    };

    const onKeydown = (evt: KeyboardEvent) => {
        const key = evt.key.toLowerCase();
        if (!evt.ctrlKey) {
            switch (key) {
                case 'escape':
                    // Esc - reset actions and focus
                    setAction(undefined);
                    resetFocus();
                    break;
                case 't':
                    // T = table creation mode
                    setAction('table');
                    break;
                case 'b':
                    // B - one-to-one relation creation mode
                    setAction('oto');
                    break;
                case 'n':
                    // N - one-to-many relation creation mode
                    setAction('otm');
                    break;
                case 'm':
                    // M - many-to-many relation creation mode
                    setAction('mtm');
                    break;
                case 'c':
                    // C - comment area creation mode
                    setAction('commentArea');
                    break;
                case 'x':
                    // X - center canvas view
                    centerView();
                    break;
                case 'delete':
                    // Del - delete selected entity
                    designStore.deleteSelectedTable();
                    resetFocus();
                    break;
            }
        } else {
            if (evt.shiftKey && key == 'z') {
                // Ctrl + Shift + Z = redo
                evt.preventDefault();
                bufferStore.redo();
                return;
            } else {
                switch (key) {
                    case 'c':
                        // Ctrl + C = copy
                        console.log('copy');
                        break;
                    case 'v':
                        // Ctrl + V = paste
                        console.log('paste');
                        break;
                    case 'z':
                        // Ctrl + Z = undo
                        evt.preventDefault();
                        bufferStore.undo();
                        break;
                    case 'y':
                        // Ctrl + Y = redo
                        evt.preventDefault();
                        bufferStore.redo();
                        break;
                }
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
