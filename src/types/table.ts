import { generateId, unpluralize } from "@/utils/utils.ts";
import { type ColumnType, getDefaultModifierParams } from "@/types/TableColumnTypes/tableField.ts";

export interface TableCol {
    id: string,
    name: string,
    type: ColumnType,
    modifierValues: number[] | string[] | undefined,

    primaryKey: boolean,
    foreignKey: boolean,
    notNull: boolean,
    unique: boolean,
    autoIncrement: boolean,
    defaultValue: string | undefined,
}

// Flag checkers

export function colCanBeNullable(col: TableCol) {
    return !col.primaryKey;
}

export function colCanAutoIncrement(col: TableCol) {
    return col.type.flags.canAutoIncrement;
}

export function colCanBePrimary(col: TableCol) {
    return col.type.flags.canBePrimaryKey;
}

//

export const generateNewTableCol = (colType: ColumnType): TableCol => {
    return {
        id: generateId('col'),
        name: "",
        type: colType,
        modifierValues: getDefaultModifierParams(colType),

        primaryKey: false,
        foreignKey: false,
        notNull: false,
        unique: false,
        autoIncrement: false,
        defaultValue: undefined
    }
}

export const generateNewForeignKey = (otherTable: Table, fkUnique: boolean = false, fkNotNull: boolean = false, namingCon: 'snake' | 'camel'): TableCol | undefined => {
    const otherPrimary = otherTable.cols.find(it => it.primaryKey);

    if (otherPrimary) {
        const col = generateNewTableCol(
            otherPrimary.type
        );

        // TODO this must be customizable in settings
        const postfix = namingCon == 'snake' ? '_id' : 'Id';
        col.name = `${unpluralize(otherTable.name)}${postfix}`;

        col.foreignKey = true;

        col.type = otherPrimary.type;
        col.modifierValues = otherPrimary.modifierValues;

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
    primaryType: ColumnType,
    generatePrimary: boolean = true
) => {
    let idCol: TableCol | undefined = undefined;

    if (generatePrimary) {
        idCol = {
            id: generateId('col'),
            name: "id",
            type: primaryType,
            modifierValues: getDefaultModifierParams(primaryType),

            primaryKey: true,
            foreignKey: false,
            notNull: true,
            unique: true,
            autoIncrement: false,
            defaultValue: undefined
        };
    }

    const table: Table = {
        id: generateId('table'),
        name: name + index,
        cols: idCol ? [idCol] : [],

        posX: posX,
        posY: posY,
    }

    return table;
}