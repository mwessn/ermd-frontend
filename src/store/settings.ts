import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { UserSettings } from "@/types/misc.ts";
import { defaultSettings } from "@/types/misc.ts";
import { cloneDeep } from "lodash";
import {
    type ColumnType,
    type DatabaseEngine,
    DatabaseEngines, defaultCustomTypes,
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

    const systemColumnTypes = computed(() =>
        Object.values(engineColumnTypes[currentSettings.value.databaseEngine])
    );

    const userDefinedColumnTypes = ref<ColumnType[]>(
        JSON.parse(localStorage.getItem("__ermd_settings") ?? "null")
        ?? cloneDeep(defaultCustomTypes[currentSettings.value.databaseEngine])
    );

    const currentDatabaseColumnTypes = computed((): ColumnType[] =>
        [
            ...systemColumnTypes.value,
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
            console.error('Unknown engine', val)
            throw new Error(`Unknown engine: ${val}`);
        }

        // Remove custom types that have conflicting names
        const systemTypeNames = [
            ...Object.values(engineColumnTypes[val]),
            ...defaultCustomTypes[val]
        ].map(it => it.displayName);

        userDefinedColumnTypes.value = userDefinedColumnTypes.value
            .filter(
                it => !systemTypeNames.includes(it.displayName)
            );

        userDefinedColumnTypes.value = [
            ...userDefinedColumnTypes.value,
            ...defaultCustomTypes[val]
        ];

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

        systemColumnTypes,
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