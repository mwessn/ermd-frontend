import { type FieldType, getDefaultForType } from "@/types/tableField.ts";
import { generateId } from "@/utils/utils.ts";
import { defaultSettings } from "@/types/misc.ts";
import { appConfig } from "@/app.config.ts"

export interface TableCol {
    id: string,
    name: string,
    type: FieldType,
    size: string | undefined,

    primaryKey: boolean,
    notNull: boolean,
    unique: boolean,
    autoIncrement: boolean,
    defaultValue: string | undefined,
}

export const generateNewTableCol = () => {
    const col: TableCol = {
        id: generateId('col'),
        name: "",
        type: defaultSettings.defaultRowType,
        size: getDefaultForType(defaultSettings.defaultRowType),

        primaryKey: false,
        notNull: defaultSettings.defaultNotNull,
        unique: false,
        autoIncrement: false,
        defaultValue: undefined
    }

    return col;
}

export interface Table {
    id: string,
    name: string,
    cols: TableCol[],

    posX: number,
    posY: number,
}

export const generateNewTable = (index: number = 1, posX: number, posY: number) => {
    const idCol: TableCol = {
        id: generateId('col'),
        name: "id",
        type: defaultSettings.defaultPrimaryKey,
        size: getDefaultForType(defaultSettings.defaultPrimaryKey),

        primaryKey: true,
        notNull: true,
        unique: true,
        autoIncrement: false,
        defaultValue: undefined
    };

    const table: Table = {
        id: generateId('table'),
        name: appConfig.defaultTableName + index,
        cols: [idCol],

        posX: posX,
        posY: posY,
    }

    return table;
}