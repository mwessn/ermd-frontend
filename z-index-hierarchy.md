# Z-Index Hierarchy

All z-index values used in the project, from lowest to highest.

## Canvas Elements (inside transformed canvas div)

| z-index | Element | File | Notes |
|---------|---------|------|-------|
| -1 | Table pseudo-border (hover/focus glow) | `DesignerTable.vue` | Behind table content |
| 1 | Groups | `DesignerGroup.vue` | Lowest canvas element |
| 2 | SVG relation/comment lines | `DesignCanvas.vue` | Fixed-position SVG overlay, `pointer-events-none` |
| 10 | Tables (unfocused) | `DesignerTable.vue` | |
| 20 | Table body wrapper | `DesignerTable.vue` | Internal: ensures body renders above pseudo-border |
| 20 | Custom select dropdown | `CustomSelect.vue` | Dropdown inside settings, relative to parent |
| 70 | Tables (focused) | `DesignerTable.vue` | Above all unfocused tables and comments |
| 80 | Comments (unselected) | `DesignerComment.vue` | Above all tables including focused |
| 85 | Comments (selected) | `DesignerComment.vue` | Above other comments |
| 90 | Column properties popover | `ColumnProperties.vue` | Above comments, attached to focused table |
| 99 | Custom type alias dropdown | `CustomTypeAliasInput.vue` | Dropdown inside column properties |
| 999 | Column type selector dropdown | `ColTypeSelect.vue` | Topmost within table stacking context |

## UI Components (fixed/absolute positioning, outside canvas transform)

| z-index | Element | File | Notes |
|---------|---------|------|-------|
| 100 | Page header | `PageHeader.vue` | Fixed top bar, same level as side menus |
| 99 | Main menu overlay | `MainMenu.vue` | Between side menus |
| 100 | Functions menu (left) | `FunctionsMenu.vue` | Above main menu |
| 100 | Settings menu (right) | `SettingsMenu.vue` | Above main menu |
| 999 | Modal backdrop + content | `ModalLayout.vue` | Above everything except notifications |
| 9999 | Notification toasts | `App.vue` | Topmost UI element |
