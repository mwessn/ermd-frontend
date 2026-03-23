import type { TableCol } from "@/types/table.ts";
import type { ColumnType } from "@/types/TableColumnTypes/tableField.ts";
import type { DesignState } from "./tables.ts";
import { cloneDeep } from "lodash-es";
import type { useActionBuffer } from "@/store/actionBuffer.ts";
import type { useSettingsStore } from "@/store/settings.ts";
import type { BufferEntity } from "@/types/actionsBuffer.ts";

export function createColumnOperations(
  state: () => DesignState,
  stores: {
    bufferStore: ReturnType<typeof useActionBuffer>;
    settingsStore: ReturnType<typeof useSettingsStore>;
  }
) {
  const addTableCol = (col: TableCol) => {
    const { selectedTable } = state();
    if (selectedTable.value) {
      selectedTable.value.cols.push(cloneDeep(col));

      stores.bufferStore.addUndoBufferAction({
        entities: [{
          action: 'create',
          type: "tableCol",
          entityId: `${selectedTable.value.id}.${col.id}.${selectedTable.value.cols.length - 1}`,
          oldVal: undefined,
        }]
      });

      return true;
    }
    return false;
  };

  // Buffer actions

  function bufferDeleteCol(bufferEntry: BufferEntity) {
    const [tableId, colId] = bufferEntry.entityId.split('.');
    if (!tableId || !colId) return;

    const table = state().tablesMap.value.get(tableId);
    if (table) {
      const colIndex = table.cols.findIndex(it => it.id == colId);

      if (colIndex != -1) {
        bufferEntry.oldVal = cloneDeep(table.cols[colIndex]);
        table.cols.splice(colIndex, 1);
      }
    }
  }

  function bufferRestoreCol(bufferEntry: BufferEntity) {
    const [tableId, colId, colIndex] = bufferEntry.entityId.split('.');
    if (!tableId || !colId || !colIndex) return;

    const table = state().tablesMap.value.get(tableId);
    if (table) {
      table.cols.splice(parseInt(colIndex), 0, cloneDeep(bufferEntry.oldVal) as TableCol);

      bufferEntry.oldVal = undefined;
    }
  }

  function bufferRevertColumnVal(bufferEntry: BufferEntity) {
    const [tableId, colId] = bufferEntry.entityId.split('.');
    if (!tableId || !colId) return;

    const table = state().tablesMap.value.get(tableId);
    if (table) {
      const colIndex = table.cols.findIndex(it => it.id == colId);

      if (colIndex != -1) {
        const oldVal = cloneDeep(table.cols[colIndex]);
        table.cols[colIndex] = (bufferEntry.oldVal as TableCol);
        bufferEntry.oldVal = oldVal;
      }
    }
  }

  function buildColChangeEntries(col: TableCol, oldVal: TableCol): BufferEntity[] {
    const { selectedTable, relationsByPKColumnId, tablesMap } = state();
    if (!selectedTable.value) return [];

    const bufferEntries: BufferEntity[] = [];

    // Log the column change
    bufferEntries.push({
      action: 'change',
      type: "tableCol",
      entityId: `${selectedTable.value.id}.${col.id}`,
      oldVal: oldVal,
    });

    // If PK type changed and auto-sync is enabled, update all FK columns that reference it
    if (col.primaryKey &&
        stores.settingsStore.currentSettings.updateForeignKeysOnPrimaryChange &&
        oldVal.type.displayName !== col.type.displayName) {

      const affectedRelations = relationsByPKColumnId.value.get(col.id) || [];

      affectedRelations.forEach(relation => {
        const fkTable = tablesMap.value.get(relation.firstTableId);
        const fkColumn = fkTable?.cols.find(c => c.id === relation.firstTableColId);

        if (fkColumn && fkTable) {
          const fkIndex = fkTable.cols.indexOf(fkColumn);

          // Save old FK state before updating
          bufferEntries.push({
            action: 'change',
            type: 'tableCol',
            entityId: `${fkTable.id}.${fkColumn.id}.${fkIndex}`,
            oldVal: cloneDeep(fkColumn)
          });

          // Convert SERIAL types to their integer equivalents for FK columns
          let fkType = col.type;
          if (col.type.primitive === 'serial') {
            const serialToIntMap: Record<string, string> = {
              'SMALLSERIAL': 'SMALLINT',
              'SERIAL': 'INTEGER',
              'BIGSERIAL': 'BIGINT'
            };
            const intTypeName = serialToIntMap[col.type.displayName];
            if (intTypeName) {
              const intType = stores.settingsStore.currentDatabaseColumnTypes.find(
                (t: ColumnType) => t.displayName === intTypeName
              );
              if (intType) {
                fkType = intType;
              }
            }
          }

          // Update FK column type and modifiers to match PK
          fkColumn.type = fkType;
          fkColumn.modifierValues = col.modifierValues;
        }
      });
    }

    return bufferEntries;
  }

  return {
    addTableCol,
    bufferDeleteCol,
    bufferRestoreCol,
    bufferRevertColumnVal,
    buildColChangeEntries,
  };
}
