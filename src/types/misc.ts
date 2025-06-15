import type { DatabaseEngine } from "@/types/TableColumnTypes/tableField.ts";

export interface UserSettings {
    databaseEngine: DatabaseEngine;

    // Tables
    defaultPrimaryKey: string;
    defaultRowType: string;
    defaultNotNull: boolean;
    defaultTableName: string,

    // Relationships
    generateMtMPrimaryKey: boolean;
    mtmPrimaryKeyType: string;

    // Functional
    dragCanvasButton: 'middle' | 'left';
    undoActionBufferSize: number;
}

export const defaultSettings: UserSettings = {
    databaseEngine: 'postgres',

    defaultPrimaryKey: 'uuid',
    defaultRowType: 'int',
    defaultNotNull: false,
    defaultTableName: "NewTable",

    generateMtMPrimaryKey: false,
    mtmPrimaryKeyType: 'bigint',

    dragCanvasButton: 'middle',
    undoActionBufferSize: 20,
}