// Grid and Snap
export const GRID_SNAP_SIZE = 8;
export const DEFAULT_GRID_SIZE = 10;

// Table Dimensions
export const TABLE_MIN_WIDTH = 120;
export const TABLE_MAX_WIDTH = 480;

// Comment Area Dimensions
export const COMMENT_AREA_MIN_SIZE = 56;
export const COMMENT_AREA_COLLAPSE_WIDTH = 180;
export const COMMENT_AREA_COLLAPSE_HEIGHT = 80;

// Comment Area Font Size Breakpoints (scale -> font size)
export const COMMENT_AREA_FONT_SIZES = [
    { maxScale: 0.4, fontSize: 32 },
    { maxScale: 0.6, fontSize: 28 },
    { maxScale: 0.8, fontSize: 24 },
    { maxScale: 1.0, fontSize: 20 },
] as const;
export const COMMENT_AREA_DEFAULT_FONT_SIZE = 16;
export const COMMENT_AREA_MIN_SCALE = 1;
export const COMMENT_AREA_MAX_SCALE = 2;

// Canvas
export const CANVAS_GRID_BG_SIZE = 50;

// Zoom
export const ZOOM_SHIFT_MULTIPLIER = 3;
export const ZOOM_STEP = 0.02;
export const ZOOM_MIN = 0.2;
export const ZOOM_MAX = 1.5;

// Relationship Line Rendering
export const RELATION_BASE_CIRCLE_SIZE = 6;
export const RELATION_CIRCLE_SIZE_MULTIPLIER = 1.4;
export const RELATION_MAX_CIRCLE_SIZE = 16;

export const RELATION_BASE_TRIANGLE_RADIUS = 12;
export const RELATION_TRIANGLE_RADIUS_MULTIPLIER = 1.8;
export const RELATION_MAX_TRIANGLE_RADIUS = 26;

export const RELATION_BASE_LINE_WIDTH = 3;
export const RELATION_LINE_WIDTH_MULTIPLIER = 1.4;
export const RELATION_MAX_LINE_WIDTH = 8;

export const RELATION_DASH_PATTERN = '35,10';
export const RELATION_LINE_OFFSET = 5;

// Pastel Color Generation
export const PASTEL_SATURATION_BASE = 70;
export const PASTEL_SATURATION_RANGE = 10;
export const PASTEL_LIGHTNESS_BASE = 80;
export const PASTEL_LIGHTNESS_RANGE = 5;

// UI Delays (milliseconds)
export const FOCUS_DELAY_MS = 50;

// Settings Limits
export const MAX_UNDO_BUFFER_SIZE = 1000;
