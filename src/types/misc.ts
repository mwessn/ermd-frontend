import { type ColumnType, type DatabaseEngine, defaultPrimaryTypes } from "@/types/TableColumnTypes/tableField.ts";

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
