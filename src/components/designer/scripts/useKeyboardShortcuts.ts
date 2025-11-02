
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
        if (!val) {
            designStore.resetCreatingCommentArea();
        }
    };

    const onKeydown = (evt: KeyboardEvent) => {
        // If target is an input, ignore shortcuts
        if (!(evt.target instanceof HTMLInputElement)) {
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
                    case 'g':
                        // G - Non-identifying one-to-one relation creation mode
                        setAction('noto');
                        break;
                    case 'b':
                        // B - Identifying one-to-one relation creation mode
                        setAction('ioto');
                        break;
                    case 'h':
                        // H - Non-identifying one-to-many relation creation mode
                        setAction('notm');
                        break;
                    case 'n':
                        // N - Identifying one-to-many relation creation mode
                        setAction('iotm');
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
                evt.preventDefault();
                if (evt.shiftKey && key == 'z') {
                    // Ctrl + Shift + Z = redo
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
                            bufferStore.undo();
                            break;
                        case 'y':
                            // Ctrl + Y = redo
                            bufferStore.redo();
                            break;
                        case 's':
                            // Ctrl + S = save as JSON
                            console.log('Save');
                            break;
                    }
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
