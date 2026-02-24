import {defineStore} from "pinia";
import {computed, ref} from "vue";
import type {UserSettings} from "@/types/misc.ts";
import {defaultSettings} from "@/types/misc.ts";
import {cloneDeep} from "lodash";
import {
  type ColumnType,
  type DatabaseEngine,
  DatabaseEngines,
  defaultCustomTypes,
  getDefaultModifierParams
} from "@/types/TableColumnTypes/tableField.ts";
import {mysqlTypes} from "@/types/TableColumnTypes/mysqlTypes.ts";
import {postgresTypes} from "@/types/TableColumnTypes/postgresTypes.ts";
import {useNotificationStore} from "@/store/ui/notifications.ts";
import i18n from "@/utils/i18n.ts";
import {DEFAULT_KEYBOARD_BINDINGS, type KeyboardBindAction} from "@/types/shortcuts.ts";

interface ErrorDetails {
  datetime: string,
  message: string,
  stack?: string
}

function deduplicateBindings(group: Record<string, KeyboardBindAction>): Record<string, KeyboardBindAction> {
  const seen = new Set<KeyboardBindAction>();
  const result: Record<string, KeyboardBindAction> = {};
  for (const [key, action] of Object.entries(group)) {
    if (!seen.has(action)) {
      seen.add(action);
      result[key] = action;
    }
  }
  return result;
}

export const useSettingsStore = defineStore('settings', () => {

  const criticalError = ref<ErrorDetails | undefined>(undefined);

  const loadSettings = (): UserSettings => {
    const stored = JSON.parse(localStorage.getItem("__ermd_settings") ?? "null");
    const json = stored?.currentSettings as UserSettings | undefined;

    if (json) {
      const settings: UserSettings = {
        ...cloneDeep(defaultSettings),
        ...json,
      };

      for (const group of ['keys', 'ctrl', 'alt', 'shift'] as const) {
        settings.shortcuts[group] = deduplicateBindings(settings.shortcuts[group]);
      }

      return settings;
    } else {
      return cloneDeep(defaultSettings);
    }
  };

  const currentSettings = ref<UserSettings>(
    loadSettings()
  );

  const defaultTableName = computed(() => currentSettings.value.namingConvention == 'snake' ? 'new_table_' : 'NewTable');

  const engineColumnTypes: Record<DatabaseEngine, Record<string, ColumnType>> = {
    mysql: mysqlTypes,
    postgres: postgresTypes,
    mssql: mysqlTypes,
    sqlite: mysqlTypes,
  };

  const systemColumnTypes = computed(() =>
    Object.values(engineColumnTypes[currentSettings.value.databaseEngine]));

  const userDefinedColumnTypes = ref<ColumnType[]>(
    JSON.parse(localStorage.getItem("__ermd_settings") ?? "null")
        ?? cloneDeep(defaultCustomTypes[currentSettings.value.databaseEngine])
  );

  const currentDatabaseColumnTypes = computed((): ColumnType[] =>
    [
      ...systemColumnTypes.value,
      ...userDefinedColumnTypes.value
    ]);

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
      console.error('Unknown engine', val);
      useNotificationStore().show(i18n.global.t('notifications.unknownEngine', { engine: val }), 'error');
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
  };

  const setCriticalError = (e: Error) => {
    criticalError.value = {
      datetime: new Date().toISOString(),
      message: e.message,
      stack: e.stack
    };
  };

  const clearCriticalError = () => {
    criticalError.value = undefined;
  };

  const resetShortcuts = () => {
    currentSettings.value.shortcuts = cloneDeep(DEFAULT_KEYBOARD_BINDINGS);
  };

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
    clearCriticalError,
    resetShortcuts,
  };
}, {
  persist: {
    key: `__ermd_settings`,
    pick: [
      'currentSettings',
      'userDefinedColumnTypes',
    ]
  }
});