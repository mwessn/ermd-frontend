import type { FieldType } from "@/types/tableField.ts";

export interface UserSettings {
    // Tables
    defaultPrimaryKey: FieldType;
    defaultRowType: FieldType;
    defaultNotNull: boolean;

    // Autosave
    autosave: boolean;
    autosaveIntervalMinutes: number;

    // Visual
    relationLineDisplay: 'ortho' | 'direct';

    // Functional
    dragCanvasButton: 'middle' | 'left';
    undoActionBufferSize: number;
}

export const defaultSettings: UserSettings = {
    defaultPrimaryKey: 'bigint',
    defaultRowType: 'int',
    defaultNotNull: false,

    autosave: true,
    autosaveIntervalMinutes: 5,

    relationLineDisplay: 'ortho',

    dragCanvasButton: 'middle',
    undoActionBufferSize: 20,
}