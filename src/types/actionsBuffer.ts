import type { Table, TableCol } from "@/types/table.ts";
import type { CursorPos } from "@/components/designer/scripts/useDesignCanvas.ts";

type BufferEntityType = "table" | "relation" | "commentArea" | "tableCol";
type BufferActionType = "create" | "delete" | "move" | "change";
type BufferStoreVal = Table | CursorPos | TableCol | undefined;

export interface BufferEntity {
    type: BufferEntityType,
    entityId: string,
    oldVal: BufferStoreVal;
}

export interface ActionBufferEntry {
    action: BufferActionType;
    entities: BufferEntity[];
}