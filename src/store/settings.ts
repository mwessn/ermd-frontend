import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { UserSettings } from "@/types/misc.ts";
import { defaultSettings } from "@/types/misc.ts";
import { cloneDeep } from "lodash";
import { type ColumnType, type DatabaseEngine, getDefaultModifierParams } from "@/types/TableColumnTypes/tableField.ts";
import { mysqlTypes } from "@/types/TableColumnTypes/mysqlTypes.ts";

interface ErrorDetails {
    datetime: Date,
    entityType: string,
    entityId: string,
    message: string
}

export const useSettingsStore = defineStore('settings', () => {

    const criticalError = ref<ErrorDetails | undefined>(undefined);

    const currentSettings = ref<UserSettings>(cloneDeep(defaultSettings));

    const defaultTableName = computed(() => currentSettings.value.namingConvention == 'snake' ? 'new_table_' : 'NewTable');

    const engineColumnTypes: Record<DatabaseEngine, Record<string, ColumnType>> = {
        mysql: mysqlTypes,
        mssql: mysqlTypes,
        postgres: mysqlTypes,
        sqlite: mysqlTypes,
    }

    const currentDatabaseColumnTypes = computed((): ColumnType[] =>
        Object.values(engineColumnTypes[currentSettings.value.databaseEngine])
    );

    const columnTypeNames = computed(() => currentDatabaseColumnTypes.value
        .map(it => it.displayName));

    const primaryKeyTypes = computed(() => {
        return currentDatabaseColumnTypes.value
            .filter(it => it.flags.canBePrimaryKey);
    });

    const defaultPrimaryKey = computed(() => currentSettings.value.defaultPrimaryType);
    const defaultPrimarySize = computed(() => getDefaultModifierParams(currentSettings.value.defaultPrimaryType));

    return {
        currentSettings,
        defaultTableName,
        criticalError,

        currentDatabaseColumnTypes,
        columnTypeNames,
        primaryKeyTypes,

        defaultPrimaryKey,
        defaultPrimarySize,
    }
}, {
    persist: {
        key: `__ermd_settings`,
        pick: [
            'currentSettings'
        ],
    }
});