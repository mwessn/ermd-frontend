import { generateId } from "@/utils/utils.ts";
import type { CursorPos } from "@/components/designer/scripts/useDesignCanvas.ts";

export type CommentLinkType = 'group' | 'table' | 'column';

export interface CommentLinkedTo {
  type: CommentLinkType;
  entityId: string; // For columns: 'tableId.columnId'
}

export interface Comment {
  id: string;
  text: string;

  linkedTo: CommentLinkedTo | null; // null = standalone comment

  posX: number;
  posY: number;
}

export const generateComment = (pos: CursorPos, linkedTo?: CommentLinkedTo): Comment => {
  return {
    id: generateId('comment'),
    text: '',
    linkedTo: linkedTo ?? null,
    posX: pos.x,
    posY: pos.y,
  };
};
