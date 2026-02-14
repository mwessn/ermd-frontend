import { generateId } from "@/utils/utils.ts";
import type { CursorPos } from "@/components/designer/scripts/useDesignCanvas.ts";
import { randomPastelColor } from "@/types/misc.ts";

export type CommentLinkType = 'group' | 'table' | 'column';

export interface CommentLinkedTo {
  type: CommentLinkType;
  entityId: string; // For columns: 'tableId.columnId'
  offsetX: number;  // Offset from linked entity (user can adjust by moving comment)
  offsetY: number;
}

export interface Comment {
  id: string;
  text: string;

  linkedTo: CommentLinkedTo | null; // null = standalone comment

  posX: number; // Absolute position on canvas (all comments are freely movable)
  posY: number;

  color: string;

  // No size fields - auto-sized via CSS constraints:
  // min-w-48 (192px), min-h-20 (80px), max-w-128 (512px), max-h-56 (224px)
}

export const generateComment = (pos: CursorPos, linkedTo?: CommentLinkedTo): Comment => {
  return {
    id: generateId('comment'),
    text: '',
    linkedTo: linkedTo ?? null,
    posX: pos.x,
    posY: pos.y,
    color: randomPastelColor(),
  };
};
