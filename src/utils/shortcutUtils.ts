import type { KeyboardBindAction, KeyboardBindings, ShortcutGroup } from "@/types/shortcuts.ts";

const DISPLAY_NAMES: Record<string, string> = {
  'escape': 'Esc',
  'delete': 'Del',
  'arrowup': 'Up',
  'arrowdown': 'Down',
  'arrowleft': 'Left',
  'arrowright': 'Right',
  'backspace': 'Backspace',
  'enter': 'Enter',
  'tab': 'Tab',
  ' ': 'Space',
};

const GROUP_PREFIXES: Record<ShortcutGroup, string> = {
  keys: '',
  ctrl: 'Ctrl+',
  alt: 'Alt+',
  shift: 'Shift+',
};

export function formatBindingKey(key: string): string {
  // Handle multi-key combos like "shift+z"
  return key.split('+').map(part => {
    const lower = part.toLowerCase();
    if (DISPLAY_NAMES[lower]) return DISPLAY_NAMES[lower];
    if (lower.length === 1) return lower.toUpperCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }).join('+');
}

export function formatFullShortcut(group: ShortcutGroup, key: string): string {
  return GROUP_PREFIXES[group] + formatBindingKey(key);
}

export function findActionBinding(
  shortcuts: KeyboardBindings,
  action: KeyboardBindAction
): { group: ShortcutGroup; key: string } | undefined {
  for (const group of ['keys', 'ctrl', 'alt', 'shift'] as const) {
    for (const [key, act] of Object.entries(shortcuts[group])) {
      if (act === action) return { group, key };
    }
  }
  return undefined;
}
