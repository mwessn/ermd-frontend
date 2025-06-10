export type UserAction =
    'table' | // Create new table
    'noto' | // Create non-identifying One-to-One relation
    'ioto' | // Create identifying One-to-One relation
    'notm' | // Create non-identifying One-to-Many relation
    'iotm' | // Create identifying One-to-Many relation
    'mtm' | // Create Many-to-Many relation
    'commentArea' | // Create comment area
    undefined;