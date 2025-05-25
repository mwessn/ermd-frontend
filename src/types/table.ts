import { type FieldType, getDefaultForType } from "@/types/tableField.ts";
import { generateId } from "@/utils/utils.ts";
import { defaultSettings } from "@/types/misc.ts";

export interface TableRow {
    id: string,
    name: string,
    type: FieldType,
    size: string | undefined,
    primaryKey: boolean,
    notNull: boolean,
    defaultValue: string | undefined,

}

export const newTableRow: TableRow = {
    id: generateId('row'),
    name: "",
    type: defaultSettings.defaultRowType,
    size: getDefaultForType(defaultSettings.defaultRowType),
    primaryKey: false,
    notNull: defaultSettings.defaultNotNull,
    defaultValue: undefined
}

export interface Table {
    id: string,
    name: string,
    rows: TableRow[],

    posX: number,
    posY: number,
}

export const newTable: Table = {
    id: generateId('table'),
    name: "",
    rows: [
        {
            id: generateId('row'),
            type: defaultSettings.defaultPrimaryKey,
            name: "id",
            size: getDefaultForType(defaultSettings.defaultPrimaryKey),
            primaryKey: true,
            notNull: true,
            defaultValue: undefined
        }
    ],

    posX: 0,
    posY: 0,
}