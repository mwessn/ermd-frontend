import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { UserSettings } from "@/types/misc.ts";
import { defaultSettings } from "@/types/misc.ts";
import { cloneDeep } from "lodash";
import {
    type ColumnType,
    type DatabaseEngine,
    DatabaseEngines,
    getDefaultModifierParams
} from "@/types/TableColumnTypes/tableField.ts";
import { mysqlTypes } from "@/types/TableColumnTypes/mysqlTypes.ts";
import { useDesignStore } from "@/store/design.ts";
import { postgresTypes } from "@/types/TableColumnTypes/postgresTypes.ts";

interface ErrorDetails {
    datetime: Date,
    error: Error
}

export const useSettingsStore = defineStore('settings', () => {

    const criticalError = ref<ErrorDetails | undefined>(undefined);

    const currentSettings = ref<UserSettings>(
        JSON.parse(localStorage.getItem("__ermd_settings") ?? "null")
        ?? cloneDeep(defaultSettings)
    );

    const defaultTableName = computed(() => currentSettings.value.namingConvention == 'snake' ? 'new_table_' : 'NewTable');

    const engineColumnTypes: Record<DatabaseEngine, Record<string, ColumnType>> = {
        mysql: mysqlTypes,
        postgres: postgresTypes,
        mssql: mysqlTypes,
        sqlite: mysqlTypes,
    }

    const userDefinedColumnTypes = ref<ColumnType[]>([]);

    const currentDatabaseColumnTypes = computed((): ColumnType[] =>
        [
            ...Object.values(engineColumnTypes[currentSettings.value.databaseEngine]),
            ...userDefinedColumnTypes.value
        ]
    );

    const columnTypeNames = computed(() => currentDatabaseColumnTypes.value
        .map(it => it.displayName));

    const primaryKeyTypes = computed(() => {
        return currentDatabaseColumnTypes.value
            .filter(it => it.flags.canBePrimaryKey);
    });

    const defaultPrimaryKey = computed(() => currentSettings.value.defaultPrimaryType);
    const defaultPrimarySize = computed(() => getDefaultModifierParams(currentSettings.value.defaultPrimaryType));

    const setCurrentEngine = (val: DatabaseEngine) => {
        // Sanity check
        if (!DatabaseEngines.includes(val)) {
            throw new Error(`Unknown engine: ${val}`);
        }

        currentSettings.value.databaseEngine = val;
    }

    const setCriticalError = (e: Error) => {
        criticalError.value = {
            datetime: new Date(),
            error: e
        }
        useDesignStore().createNewProject();
    }

    return {
        currentSettings,
        defaultTableName,
        criticalError,

        engineColumnTypes,
        currentDatabaseColumnTypes,
        userDefinedColumnTypes,
        columnTypeNames,
        primaryKeyTypes,

        defaultPrimaryKey,
        defaultPrimarySize,

        setCurrentEngine,

        setCriticalError,
    }
}, {
    persist: {
        key: `__ermd_settings`,
        pick: [
            'currentSettings',
            'userDefinedColumnTypes'
        ],
    }
});