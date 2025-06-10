export type RelationshipType =
    'noto' | // non-identifying One-to-One relation
    'ioto' | // identifying One-to-One relation
    'notm' | // non-identifying One-to-Many relation
    'iotm' | // identifying One-to-Many relation
    'mtm' // Many-to-Many relation