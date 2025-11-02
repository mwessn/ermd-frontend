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

    type ActionHandler = (entity: BufferEntity) => void;

    const entityActionMap: Record<string, Record<string, ActionHandler>> = {
        table: {
            create: e => designStore.bufferRestoreTable(e),
            delete: e => designStore.bufferDeleteTable(e),
            move: e => designStore.bufferSetTablePos(e),
            resize: e => designStore.bufferSetTableWidth(e),
            change: e => designStore.bufferSetTableVal(e),
        },
        tableCol: {
            create: e => designStore.bufferRestoreCol(e),
            delete: e => designStore.bufferDeleteCol(e),
            change: e => designStore.bufferRevertColumnVal(e),
        },
        relation: {
            create: e => designStore.bufferRestoreRelation(e),
            delete: e => designStore.bufferDeleteRelation(e),
            change: e => designStore.bufferChangeRelation(e),
        },
        commentArea: {
            create: e => designStore.bufferRestoreCommentArea(e),
            delete: e => designStore.bufferDeleteCommentArea(e),
            change: e => designStore.bufferSetCommentAreaValues(e),
            move: e => designStore.bufferSetCommentAreaPos(e),
            resize: e => designStore.bufferSetCommentAreaSize(e),
        }
    };

    function getRevertedAction(action: string): string {
        if (action === 'create') return 'delete';
        if (action === 'delete') return 'create';
        return action;
    }

    const performAction = (entry: ActionBufferEntry, revert = false): boolean => {
        let success = true;

        const entities = revert ? [...entry.entities].reverse() : entry.entities;

        for (const entity of entities) {
            const typeMap = entityActionMap[entity.type];
            if (!typeMap || !typeMap[entity.action]) {
                console.warn("Action buffer error:", entity);
                success = false;
                continue;
            }

            const actionToCall = revert ? getRevertedAction(entity.action) : entity.action;
            typeMap[actionToCall](entity);
        }

        return success;
    };

    const revertAction = (entry: ActionBufferEntry) => performAction(entry, true);
    const restoreAction = (entry: ActionBufferEntry) => performAction(entry, false);


/*    const revertAction = (entry: ActionBufferEntry): boolean => {
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
                case "commentArea": {
                    switch (entity.action) {
                        case "create": {
                            designStore.bufferDeleteCommentArea(entity);
                            break;
                        }
                        case "delete": {
                            designStore.bufferRestoreCommentArea(entity);
                            break;
                        }
                        case "change": {
                            designStore.bufferSetCommentAreaValues(entity);
                            break;
                        }
                        case "move": {
                            designStore.bufferSetCommentAreaPos(entity);
                            break;
                        }
                        case "resize": {
                            designStore.bufferSetCommentAreaSize(entity);
                            break
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
                case "commentArea": {
                    switch (entity.action) {
                        case "create": {
                            designStore.bufferRestoreCommentArea(entity);
                            break;
                        }
                        case "delete": {
                            designStore.bufferDeleteCommentArea(entity);
                            break;
                        }
                        case "change": {
                            designStore.bufferSetCommentAreaValues(entity);
                            break;
                        }
                        case "move": {
                            designStore.bufferSetCommentAreaPos(entity);
                            break;
                        }
                        case "resize": {
                            designStore.bufferSetCommentAreaSize(entity);
                            break
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
    }*/

    return {
        addUndoBufferAction,
        undo,
        redo,
        clearState,

        undoBuffer
    };
})