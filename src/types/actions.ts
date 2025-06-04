export type UserAction =
    'table' | // Create new table
    'oto' | // Create One-to-One relation
    'otm' | // Create One-to-Many relation
    'mtm' | // Create Many-to-Many relation
    'commentArea' | // Create comment area
    undefined;