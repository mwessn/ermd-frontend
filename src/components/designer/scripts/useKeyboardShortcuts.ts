
import { onMounted, onUnmounted, type Ref } from 'vue';
import { useActionsStore } from '@/store/action.ts';
import type { UserAction } from "@/types/actions.ts";
import { useDesignStore } from "@/store/design.ts";
import { resetFocus } from "@/utils/utils.ts";
import { useActionBuffer } from "@/store/actionBuffer.ts";
import { useSettingsStore } from "@/store/settings.ts";
import { useExportStore } from "@/store/export.ts";
import type { KeyboardBindAction } from "@/types/shortcuts.ts";
import { colCanBePrimary, colCanBeNullable, colCanAutoIncrement, type TableCol } from "@/types/table.ts";
import { cloneDeep } from "lodash-es";
import { ZOOM_MIN, ZOOM_MAX } from "@/types/constants.ts";

export function useKeyboardShortcuts(centerView: () => void, scaleFactor: Ref<number>) {
  const actionsStore = useActionsStore();
  const designStore = useDesignStore();
  const bufferStore = useActionBuffer();
  const settingsStore = useSettingsStore();
  const exportStore = useExportStore();

  const setAction = (val: UserAction) => {
    actionsStore.setAction(val);
    if (!val) {
      designStore.resetCreatingGroup();
    }
  };

  function commitColChange(fc: { col: TableCol; tableId: string }, oldVal: TableCol) {
    const table = designStore.tablesMap.get(fc.tableId);
    if (table) {
      designStore.selectTable(table);
      designStore.bufferLogColChange(fc.col, oldVal);
      designStore.selectTable();
    }
  }

  // Map 1-9 linearly across ZOOM_MIN..ZOOM_MAX (excluding scale 1.0)
  const zoomLevel = (level: number): number =>
    ZOOM_MIN + (level - 1) * (ZOOM_MAX - ZOOM_MIN) / 8;

  const actionHandlers: Partial<Record<KeyboardBindAction, () => void>> = {
    'canvas.escape': () => { setAction(undefined); resetFocus(); },
    'canvas.createTable': () => setAction('table'),
    'canvas.createNoto': () => setAction('noto'),
    'canvas.createIoto': () => setAction('ioto'),
    'canvas.createNotm': () => setAction('notm'),
    'canvas.createIotm': () => setAction('iotm'),
    'canvas.createMtm': () => setAction('mtm'),
    'canvas.createComment': () => setAction('comment'),
    'canvas.createGroup': () => setAction('group'),
    'canvas.centerView': () => centerView(),
    'canvas.deleteSelected': () => { designStore.deleteSelectedTable(); resetFocus(); },
    'buffer.undo': () => bufferStore.undo(),
    'buffer.redo': () => bufferStore.redo(),
    'buffer.redoAlt': () => bufferStore.redo(),
    'clipboard.copy': () => { /* TODO: implement copy */ },
    'clipboard.paste': () => { /* TODO: implement paste */ },
    'project.save': () => { exportStore.exportModalVisible = true; },
    'zoom.reset': () => { scaleFactor.value = 1; },
    'zoom.level1': () => { scaleFactor.value = zoomLevel(1); },
    'zoom.level2': () => { scaleFactor.value = zoomLevel(2); },
    'zoom.level3': () => { scaleFactor.value = zoomLevel(3); },
    'zoom.level4': () => { scaleFactor.value = zoomLevel(4); },
    'zoom.level5': () => { scaleFactor.value = zoomLevel(5); },
    'zoom.level6': () => { scaleFactor.value = zoomLevel(6); },
    'zoom.level7': () => { scaleFactor.value = zoomLevel(7); },
    'zoom.level8': () => { scaleFactor.value = zoomLevel(8); },
    'zoom.level9': () => { scaleFactor.value = zoomLevel(9); },
    'column.togglePK': () => {
      const fc = designStore.focusedCol;
      if (!fc || fc.col.type.primitive === 'serial') return;
      if (!colCanBePrimary(fc.col)) return;
      const oldVal = cloneDeep(fc.col);
      fc.col.primaryKey = !fc.col.primaryKey;
      commitColChange(fc, oldVal);
    },
    'column.toggleNotNull': () => {
      const fc = designStore.focusedCol;
      if (!fc || fc.col.type.primitive === 'serial') return;
      if (!colCanBeNullable(fc.col)) return;
      const oldVal = cloneDeep(fc.col);
      fc.col.notNull = !fc.col.notNull;
      commitColChange(fc, oldVal);
    },
    'column.toggleUnique': () => {
      const fc = designStore.focusedCol;
      if (!fc || fc.col.type.primitive === 'serial') return;
      if (fc.col.primaryKey) return;
      const oldVal = cloneDeep(fc.col);
      fc.col.unique = !fc.col.unique;
      commitColChange(fc, oldVal);
    },
    'column.toggleAutoIncrement': () => {
      const fc = designStore.focusedCol;
      if (!fc || fc.col.type.primitive === 'serial') return;
      if (fc.col.primaryKey || !colCanAutoIncrement(fc.col)) return;
      const oldVal = cloneDeep(fc.col);
      fc.col.autoIncrement = !fc.col.autoIncrement;
      commitColChange(fc, oldVal);
    },
  };

  const onKeydown = (evt: KeyboardEvent) => {
    const isInInput = evt.target instanceof HTMLInputElement || evt.target instanceof HTMLTextAreaElement;
    if (isInInput && !evt.altKey && !evt.ctrlKey) return;

    const shortcuts = settingsStore.currentSettings.shortcuts;
    const key = evt.key.toLowerCase();
    let action: KeyboardBindAction | undefined;

    if (evt.ctrlKey) {
      evt.preventDefault();
      const lookupKey = evt.shiftKey ? `shift+${key}` : key;
      action = shortcuts.ctrl[lookupKey];
    } else if (evt.altKey) {
      evt.preventDefault();
      action = shortcuts.alt[key];
    } else if (evt.shiftKey) {
      action = shortcuts.shift[key];
    } else {
      action = shortcuts.keys[key];
    }

    if (action) {
      const handler = actionHandlers[action];
      if (handler) handler();
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
  };
}
