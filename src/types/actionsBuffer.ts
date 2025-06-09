import type { Table } from "@/types/table.ts";
import type { CursorPos } from "@/components/designer/scripts/useDesignCanvas.ts";

type BufferEntityType = "table" | "relation" | "commentArea" | "tableCol";
type BufferActionType = "create" | "delete" | "move";
type BufferStoreVal = Table | CursorPos | undefined;

export interface BufferEntity {
    type: BufferEntityType,
    entityId: string,
    oldVal: BufferStoreVal;
}

export interface ActionBufferEntry {
    action: BufferActionType;
    entities: BufferEntity[];
}