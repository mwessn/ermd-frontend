import type { Table } from "@/types/table.ts";
import type { DatabaseRelationship } from "@/types/relationships.ts";
import type { DesignState } from "./tables.ts";
import type { BufferEntity } from "@/types/actionsBuffer.ts";
import { cloneDeep } from "lodash";

export function createRelationOperations(
  state: () => DesignState
) {
  const resetRelationshipCreation = () => {
    state().relationFirstTableId.value = undefined;
  };

  // Buffer actions

  function bufferDeleteRelation(bufferEntry: BufferEntity) {
    const relation = state().relationsMap.value.get(bufferEntry.entityId);
    if (relation) {
      bufferEntry.oldVal = cloneDeep(relation);
      state().relationsMap.value.delete(bufferEntry.entityId);
    }
  }

  function bufferRestoreRelation(bufferEntry: BufferEntity) {
    const relation = cloneDeep(bufferEntry.oldVal as DatabaseRelationship);
    state().relationsMap.value.set(relation.id, relation);
    bufferEntry.oldVal = undefined;
  }

  function bufferChangeRelation(bufferEntry: BufferEntity) {
    const existingRelation = state().relationsMap.value.get(bufferEntry.entityId);
    if (existingRelation) {
      const oldVal = cloneDeep(existingRelation);
      state().relationsMap.value.set(bufferEntry.entityId, bufferEntry.oldVal as DatabaseRelationship);
      bufferEntry.oldVal = oldVal;
    }
  }

  // Helpers

  function mtmRelationExists(first: Table, second: Table): DatabaseRelationship | undefined {
    const { relations, tablesMap } = state();
    const mtmRels = relations.value.filter(it => it.type == 'mtm' && it.secondTableId == first.id);

    return mtmRels.find(relation => {
      const pivot = tablesMap.value.get(relation.firstTableId);
      if (!pivot) return false;

      return relations.value.some(it =>
        it.type === 'mtm' &&
                it.firstTableId === pivot.id &&
                it.secondTableId === second.id);
    });
  }

  return {
    resetRelationshipCreation,
    bufferDeleteRelation,
    bufferRestoreRelation,
    bufferChangeRelation,
    mtmRelationExists,
  };
}
