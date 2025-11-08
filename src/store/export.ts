import { defineStore, storeToRefs } from "pinia";
import { computed, ref } from "vue";
import { appConfig } from "@/app.config.ts";
import { useDesignStore } from "@/store/design.ts";
import { type ExportJson, type ExportTableColType, type ExportTableType, Table2ExportType } from "@/types/misc.ts";
import { isNumber, isString } from "lodash";
import { type DatabaseEngine, DatabaseEngines } from "@/types/TableColumnTypes/tableField.ts";
import { useSettingsStore } from "@/store/settings.ts";
import type { Table, TableCol } from "@/types/table.ts";
import TableColRow from "@/components/designer/table/TableColRow.vue";

export const useExportStore = defineStore('export', () => {
    const designStore = useDesignStore();
    const settingsStore = useSettingsStore();

    const {
        tables,
        relations,
        commentAreas,
    } = storeToRefs(designStore);

    const {
        currentSettings,
        engineColumnTypes,
        currentDatabaseColumnTypes,
    } = storeToRefs(settingsStore);

    const projectName = ref<string>('');
    const projectVersion = ref<string>('');

    const filename = computed(() => `${appConfig.appName}-${projectName} ${
        projectVersion.value ? `-${projectVersion.value}` : '' 
    }.json`);

    function exportProjectJson () {
        const data: ExportJson = {
            tables: tables.value.map(Table2ExportType),
            relations: relations.value,
            commentAreas: commentAreas.value,
            engine: currentSettings.value.databaseEngine,
            exportVersion: appConfig.appVersion
        }

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ermd-export-${filename}.json`;
        link.click();

        URL.revokeObjectURL(url);
    }

    async function importProjectJson(file: File) {
        try {
            const text = await file.text();
            const data: any = JSON.parse(text);

            const errors = validateJson(data);

            if (errors.length > 0) {
                console.error(errors);
                return;
            }

            const validatedJson: ExportJson = data as ExportJson

            if (validatedJson.exportVersion != appConfig.appVersion) {
                // TODO handle possible structure changes between versions
                console.warn(
                    `Import version mismatch: ${validatedJson.exportVersion}/${appConfig.appVersion}`
                );
            }

            settingsStore.setCurrentEngine(validatedJson.engine);

            tables.value = validatedJson.tables.map(exportType2Table);
            relations.value = validatedJson.relations;
            commentAreas.value = validatedJson.commentAreas;

            console.log(`JSON import complete`);
        } catch (err) {
            console.error("Failed to import JSON:", err);
            throw err;
        }
    }

    function exportType2Table(e: ExportTableType): Table {
        return {
            ...e,
            cols: e.cols.map(exportType2ColType)
        }
    }

    function exportType2ColType(e: ExportTableColType): TableCol {
        const type = currentDatabaseColumnTypes.value.find(it => it.displayName == e.type);
        if (!type) { throw new Error(`Type ${e.type} doesn't exist in the current engine`)}
        return {
            ...e,
            type: type
        }
    }

    function validateJson(data: any): string[] {
        if (!isObject(data)) {
            return ['Supplied JSON is not an object'];
        }

        if (!(
            data.engine &&
            typeof data.engine == 'string' &&
            DatabaseEngines.includes(data.engine)
        )) {
            return [`Unknown database engine: ${data.engine}`]
        }

        const errors: string[] = [];

        errors.push(
            ...validateJsonTables(data.tables, data.engine)
        );

        errors.push(
            ...validateJsonRelations(data.relations, data.tables as ExportTableType[])
        );

        errors.push(
            ...validateJsonCommentAreas(data.commentAreas)
        );

        if (!data.exportVersion || typeof data.exportVersion != 'number') {
            errors.push('Missing or malformed exportVersion')
        };

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

    function validateObjectKeys(keys: ObjectKeyValue[], obj: any, objType: string, objIndex: number): string[] {
        const errors: string[] = [];

        for (const key of keys) {
            if (!(key.name in obj)) {
                errors.push(`${objType} ${objIndex} is missing key '${key.name}'`);
                continue;
            }
            if (key.nullable && obj[key.name] == undefined) {
                continue;
            }
            if (key.type == "array" && !Array.isArray(obj[key.name])) {
                errors.push(`${objType} ${objIndex}'s '${key.name}' is not an array`);
            }
            else if (key.type == "object" && !isObject(obj[key.name])) {
                errors.push(`${objType} ${objIndex}'s '${key.name}' is not an object`);
            }
            else if (typeof obj[key.name] != key.type) {
                errors.push(
                    `Unexpected type for ${objType} ${objIndex}'s '${key.name}': 
                        expected ${key.type}, got ${ typeof obj[key.name] }`
                );
            }
        }

        return errors;
    }

    function validateJsonTables(tables: any, engine: DatabaseEngine): string[] {
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
        col: any,
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
            const existingType = Object.values(engineColumnTypes.value[engine])
                .find(it => it.displayName === col.type);

            if (existingType == undefined) {
                errors.push(`Unknown column type on column ${col.id} in table ${tableId}: ${col.type}`);
            }
        }

        return errors;
    }

    function validateJsonRelations(rels: any, tables: ExportTableType[]): string[] {
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
            { name: 'type', type: 'string' },
        ];

        for (const { index, rel } of rels.map((rel, index) => ({ index, rel }))) {
            if (!isObject(rel)) {
                errors.push(`Relation ${index} is not an object`);
                continue;
            }

            errors.push(
                ...validateObjectKeys(relKeys, rel, 'relation', index)
            );

            if (typeof rel.type == 'string' && !['ioto', 'iotm', 'noto', 'notm', 'mtm'].includes(rel.type)) {
                errors.push(`Unknown relation ${index} type: ${rel.type}`);
            }

            if (typeof rel.firstTableId == 'string' && typeof rel.firstTableColId == 'string') {
                const table = tables.find(it => it.id == rel.firstTableId);
                if (!table) {
                    errors.push(`Unknown tableId ${rel.firstTableId} on relation ${rel.id ?? index}`);
                } else {
                    const col = table.cols.find(it => it.id == rel.firstTableColId);
                    if (!col) {
                        errors.push(`Unknown colId ${rel.firstTableColId} in table ${rel.firstTableId}
                         on relation ${rel.id ?? index}`);
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
                        errors.push(`Unknown colId ${rel.secondTableColId} in table ${rel.secondTableId}
                         on relation ${rel.id ?? index}`);
                    }
                }
            }
        }

        return errors;
    }

    function validateJsonCommentAreas(areas: any) {
        if (!Array.isArray(areas)) {
            return ["'commentAreas' must be an array"];
        }

        const errors: string[] = [];

        const areaKeys: ObjectKeyValue[] = [
            { name: 'id', type: 'string' },
            { name: 'posX', type: 'number' },
            { name: 'posY', type: 'number' },
            { name: 'color', type: 'string' },
            { name: 'name', type: 'string' },
            { name: 'comment', type: 'string' },
            { name: 'showComment', type: 'boolean' },
            { name: 'size', type: 'object' },
        ];

        for (const { index, area } of areas.map((area, index) => ({ index, area }))) {
            if (!isObject(area)) {
                errors.push(`Area ${ index } is not an object`);
                continue;
            }

            errors.push(
                ...validateObjectKeys(areaKeys, area, 'commentArea', index)
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

    return {
        exportProjectJson,
        importProjectJson,
    }
});