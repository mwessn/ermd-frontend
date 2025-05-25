export type userAction =
    'table' | // Create new table
    'oto' | // Create One-to-One relation
    'otm' | // Create One-to-Many relation
    'mtm' | // Create Many-to-Many relation
    'comment' | // Create comment area
    undefined;