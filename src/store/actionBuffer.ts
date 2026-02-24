import { defineStore, storeToRefs } from "pinia";
import { ref } from "vue";
import type { ActionBufferEntry, BufferEntity } from "@/types/actionsBuffer.ts";
import { useDesignStore } from "@/store/design.ts";
import { cloneDeep } from "lodash";
import { useSettingsStore } from "@/store/settings.ts";
import { useNotificationStore } from "@/store/ui/notifications.ts";
import i18n from "@/utils/i18n.ts";

export const useActionBuffer = defineStore('actionBuffer', () => {

  const { currentSettings } = storeToRefs(useSettingsStore());

  const undoBuffer = ref<ActionBufferEntry[]>([]);
  const redoBuffer = ref<ActionBufferEntry[]>([]);

  const designStore = useDesignStore();
  const notificationStore = useNotificationStore();

  const addUndoBufferAction = (action: ActionBufferEntry) => {
    redoBuffer.value = [];
    undoBuffer.value.push(cloneDeep(action));

    if (undoBuffer.value.length > currentSettings.value.undoActionBufferSize) {
      undoBuffer.value.shift();
    }
  };

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
  };

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
    group: {
      create: e => designStore.bufferRestoreGroup(e),
      delete: e => designStore.bufferDeleteGroup(e),
      change: e => designStore.bufferSetGroupValues(e),
      move: e => designStore.bufferSetGroupPos(e),
      resize: e => designStore.bufferSetGroupSize(e),
    },
    comment: {
      create: e => designStore.bufferRestoreComment(e),
      delete: e => designStore.bufferDeleteComment(e),
      change: e => designStore.bufferSetCommentVal(e),
      move: e => designStore.bufferSetCommentPos(e),
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
        notificationStore.show(i18n.global.t('notifications.actionBufferError'), 'error');
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

  return {
    addUndoBufferAction,
    undo,
    redo,
    clearState,

    undoBuffer
  };
});