const fieldTypes: readonly string[] = [
    // Numeric types
    "bit", "tinyint", "smallint", "mediumint", "int", "integer", "bigint",
    "decimal", "dec", "numeric", "fixed", "money", "smallmoney",
    "float", "real", "double", "double precision",

    // Serial / auto-increment (PostgreSQL-specific)
    "serial", "bigserial", "smallserial",

    // Boolean
    "bool", "boolean",

    // Character types
    "char", "nchar", "varchar", "nvarchar", "text", "tinytext", "mediumtext", "longtext",
    "ntext",

    // Binary types
    "binary", "varbinary", "image", "blob", "tinyblob", "mediumblob", "longblob",

    // Date & time types
    "date", "datetime", "datetime2", "smalldatetime", "timestamp", "time", "year",
    "datetimeoffset",

    // UUID / unique
    "uuid", "uniqueidentifier",

    // JSON
    "json", "jsonb",

    // Arrays (PostgreSQL)
    "array",

    // Enumerated
    "enum", "set",

    // Spatial / geometry types
    "geometry", "point", "linestring", "polygon",
    "multipoint", "multilinestring", "multipolygon", "geometrycollection",

    // Others
    "sql_variant", "xml", "hierarchyid", "cursor", "table"
];

export type FieldType = typeof fieldTypes[number];

export function isValidFieldType(type: string): type is FieldType {
    return fieldTypes.includes(type as FieldType);
}

export const fieldTypeDefaults = {
    bit: "1",
    decimal: "(10,2)",
    dec: "(10,2)",
    numeric: "(10,2)",
    fixed: "(10,2)",
    float: "(24)",
    double: "(53)",
    "double precision": "(53)",
    char: "(1)",
    nchar: "(1)",
    varchar: "(255)",
    nvarchar: "(255)",
    binary: "(255)",
    varbinary: "(255)"
} as const;

export function getDefaultForType(type: FieldType): string | undefined {
    return fieldTypeDefaults[type as keyof typeof fieldTypeDefaults] ?? undefined;
}

export const primaryKeyFieldTypes: readonly FieldType[] = [
    // Integer types (commonly auto-incremented)
    "tinyint",
    "smallint",
    "mediumint",
    "int",
    "integer",
    "bigint",
    "serial",        // PostgreSQL auto-increment
    "bigserial",
    "smallserial",

    // UUID types
    "uuid",          // PostgreSQL & MySQL 8.0+
    "uniqueidentifier", // SQL Server

    // Other valid but less common
    "char",          // With fixed size (e.g., char(36) for UUID)
    "varchar",       // Sometimes used for custom UUIDs or slugs
];