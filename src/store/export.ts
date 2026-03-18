import { defineStore, storeToRefs } from "pinia";
import { computed, nextTick, ref } from "vue";
import { appConfig } from "@/app.config.ts";
import { useDesignStore } from "@/store/design.ts";
import { type ExportJson, type ExportTableColType, type ExportTableType, Table2ExportType } from "@/types/misc.ts";
import { type DatabaseEngine, DatabaseEngines } from "@/types/TableColumnTypes/tableField.ts";
import { useSettingsStore } from "@/store/settings.ts";
import type { Table, TableCol } from "@/types/table.ts";
import { assertDefined } from "@/utils/utils.ts";
import { useNotificationStore } from "@/store/ui/notifications.ts";
import i18n from "@/utils/i18n.ts";

export const useExportStore = defineStore('export', () => {
  const designStore = useDesignStore();
  const settingsStore = useSettingsStore();
  const notificationStore = useNotificationStore();

  const {
    tables,
    relations,
    groups,
    comments,
    isManualCreation,
    newTableIndex
  } = storeToRefs(designStore);

  const {
    setAllTables,
    setAllRelations,
    setAllGroups,
    setAllComments,
  } = designStore;

  const {
    currentSettings,
    currentDatabaseColumnTypes,
    userDefinedColumnTypes,
  } = storeToRefs(settingsStore);

  const exportModalVisible = ref<boolean>(false);

  const projectName = ref<string>('Example Project');
  const projectVersion = ref<string>('0.0.1');

  function resetProjectInfo() {
    projectName.value = 'New project';
    projectVersion.value = '0.0.1';
  }

  const filename = computed(() => `${appConfig.appName}-${
    projectName.value
      .trim()
      .replace('_', '+_')
      .replace(' ', '+_')
  }${
    projectVersion.value ? `_v${projectVersion.value.trim()}` : '' 
  }.json`);

  function exportProjectJson () {
    const data: ExportJson = {
      tables: tables.value.map(Table2ExportType),
      relations: relations.value,
      groups: groups.value,
      comments: comments.value,
      engine: currentSettings.value.databaseEngine,
      userTypes: userDefinedColumnTypes.value,
      exportVersion: appConfig.appVersion
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.value;
    link.click();

    URL.revokeObjectURL(url);

    notificationStore.show(i18n.global.t('notifications.projectExported'), 'success');
  }

  function incrementVersion(version: string): string {
    if (!version) return '0.0.1';

    // Split by dots if present
    const parts = version.split('.');

    // Try to find the last numeric part
    for (let i = parts.length - 1; i >= 0; i--) {
      const n = Number(parts[i]);
      if (!isNaN(n)) {
        // Increment only that numeric part
        parts[i] = (n + 1).toString();
        return parts.join('.');
      }
    }

    // If no numeric part, return the original
    return version;
  }

  async function importProjectJson(file: File): Promise<string[] | undefined> {
    try {
      const text = await file.text();
      const data: unknown = JSON.parse(text);

      const errors = validateJson(data);

      if (errors.length > 0) {
        console.error(errors);
        return errors;
      }

      const validatedJson: ExportJson = data as ExportJson;

      // Clear the project state
      designStore.createNewProject();

      // Try to parse project name and version from filename
      const filename = assertDefined(file.name).replace('.json', ''); // strip extension
      if (filename.startsWith(`${appConfig.appName}-`)) {
        // Assume the filename follows the patters
        const baseName = filename.slice(appConfig.appName.length + 1);

        const splitName = baseName.split('_v', 2);

        projectName.value = splitName[0].replace('+_', ' ');
        projectVersion.value = splitName[1] ?? '';

        if (projectVersion.value) {
          projectVersion.value = incrementVersion(projectVersion.value);
        } else {
          projectVersion.value = '1.0';
        }
      }

      if (validatedJson.exportVersion != appConfig.appVersion) {
        // TODO handle possible structure changes between versions
        console.warn(
          `Import version mismatch: ${validatedJson.exportVersion}/${appConfig.appVersion}`
        );
      }

      await nextTick();

      settingsStore.setCurrentEngine(validatedJson.engine);

      await nextTick();

      // Prevent autofocus on newly created tables
      isManualCreation.value = false;

      const importedTables = validatedJson.tables.map(exportType2Table);
      setAllTables(importedTables);

      // TODO properly parse names and extract last index
      newTableIndex.value = importedTables.length + 1;

      setAllRelations(validatedJson.relations);
      setAllGroups(validatedJson.groups ?? []);
      setAllComments(validatedJson.comments ?? []);

      notificationStore.show(i18n.global.t('notifications.projectImported'), 'success');

    } catch (err) {
      console.error("Failed to import JSON:", err);
      throw err;
    }
  }

  function exportType2Table(e: ExportTableType): Table {
    return {
      ...e,
      cols: e.cols.map(exportType2ColType)
    };
  }

  function exportType2ColType(e: ExportTableColType): TableCol {
    const type = currentDatabaseColumnTypes.value.find(it => it.displayName == e.type);
    if (!type) { throw new Error(`Type ${e.type} doesn't exist in the current engine`);}
    return {
      ...e,
      type: type
    };
  }

  function validateJson(data: unknown): string[] {
    if (!isObject(data)) {
      return ['Supplied JSON is not an object'];
    }

    if (!(
      data.engine &&
            typeof data.engine == 'string' &&
            DatabaseEngines.includes(data.engine)
    )) {
      return [`Unknown database engine: ${data.engine}`];
    }

    const errors: string[] = [];

    errors.push(
      ...validateJsonTables(data.tables, data.engine)
    );

    errors.push(
      ...validateJsonRelations(data.relations, data.tables as ExportTableType[])
    );

    errors.push(
      ...validateJsonGroups(data.groups ?? [])
    );

    errors.push(
      ...validateJsonComments(data.comments ?? [])
    );

    if (!data.exportVersion || typeof data.exportVersion != 'number') {
      errors.push('Missing or malformed exportVersion');
    }

    return errors;
  }

  function isObject(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null && !Array.isArray(v);
  }

  interface ObjectKeyValue {
    name: string,
    type: 'string' | 'number' | 'boolean' | 'array' | 'object',
    nullable?: boolean,
  }

  function validateObjectKeys(keys: ObjectKeyValue[], obj: Record<string, unknown>, objType: string, objIndex: number): string[] {
    const errors: string[] = [];

    for (const key of keys) {
      if (!key.nullable && !(key.name in obj)) {
        errors.push(`${objType} ${objIndex} is missing key '${key.name}'`);
        continue;
      }
      if (key.nullable && !obj[key.name]) {
        continue;
      }
      if (key.type == "array") {
        if (Array.isArray(obj[key.name])) { continue; }
        errors.push(`${objType} ${objIndex}'s '${key.name}' is not an array`);
      }
      else if (key.type == "object") {
        if (isObject(obj[key.name])) { continue; }
        errors.push(`${objType} ${objIndex}'s '${key.name}' is not an object`);
      }
      else if (typeof obj[key.name] != key.type) {
        errors.push(
          `Unexpected type for ${objType} ${objIndex}'s '${key.name}':` +
                        `expected ${key.type}, got ${ typeof obj[key.name] }`
        );
      }
    }

    return errors;
  }

  function validateJsonTables(tables: unknown, engine: DatabaseEngine): string[] {
    if (!Array.isArray(tables)) {
      return ["'tables' must be an array!"];
    }

    const errors: string[] = [];

    const tableKeys: ObjectKeyValue[] = [
      { name: 'id', type: 'string' },
      { name: 'name', type: 'string' },
      { name: 'cols', type: 'array' },
      { name: 'posX', type: 'number' },
      { name: 'posY', type: 'number' },
      { name: 'widthPx', type: 'number' },
    ];

    for (const { index, t } of tables.map((t, index) => ({ index, t }))) {
      if (!isObject(t)) {
        errors.push(`Table ${index} is not an object`);
        continue;
      }

      errors.push(
        ...validateObjectKeys(tableKeys, t, 'table', index)
      );

      if (!Array.isArray(t.cols)) {
        continue;
      }

      for (const { colIndex, col } of t.cols.map((col, colIndex) => ({colIndex, col}))) {
        errors.push(
          ...validateJsonTableCol(
            col,
            t.id as string ?? colIndex.toString(),
            index,
            engine
          )
        );
      }
    }

    return errors;
  }

  function validateJsonTableCol(
    col: unknown,
    tableId: string,
    index: number,
    engine: DatabaseEngine
  ): string[] {
    if (!isObject(col)) {
      return [`Column ${index} of table ${tableId} is not an object`];
    }

    const errors: string[] = [];

    const columnKeys: ObjectKeyValue[] = [
      { name: 'id', type: 'string' },
      { name: 'name', type: 'string' },
      { name: 'type', type: 'string' },
      { name: 'modifierValues', type: 'array', nullable: true },

      { name: 'primaryKey', type: 'boolean' },
      { name: 'foreignKey', type: 'boolean' },
      { name: 'notNull', type: 'boolean' },
      { name: 'unique', type: 'boolean' },
      { name: 'autoIncrement', type: 'boolean' },
      { name: 'defaultValue', type: 'string', nullable: true },
    ];

    const keyErrors = validateObjectKeys(columnKeys, col, 'column', index);

    errors.push(
      ...keyErrors.map(it => `Table ${tableId}'s ${it}`)
    );

    if (typeof col.type == 'string') {
      const existingType = Object.values(settingsStore.engineColumnTypes[engine])
        .find(it => it.displayName === col.type);

      if (existingType == undefined) {
        errors.push(`Unknown column type on column ${col.id} in table ${tableId}: ${col.type}`);
      }
    }

    return errors;
  }

  function validateJsonRelations(rels: unknown, tables: ExportTableType[]): string[] {
    if (!Array.isArray(rels)) {
      return ["'Relations' must be an array"];
    }

    const errors: string[] = [];

    const relKeys: ObjectKeyValue[] = [
      { name: 'id', type: 'string' },
      { name: 'firstTableColId', type: 'string' },
      { name: 'firstTableId', type: 'string' },
      { name: 'secondTableColId', type: 'string' },
      { name: 'secondTableId', type: 'string' },
    ];

    for (const { index, rel } of rels.map((rel, index) => ({ index, rel }))) {
      if (!isObject(rel)) {
        errors.push(`Relation ${index} is not an object`);
        continue;
      }

      errors.push(
        ...validateObjectKeys(relKeys, rel, 'relation', index)
      );

      if (typeof rel.firstTableId == 'string' && typeof rel.firstTableColId == 'string') {
        const table = tables.find(it => it.id == rel.firstTableId);
        if (!table) {
          errors.push(`Unknown tableId ${rel.firstTableId} on relation ${rel.id ?? index}`);
        } else {
          const col = table.cols.find(it => it.id == rel.firstTableColId);
          if (!col) {
            errors.push(`Unknown colId ${rel.firstTableColId} in table ${rel.firstTableId}` +
                         `on relation ${rel.id ?? index}`);
          }
        }
      }

      if (typeof rel.secondTableId == 'string' && typeof rel.secondTableColId == 'string') {
        const table = tables.find(it => it.id == rel.secondTableId);
        if (!table) {
          errors.push(`Unknown tableId ${rel.secondTableId} on relation ${rel.id ?? index}`);
        } else {
          const col = table.cols.find(it => it.id == rel.secondTableColId);
          if (!col) {
            errors.push(`Unknown colId ${rel.secondTableColId} in table ${rel.secondTableId}` +
                         `on relation ${rel.id ?? index}`);
          }
        }
      }
    }

    return errors;
  }

  function validateJsonGroups(areas: unknown) {
    if (!Array.isArray(areas)) {
      return ["'groups' must be an array"];
    }

    const errors: string[] = [];

    const areaKeys: ObjectKeyValue[] = [
      { name: 'id', type: 'string' },
      { name: 'posX', type: 'number' },
      { name: 'posY', type: 'number' },
      { name: 'color', type: 'string' },
      { name: 'name', type: 'string' },
      { name: 'size', type: 'object' },
    ];

    for (const { index, area } of areas.map((area, index) => ({ index, area }))) {
      if (!isObject(area)) {
        errors.push(`Area ${ index } is not an object`);
        continue;
      }

      errors.push(
        ...validateObjectKeys(areaKeys, area, 'group', index)
      );

      if (isObject(area.size)) {
        errors.push(
          ...validateObjectKeys(
            [ { name: 'width', type: 'number' }, { name: 'height', type: 'number' } ],
            area.size,
            'areaSize',
            index
          )
        );
      }
    }

    return errors;
  }

  function validateJsonComments(comments: unknown) {
    if (!Array.isArray(comments)) {
      return ["'comments' must be an array"];
    }

    const errors: string[] = [];

    const commentKeys: ObjectKeyValue[] = [
      { name: 'id', type: 'string' },
      { name: 'text', type: 'string' },
      { name: 'posX', type: 'number' },
      { name: 'posY', type: 'number' },
      { name: 'linkedTo', type: 'object', nullable: true },
    ];

    for (const { index, comment } of comments.map((c, index) => ({ index, comment: c }))) {
      if (!isObject(comment)) {
        errors.push(`Comment ${index} is not an object`);
        continue;
      }

      errors.push(
        ...validateObjectKeys(commentKeys, comment, 'comment', index)
      );

      // Validate linkedTo structure
      if (comment.linkedTo && isObject(comment.linkedTo)) {
        const linkedToKeys: ObjectKeyValue[] = [
          { name: 'type', type: 'string' },
          { name: 'entityId', type: 'string' },
          { name: 'offsetX', type: 'number' },
          { name: 'offsetY', type: 'number' }
        ];

        errors.push(
          ...validateObjectKeys(linkedToKeys, comment.linkedTo, 'linkedTo', index)
        );

        // Validate type enum
        if (typeof comment.linkedTo.type === 'string' &&
                  !['group', 'table', 'column'].includes(comment.linkedTo.type)) {
          errors.push(`Invalid linkedTo type in comment ${index}: ${comment.linkedTo.type}`);
        }
      }
    }

    return errors;
  }

  return {
    exportModalVisible,

    projectName,
    projectVersion,

    resetProjectInfo,

    exportProjectJson,
    importProjectJson,
  };
}, {
  persist: {
    key: `__ermd_export`,
    pick: [
      'projectName', 'projectVersion'
    ],
  }
});