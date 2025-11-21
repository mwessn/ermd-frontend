import { type ColumnType, type DatabaseEngine, defaultPrimaryTypes } from "@/types/TableColumnTypes/tableField.ts";
import type { AreaSize, CursorPos } from "@/components/designer/scripts/useDesignCanvas.ts";
import { generateId } from "@/utils/utils.ts";
import type { Table, TableCol } from "@/types/table.ts";
import type { DatabaseRelationship } from "@/types/relationships.ts";

export interface UserSettings {
    databaseEngine: DatabaseEngine;
    namingConvention: 'snake' | 'camel';

    // Tables
    defaultPrimaryType: ColumnType;

    // Relationships
    generateMtMPrimaryKey: boolean;
    mtmPrimaryKeyType: ColumnType;

    // Functional
    dragCanvasButton: 'middle' | 'left';
    undoActionBufferSize: number;
    snapToGrid: boolean;
}

export const defaultSettings: UserSettings = {
    databaseEngine: 'postgres',
    namingConvention: 'camel',

    defaultPrimaryType: defaultPrimaryTypes['postgres'],

    generateMtMPrimaryKey: false,
    mtmPrimaryKeyType: defaultPrimaryTypes['postgres'],

    dragCanvasButton: 'left',
    undoActionBufferSize: 20,
    snapToGrid: false,

}

export const SQL_IDENTIFIER_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export const RESERVED_SQL_KEYWORDS = new Set([
    "ADD", "ALL", "ALTER", "AND", "ANY", "AS", "ASC", "BACKUP", "BETWEEN",
    "BY", "CASE", "CHECK", "COLUMN", "CONSTRAINT", "CREATE", "DATABASE",
    "DEFAULT", "DELETE", "DESC", "DISTINCT", "DROP", "EXEC", "EXISTS",
    "FOREIGN", "FROM", "FULL", "GROUP", "HAVING", "IN", "INDEX", "INNER",
    "INSERT", "INTERSECT", "INTO", "IS", "JOIN", "LEFT", "LIKE", "LIMIT",
    "NOT", "NULL", "ON", "OR", "ORDER", "OUTER", "PRIMARY", "PROCEDURE",
    "RIGHT", "ROWNUM", "SELECT", "SET", "TABLE", "TOP", "TRUNCATE", "UNION",
    "UNIQUE", "UPDATE", "VALUES", "VIEW", "WHERE", "WITH"
]);

export interface CommentArea {
    id: string,

    posX: number,
    posY: number,

    size: AreaSize,

    color: string,

    name: string,
    comment: string,
    showComment: boolean,
}

export function randomPastelColor(): string {
    const r = Math.floor((Math.random() * 127) + 127);
    const g = Math.floor((Math.random() * 127) + 127);
    const b = Math.floor((Math.random() * 127) + 127);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export const generateCommentArea = (pos: CursorPos): CommentArea => {
    return {
        id: generateId('commentArea'),
        posX: pos.x,
        posY: pos.y,

        size: {
            width: 1,
            height: 1
        },

        color: randomPastelColor(),
        name: '',
        comment: '',
        showComment: false
    }
}

export interface ExportJson {
    tables: ExportTableType[],
    relations: DatabaseRelationship[],
    commentAreas: CommentArea[],
    engine: DatabaseEngine,
    exportVersion: number
}

export interface ExportTableType extends Omit<Table, 'cols'> {
    cols: ExportTableColType[]
}

export interface ExportTableColType extends Omit<TableCol, 'type'>{
    type: string;
}

export function TableCol2ExportType(c: TableCol): ExportTableColType {
    return {
        ...c,
        type: c.type.displayName
    }
}

export function Table2ExportType(t: Table): ExportTableType {
    return {
        ...t,
        cols: t.cols.map(TableCol2ExportType)
    }
}

export interface SelectOption {
    label: string;
    value: any;
}