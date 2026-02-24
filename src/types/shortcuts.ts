export type KeyboardBindAction =
  // Canvas actions
  | "canvas.escape"
  | "canvas.createTable"
  | "canvas.createNoto"
  | "canvas.createIoto"
  | "canvas.createNotm"
  | "canvas.createIotm"
  | "canvas.createMtm"
  | "canvas.createComment"
  | "canvas.createGroup"
  | "canvas.centerView"
  | "canvas.deleteSelected"
  // Buffer actions
  | "buffer.undo"
  | "buffer.redo"
  | "buffer.redoAlt"
  // Clipboard actions
  | "clipboard.copy"
  | "clipboard.paste"
  // Project actions
  | "project.save"
  // Column flag toggles
  | "column.togglePK"
  | "column.toggleNotNull"
  | "column.toggleUnique"
  | "column.toggleAutoIncrement";

export type ShortcutGroup = 'keys' | 'alt' | 'ctrl' | 'shift';

export interface KeyboardBindings {
  keys: Record<string, KeyboardBindAction>;
  alt: Record<string, KeyboardBindAction>;
  ctrl: Record<string, KeyboardBindAction>;
  shift: Record<string, KeyboardBindAction>;
}

export const DEFAULT_KEYBOARD_BINDINGS: KeyboardBindings = {
  keys: {
    'escape': 'canvas.escape',
    't': 'canvas.createTable',
    'h': 'canvas.createNoto',
    'b': 'canvas.createIoto',
    'j': 'canvas.createNotm',
    'n': 'canvas.createIotm',
    'm': 'canvas.createMtm',
    'c': 'canvas.createComment',
    'g': 'canvas.createGroup',
    'x': 'canvas.centerView',
    'delete': 'canvas.deleteSelected',
  },
  ctrl: {
    'z': 'buffer.undo',
    'y': 'buffer.redo',
    'shift+z': 'buffer.redoAlt',
    'c': 'clipboard.copy',
    'v': 'clipboard.paste',
    's': 'project.save',
  },
  alt: {
    'p': 'column.togglePK',
    'n': 'column.toggleNotNull',
    'u': 'column.toggleUnique',
    'a': 'column.toggleAutoIncrement',
  },
  shift: {},
};

export const LOCKED_ACTIONS: ReadonlySet<KeyboardBindAction> = new Set([
  'canvas.escape',
  'canvas.deleteSelected',
  'buffer.undo',
  'buffer.redo',
  'buffer.redoAlt',
  'clipboard.copy',
  'clipboard.paste',
  'project.save'
]);

export interface ShortcutDisplayGroup {
  label: string;
  actions: readonly KeyboardBindAction[];
}

export const SHORTCUT_DISPLAY_GROUPS: readonly ShortcutDisplayGroup[] = [
  {
    label: 'settings.shortcuts.canvasGroup',
    actions: [
      'canvas.escape', 'canvas.createTable', 'canvas.createNoto', 'canvas.createIoto',
      'canvas.createNotm', 'canvas.createIotm', 'canvas.createMtm',
      'canvas.createComment', 'canvas.createGroup', 'canvas.centerView', 'canvas.deleteSelected',
    ],
  },
  {
    label: 'settings.shortcuts.globalGroup',
    actions: [
      'buffer.undo', 'buffer.redo', 'buffer.redoAlt',
      'clipboard.copy', 'clipboard.paste', 'project.save',
    ],
  },
  {
    label: 'settings.shortcuts.columnGroup',
    actions: [
      'column.togglePK', 'column.toggleNotNull', 'column.toggleUnique', 'column.toggleAutoIncrement',
    ],
  },
];

export const BIND_ACTION_LABELS: Record<KeyboardBindAction, string> = {
  'canvas.escape': 'settings.shortcuts.actions.escape',
  'canvas.createTable': 'settings.shortcuts.actions.createTable',
  'canvas.createNoto': 'settings.shortcuts.actions.createNoto',
  'canvas.createIoto': 'settings.shortcuts.actions.createIoto',
  'canvas.createNotm': 'settings.shortcuts.actions.createNotm',
  'canvas.createIotm': 'settings.shortcuts.actions.createIotm',
  'canvas.createMtm': 'settings.shortcuts.actions.createMtm',
  'canvas.createComment': 'settings.shortcuts.actions.createComment',
  'canvas.createGroup': 'settings.shortcuts.actions.createGroup',
  'canvas.centerView': 'settings.shortcuts.actions.centerView',
  'canvas.deleteSelected': 'settings.shortcuts.actions.deleteSelected',
  'buffer.undo': 'settings.shortcuts.actions.undo',
  'buffer.redo': 'settings.shortcuts.actions.redo',
  'buffer.redoAlt': 'settings.shortcuts.actions.redoAlt',
  'clipboard.copy': 'settings.shortcuts.actions.copy',
  'clipboard.paste': 'settings.shortcuts.actions.paste',
  'project.save': 'settings.shortcuts.actions.save',
  'column.togglePK': 'settings.shortcuts.actions.togglePK',
  'column.toggleNotNull': 'settings.shortcuts.actions.toggleNotNull',
  'column.toggleUnique': 'settings.shortcuts.actions.toggleUnique',
  'column.toggleAutoIncrement': 'settings.shortcuts.actions.toggleAutoIncrement',
};
