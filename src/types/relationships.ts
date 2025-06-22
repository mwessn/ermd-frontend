import { generateId } from "@/utils/utils.ts";

export type RelationshipType =
    'noto' | // non-identifying One-to-One relation
    'ioto' | // identifying One-to-One relation
    'notm' | // non-identifying One-to-Many relation
    'iotm' | // identifying One-to-Many relation
    'mtm' // Many-to-Many relation

export interface DatabaseRelationship {
    id: string;
    // In Oto and OtM relationship first table is the one that gets the foreign key
    // In MtM first table is pivot table
    firstTableColId: string;
    firstTableId: string;

    secondTableColId: string;
    secondTableId: string;

    type: RelationshipType;
}

export const createNewRelationship = (
    firstColId: string,
    firstTableId: string,

    secondColId: string,
    secondTableId: string,
    type: RelationshipType
): DatabaseRelationship => {
    return {
        id: generateId('relation'),
        firstTableColId: firstColId,
        firstTableId: firstTableId,
        secondTableColId: secondColId,
        secondTableId: secondTableId,
        type: type
    }
}