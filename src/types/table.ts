import { generateId, unpluralize } from "@/utils/utils.ts";
import { defaultSettings } from "@/types/misc.ts";
import { appConfig } from "@/app.config.ts";

const defaultColType = appConfig.defaultColumnType;
const defaultColModifier = appConfig.defaultColumnModifier;

export interface TableCol {
    id: string,
    name: string,
    type: string,
    modifier: number[] | undefined,

    primaryKey: boolean,
    foreignKey: boolean,
    notNull: boolean,
    unique: boolean,
    autoIncrement: boolean,
    defaultValue: string | undefined,
}

export const generateNewTableCol = (): TableCol => {
    return {
        id: generateId('col'),
        name: "",
        type: defaultColType,
        modifier: defaultColModifier,

        primaryKey: false,
        foreignKey: false,
        notNull: defaultSettings.defaultNotNull,
        unique: false,
        autoIncrement: false,
        defaultValue: undefined
    }
}

export const generateNewForeignKey = (otherTable: Table, fkUnique: boolean = false, fkNotNull: boolean = false): TableCol | undefined => {
    const otherPrimary = otherTable.cols.find(it => it.primaryKey);

    if (otherPrimary) {
        const col = generateNewTableCol();

        // TODO this must be customizable in settings
        col.name = `${unpluralize(otherTable.name)}_id`;

        col.foreignKey = true;

        col.type = otherPrimary.type;
        col.modifier = otherPrimary.modifier;

        // Identifying and MtM FK must be not null
        col.notNull = fkNotNull;

        // OtO FK must be unique
        col.unique = fkUnique;

        return col;
    }
}

export interface Table {
    id: string,
    name: string,
    cols: TableCol[],

    posX: number,
    posY: number,
}

export const generateNewTable = (
    name: string,
    index: number = 1,
    posX: number,
    posY: number,
    primaryType: string,
    primaryModifier: number[] | undefined
) => {
    const idCol: TableCol = {
        id: generateId('col'),
        name: "id",
        type: primaryType,
        modifier: primaryModifier,

        primaryKey: true,
        foreignKey: false,
        notNull: true,
        unique: true,
        autoIncrement: false,
        defaultValue: undefined
    };

    const table: Table = {
        id: generateId('table'),
        name: name + index,
        cols: [idCol],

        posX: posX,
        posY: posY,
    }

    return table;
}