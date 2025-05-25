import type { FieldType } from "@/types/tableField.ts";

export interface UserSettings {
    defaultPrimaryKey: FieldType;

    // Autosave
    autosave: boolean;
    autosaveIntervalMinutes: number;

    // Visual
    relationLineDisplay: 'ortho' | 'direct';
}

export const defaultSettings: UserSettings = {
    defaultPrimaryKey: 'bigint',

    autosave: true,
    autosaveIntervalMinutes: 5,

    relationLineDisplay: 'ortho',
}