import type { Table, TableCol } from "@/types/table.ts";
import type { AreaSize, CursorPos } from "@/components/designer/scripts/useDesignCanvas.ts";
import type { DatabaseRelationship } from "@/types/relationships.ts";
import type { CommentArea } from "@/types/misc.ts";

type BufferEntityType = "table" | "relation" | "commentArea" | "tableCol";
type BufferActionType = "create" | "delete" | "move" | "change" | "resize";
type BufferStoreVal = Table | CursorPos | TableCol | DatabaseRelationship | CommentArea | AreaSize | undefined | number;

export interface BufferEntity {
    action: BufferActionType;
    type: BufferEntityType,
    entityId: string,
    oldVal: BufferStoreVal;
}

export interface ActionBufferEntry {
    entities: BufferEntity[];
}