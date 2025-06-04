import { defineStore } from "pinia";
import { defaultSettings } from "@/types/misc.ts";
import { ref } from "vue";
import type { ActionBufferEntry } from "@/types/actionsBuffer.ts";
import { useDesignStore } from "@/store/design.ts";

export const useActionBuffer = defineStore('actionBuffer', () => {
    // TODO add settings store
    const maxBufferSize = defaultSettings.undoActionBufferSize;

    const undoBuffer = ref<ActionBufferEntry[]>([]);
    const redoBuffer = ref<ActionBufferEntry[]>([]);

    const designStore = useDesignStore();

    const addUndoBufferAction = (action: ActionBufferEntry) => {
        redoBuffer.value = [];
        undoBuffer.value.push({ ...action });

        if (undoBuffer.value.length > maxBufferSize) {
            undoBuffer.value.shift();
        }
    }

    const undo = () => {
        const entry = undoBuffer.value.pop();
        if (entry) {
            const reverted = revertAction(entry);
            if (reverted) {
                redoBuffer.value.push(entry);
            }
        }

    };

    const redo = () => {
        const entry = redoBuffer.value.pop();
        if (entry) {
            const reexecuted = restoreAction(entry);
            if (reexecuted) {
                undoBuffer.value.push(entry);
            }
        }

    };

    const clearState = () => {
        redoBuffer.value = [];
        undoBuffer.value = [];
    }

    const revertAction = (entry: ActionBufferEntry): boolean => {
        let reverted = false;
        entry.entities.forEach((entity) => {
            switch (entity.type) {
                case "table": {
                    switch (entry.action) {
                        case "create": {
                            designStore.bufferDeleteTable(entity);
                            break;
                        }
                        case "delete": {
                            // Prevent restored table name input focus
                            designStore.isManualCreation = false;
                            designStore.bufferRestoreTable(entity);
                            break;
                        }
                        case "move": {
                            designStore.bufferSetTablePos(entity);
                            break;
                        }
                    }
                    reverted = true;
                }
            }
        });
        return reverted;
    };

    const restoreAction = (entry: ActionBufferEntry): boolean => {
        let restored = false;
        entry.entities.forEach((entity) => {
            switch (entity.type) {
                case "table": {
                    switch (entry.action) {
                        case "create": {
                            // Prevent restored table name input focus
                            designStore.isManualCreation = false;
                            designStore.bufferRestoreTable(entity);
                            break;
                        }
                        case "delete": {
                            designStore.bufferDeleteTable(entity);
                            break;
                        }
                        case "move": {
                            designStore.bufferSetTablePos(entity);
                            break;
                        }
                    }
                    restored = true;
                }
            }
        })

        return restored;

    }

    return {
        addUndoBufferAction,
        undo,
        redo,
        clearState,
    };
})