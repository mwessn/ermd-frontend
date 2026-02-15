import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faArrowRight,
  faCircleArrowRight,
  faChevronRight,
  faChevronCircleRight,
  faArrowsUpDownLeftRight,
  faTable,
  faComment,
  faObjectGroup,
  faLink,
  faCircleDot, faCompress
} from '@fortawesome/free-solid-svg-icons';
import type { UserAction } from '@/types/actions.ts';

const CURSOR_COLOR = '#F3E9E5';
const DEFAULT_CURSOR_SIZE = 16;

/**
 * Convert a FontAwesome icon to a cursor data URI
 */
export function iconToCursorDataUri(
  iconDef: IconDefinition,
  color: string = CURSOR_COLOR,
  size: number = DEFAULT_CURSOR_SIZE,
): string {
  const [width, height, , , path] = iconDef.icon;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${size}" height="${size}"><path fill="${color}" d="${path}"/></svg>`;
  const encoded = encodeURIComponent(svg);

  // Use top left corner as the anchor
  const hx = 1;
  const hy = 1;

  return `url('data:image/svg+xml,${encoded}') ${hx} ${hy}, auto`;
}

// Basic cursors
const defaultCursor = iconToCursorDataUri(faCircleDot, CURSOR_COLOR, 8)
const moveCursor = iconToCursorDataUri(faCompress);

// User actions
export const ACTION_CURSOR_MAP: Record<NonNullable<UserAction>, string> = {
  table: iconToCursorDataUri(faTable),
  noto: iconToCursorDataUri(faArrowRight),
  ioto: iconToCursorDataUri(faCircleArrowRight),
  notm: iconToCursorDataUri(faChevronRight),
  iotm: iconToCursorDataUri(faChevronCircleRight),
  mtm: iconToCursorDataUri(faArrowsUpDownLeftRight),
  group: iconToCursorDataUri(faObjectGroup),
  comment: iconToCursorDataUri(faComment),
  linkComment: iconToCursorDataUri(faLink),
};
/**
 * Get cursor style for a given action
 */
export function getCursorForAction(action: UserAction | 'move' | 'default'): string {
  if (action === 'move') { return moveCursor; }
  if (action === 'default' || !action) { return defaultCursor; }

  return ACTION_CURSOR_MAP[action] || defaultCursor;
}
