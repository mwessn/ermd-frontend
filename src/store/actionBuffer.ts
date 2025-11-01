import { defineStore } from "pinia";
import { defaultSettings } from "@/types/misc.ts";
import { ref } from "vue";
import type { ActionBufferEntry, BufferEntity } from "@/types/actionsBuffer.ts";
import { useDesignStore } from "@/store/design.ts";
import { cloneDeep } from "lodash";

export const useActionBuffer = defineStore('actionBuffer', () => {
    // TODO add settings store
    const maxBufferSize = defaultSettings.undoActionBufferSize;

    const undoBuffer = ref<ActionBufferEntry[]>([]);
    const redoBuffer = ref<ActionBufferEntry[]>([]);

    const designStore = useDesignStore();

    const addUndoBufferAction = (action: ActionBufferEntry) => {
        redoBuffer.value = [];
        undoBuffer.value.push(cloneDeep(action));

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
        let reverted = true;

        function errorAction(entity: BufferEntity | undefined = undefined) {
            reverted = false;
            console.warn('Something went wrong with action buffer:', entity?.action, entity ? entity.type : entry);
        }

        // For complex operations like relationship creation/deletion we must have actions order reversed
        entry.entities.slice().reverse().forEach((entity) => {
            switch (entity.type) {
                case "table": {
                    switch (entity.action) {
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
                        case "resize": {
                            designStore.bufferSetTableWidth(entity);
                            break;
                        }
                        case "change": {
                            designStore.bufferSetTableVal(entity);
                            break;
                        }
                        default: {
                            errorAction(entity);
                            break;
                        }
                    }
                    break;
                }
                case "tableCol": {
                    switch (entity.action) {
                        case "create": {
                            designStore.bufferDeleteCol(entity);
                            break;
                        }
                        case "delete": {
                            designStore.bufferRestoreCol(entity);
                            break
                        }
                        case "change": {
                            designStore.bufferRevertColumnVal(entity);
                            break;
                        }
                        default: {
                            errorAction(entity);
                            break;
                        }
                    }
                    break;
                }
                case "relation": {
                    switch (entity.action) {
                        case "create": {
                            designStore.bufferDeleteRelation(entity);
                            break;
                        }
                        case "delete": {
                            designStore.bufferRestoreRelation(entity);
                            break
                        }
                        case "change": {
                            designStore.bufferChangeRelation(entity);
                            break;
                        }
                        default: {
                            errorAction(entity);
                            break;
                        }
                    }
                    break;
                }
                default: {
                    errorAction();
                }
            }
        });
        return reverted;
    };

    const restoreAction = (entry: ActionBufferEntry): boolean => {
        let restored = true;

        function errorAction(entity: BufferEntity | undefined = undefined) {
            restored = false;
            console.warn('Something went wrong with action buffer:', entity?.action, entity ? entity.type : entry);
        }

        entry.entities.forEach((entity) => {
            switch (entity.type) {
                case "table": {
                    switch (entity.action) {
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
                        case "resize": {
                            designStore.bufferSetTableWidth(entity);
                            break;
                        }
                        case "change": {
                            designStore.bufferSetTableVal(entity);
                            break;
                        }
                        default: {
                            errorAction(entity);
                        }
                    }
                    break;
                }
                case "tableCol": {
                    switch (entity.action) {
                        case "create": {
                            designStore.bufferRestoreCol(entity);
                            break;
                        }
                        case "delete": {
                            designStore.bufferDeleteCol(entity);
                            break
                        }
                        case "change": {
                            designStore.bufferRevertColumnVal(entity);
                            break;
                        }
                        default: {
                            errorAction(entity);
                            break;
                        }
                    }
                    break;
                }
                case "relation": {
                    switch (entity.action) {
                        case "create": {
                            designStore.bufferRestoreRelation(entity);
                            break;
                        }
                        case "delete": {
                            designStore.bufferDeleteRelation(entity);
                            break
                        }
                        case "change": {
                            designStore.bufferChangeRelation(entity);
                            break;
                        }
                        default: {
                            errorAction(entity);
                            break;
                        }
                    }
                    break;
                }
                default: {
                    errorAction();
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

        undoBuffer
    };
})