import type { Table, TableCol } from "@/types/table.ts";
import type { AreaSize, CursorPos } from "@/components/designer/scripts/useDesignCanvas.ts";
import type { DatabaseRelationship } from "@/types/relationships.ts";
import type { Group } from "@/types/misc.ts";
import type { Comment } from "@/types/comments.ts";

type BufferEntityType = "table" | "relation" | "group" | "comment" | "tableCol";
type BufferActionType = "create" | "delete" | "move" | "change" | "resize";
type BufferStoreVal = Table | CursorPos | TableCol | DatabaseRelationship | Group | Comment | AreaSize | undefined | number;

export interface BufferEntity {
  action: BufferActionType;
  type: BufferEntityType,
  entityId: string,
  oldVal: BufferStoreVal;
}

export interface ActionBufferEntry {
  entities: BufferEntity[];
}