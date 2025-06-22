import type { DatabaseEngine } from "@/types/TableColumnTypes/tableField.ts";

export interface UserSettings {
    databaseEngine: DatabaseEngine;
    namingConvention: 'snake' | 'camel';

    // Tables
    defaultPrimaryKey: string;
    defaultNotNull: boolean;

    // Relationships
    generateMtMPrimaryKey: boolean;
    mtmPrimaryKeyType: string;

    // Functional
    dragCanvasButton: 'middle' | 'left';
    undoActionBufferSize: number;
}

export const defaultSettings: UserSettings = {
    databaseEngine: 'postgres',
    namingConvention: 'camel',

    defaultPrimaryKey: 'uuid',
    defaultNotNull: false,

    generateMtMPrimaryKey: false,
    mtmPrimaryKeyType: 'bigint',

    dragCanvasButton: 'left',
    undoActionBufferSize: 20,
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
