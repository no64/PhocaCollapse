# Changelog – Phoca Collapse

This changelog documents the enhancements and improvements introduced in this extended development branch of **Phoca Collapse**. All notable changes are listed below.

---

## - 6.1.6  2026-08-09
### Added
- Native layout protection barrier auto-disabling the plugin on table and grid layouts.
- Advanced title extraction tracking for radio buttons and switchers (human-readable text).
- Cascading reset triggers for nested subforms inside specific scopes.
### Fixed
- Critical asset parsing crash with YOOtheme Pro 5 pagebuilder interface engines.
- Synchronized XML configuration variables and missing language string fallbacks.

---

## 6.1.5 – 2026-08-04
### Added
* Added a dedicated global Reset Button option (`show_reset_button`) to completely purge all preserved storage entries and instantly restore default configuration layouts.
* Added an intelligent nested structural evaluation option (`initial_nested_collapse`) to force deeply nested subform rows to start safely collapsed even when the global parent layout configuration is set to expanded, drastically reducing visual clutter.

### Improved
* Improved overall script translation hygiene by migrating all internal code documentation, structural descriptions, and JSDoc parameters uniformly into English.
* Improved title generation array handling by securing absolute fallback routines (Step C cascades) against native JavaScript type evaluation crashes on unrendered row nodes.

---

## 6.1.4 – 2026-08-03
### Added
* Added new field option `show_status_indicators` to toggle the visibility of active state configuration icons (bookmark/clock/database) next to collapse toolbars.
* Added support for non-repeatable subforms by dynamically generating a native fallback toolbar layout (`btn-toolbar ph-custom-toolbar`) to inject individual collapse triggers.

### Improved
* Improved collapse toolbar design by migrating all status indicators to a modern, ID-independent CSS class architecture using CSS Logical Properties (`inset-block-start`, `inset-inline-end`).
* Improved UI harmony for non-repeatable subforms by automatically extracting indicator icons from the top-level block and seamlessly nesting them into the local `.btn-group` layer.
* Improved single collapse button visibility by removing field-count restrictions, ensuring consistent collapse capability for heavy layouts like rich-text editors and textareas.
* Improved collapse title sanitization by introducing an automated HTML-tag and entity filter, ensuring clean, plain-text headers when extracting content from rich-text editors.
* Improved global event delegation architecture by merging list-view triggers (`toggleArticle`, `toggleMenu`) and syncing local toolbar icons dynamically upon expansion state changes.

### Fixed
* Fixed severe script execution blocks caused by a native Joomla core validation bug (`The row template is required...`) by making the PHP and JavaScript injection process completely structurally independent.
* Fixed a cascading title generation bug where URLs ending with a trailing slash (`/`) were erroneously truncated by the image-path cleanup logic, resulting in empty headers and unintended row-number fallbacks.
* Fixed an asset execution block on specific Joomla 6 custom field lists (e.g., com_contacts field context) caused by native core body-class anomalies (`view-`), resolved by implementing a hybrid body-class and URL parameter safety evaluation.


---

## 6.1.3 – 2026-08-01
### Added
* Added option `title_field_index` to select which field (1st, 2nd, 3rd, etc.) is used to generate the collapse title.
* Added cascading fallback logic for empty title fields to prevent empty collapse headers.
* Added optimized filename extraction for modern Joomla 5/6 image paths (`#joomlaImage://...`).
* Added dynamic status indicators (icons) next to the main global collapse button to visualize active plugin configurations (`preserve_collapse_state` and `storage_type`).

### Improved
* Improved nested subform detection by automatically ignoring inner subform wrappers during title field indexing.
* Improved user interface design by rendering status indicators inside a native, clean text-muted layout with subtle hover opacity effects.
* Improved structural selector hygiene by ensuring indicator icons are exclusively injected onto the primary top-level collapse toolbar, keeping nested subform rows clean.
* Improved backend configuration UX by introducing conditional field visibility (`showon`), cascading options from state preservation down to restore triggers and storage types.

### Fixed
* Fixed backend layout issues by completely excluding the Custom Fields Designer (`com_fields`) from collapse processing.

---

## 6.1.2 – 2026-07-31
### Added
* Added option `restore_collapse_state_after_save` to restore the current subform collapse state after **Apply** (`article.apply`).
* Added option `storage_type` to choose between temporary (Session Storage) and persistent state storage.
* Added option `list_collapse_active` to enable or disable global collapse buttons in Joomla list views (Articles, Menus, Categories, Tags, Fields and Contacts).
* Added robust absolute indexing (`subform_pos_X`) for nested subforms to ensure reliable state restoration across page reloads.

### Improved
* Refactored the initialization process using `requestAnimationFrame()` for more reliable backend rendering.
* Improved state handling for deeply nested repeatable subforms.

### Fixed
* Fixed JavaScript type-handling conflicts between Joomla custom toolbar elements and native browser events.
* Prevented potential recursive submission loops when overriding `window.Joomla.submitform`.
* Eliminated console errors related to dynamic creation and removal of `.ph-collapse-title`.

---

## 6.1.1 – 2026-07-28
### Added
* Added option `initial_collapse_state` to define whether subforms are initially expanded or collapsed when opening the page.
* Added support for custom layout rows `phTemplateRow` and `phTemplateColumn`.

---

## 6.1.0 – 2026-07-27
### Added
* Implemented complete subform collapse functionality for Joomla 5 and Joomla 6.
* Added dynamic collapse title generation based on the content of configurable form fields.
* Added automatic integration with `subform-row-add` and `subform-row-remove` events for dynamically created repeatable rows.
* Added individual collapse buttons for each repeatable subform.
* Added optional preservation of individually collapsed subforms when using the global collapse toggle.
* Added support for Joomla backend list views including Articles, Menus, Categories, Tags, Fields and Contacts.
* Added Bootstrap 5 compatible button rendering with configurable icon styles.

### Improved
* Refactored the JavaScript core for improved readability and maintainability.
* Improved compatibility with nested repeatable subforms.
* Improved overall backend usability when working with large repeatable forms.

### Fixed
* Fixed multiple issues related to dynamic DOM updates and repeatable subform handling.
* Fixed various UI inconsistencies and improved collapse state synchronization.
