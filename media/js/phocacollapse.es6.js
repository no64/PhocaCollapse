/**
 * @package 	Joomla
 * @copyright 	Copyright (C) 2005 Open Source Matters. All rights reserved.
 * @license 	http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 *
 * @extension 	Phoca Collapse System Plugin
 * @copyright   Copyright (C) 2026 Jan Pavelka - www.phoca.cz. All rights reserved.
 * @copyright   Copyright (C) 2026 Niklas Olofsson - www.2n2media.de. All rights reserved.
 * @license 	http://www.gnu.org/copyleft/gpl.html GNU/GPL
 *
 * @author      Jan Pavelka
 * @author      Niklas Olofsson
 * Subform Collapse System Plugin Script - Version - 6.1.6
 */

document.addEventListener("DOMContentLoaded", () => {
	
	
    // -------------------------------------------------------
    // SAFETY CHECK: Double-secured shield for the field designer.
    // Stops the script in the field edit mask (view=field) via body class OR URL
    // to prevent core subform validation breaks, while running flawlessly on all list views.
    // -------------------------------------------------------
    const isEditBody = document.body && document.body.classList.contains('view-field');
    const isEditUrl = new URLSearchParams(window.location.search).get('view') === 'field';
    if (isEditBody || isEditUrl) {
        return; // Stops reliably to protect the core designer layout
    }
    // -------------------------------------------------------
    
    // -------------------------------------------------------
    // RETRIEVE GLOBAL PARAMETERS from PHP layer or fall back to strict defaults
    // -------------------------------------------------------
    const options = window.phocaCollapseOptions || {
        iconStyle: 'eye',
        individualCollapse: 0,
        titleFieldIndex: 1,
        preserveCollapseState: 0,
        initialCollapseState: 0,
        restoreCollapseState: 0,
        showResetButton: 1,
        initialNestedCollapse: 0,
        listCollapseActive: 1,
        expandText: 'Expand',
        collapseText: 'Collapse',
        expandAllText: 'Expand All',
        collapseAllText: 'Collapse All'
    };
    const groupSelector = '.subform-repeatable-group';
    const wrapperSelector = '.subform-repeatable-wrapper';
    // Generate a unique, path-safe key hash for runtime state tracking
    const storageKey = 'ph_coll_' + btoa(window.location.pathname + window.location.search).replace(/=/g, '').substring(0, 32);
    // Enforce sessionStorage for both modes to ensure maximum stability and prevent browser blocks in sandboxed admin views
    const storage = sessionStorage;
    
    
    // -------------------------------------------------------
    // STORAGE STATE MANAGEMENT
    // -------------------------------------------------------   
    /**
     * Generates a unique index-based identification key for a subform row group.
     * 
     * @param {HTMLElement} group - The target subform row element
     * @returns {string} Unique position-based session identifier
     */
    function getGroupSessionId(group) {
        const allGroups = Array.from(document.querySelectorAll('.subform-repeatable-group'));
        return 'subform_pos_' + allGroups.indexOf(group);
    }
    /**
     * Serializes and persists all current layout toggle states into the storage engine.
     */
    function saveStatesToSession() {
        if (!options.preserveCollapseState) return;
        const states = {};
        document.querySelectorAll(groupSelector).forEach(group => {
            const id = getGroupSessionId(group);
            states[id] = group.classList.contains('ph-collapse-hidden') ? 'closed' : 'open';
        });
        storage.setItem(storageKey, JSON.stringify(states));
    }
    /**
     * Recovers and applies previously preserved layout states to a specific row group.
     * 
     * @param {HTMLElement} group - The target subform row element
     * @returns {boolean} True if a state record was successfully matched and restored
     */
    function restoreStateFromSession(group) {
        if (!options.preserveCollapseState) return false;
        const saved = storage.getItem(storageKey);
        if (!saved) return false;
        try {
            const states = JSON.parse(saved);
            const id = getGroupSessionId(group);
            if (states[id]) {
                removeCollapseTitle(group);
                if (states[id] === 'closed') {
                    group.classList.add('ph-collapse-hidden');
                    group.dataset.phCollapseState = 'closed';
                    createCollapseTitle(group);
                } else {
                    group.classList.remove('ph-collapse-hidden');
                    group.dataset.phCollapseState = 'open';
                }
                updateGroupCollapseButton(group);
                return true;
            }
        } catch (e) {}
        return false;
    }
    
    
    // -------------------------------------------------------
    // STRUCTURAL LAYOUT HELPERS
    // -------------------------------------------------------   
    /**
     * Resolves the configured core icon class name string based on state parameters.
     * 
     * @param {boolean} closed - True if evaluating an embedded hidden/collapsed state
     * @returns {string} The active Joomla core icon class string name
     */
    function getCollapseIcon(closed) {
        if (options.iconStyle === 'eye') {
            return closed ? 'icon-eye-blocked' : 'icon-eye';
        }
        return closed ? 'icon-chevron-down' : 'icon-chevron-up';
    }
    /**
     * Finds all directly matching subform groups (rows) within a given wrapper.
     * Uses ':scope' to only capture rows of the current nesting level, safely 
     * ignoring any deeply nested subforms (subform-in-subform architectures).
     * 
     * @param {HTMLElement} wrapper - The surrounding subform wrapper element
     * @returns {HTMLElement[]} Array containing the actual row elements of the current level
     */
    function getDirectGroups(wrapper) {
        const repeatable = wrapper.querySelector(':scope > .subform-repeatable');
        if (!repeatable) return [];
        return Array.from(repeatable.children).filter(child => child.classList.contains('subform-repeatable-group'));
    }
    /**
     * Validates if a subform group row contains any collapsible input elements.
     * Returns true as soon as at least one generic input field or a nested
     * subform wrapper container is found within the current row layout.
     * 
     * @param {HTMLElement} group - The subform row element (group) to evaluate
     * @returns {boolean} True if collapsible form content exists
     */
    function hasCollapsibleContent(group) {
        for (const child of group.children) {
            if (child.classList.contains('control-group') || child.classList.contains('subform-repeatable-wrapper')) {
                return true;
            }
        }
        return false;
    }
    /**
     * Validates if a subform wrapper uses the required strict 'Form' layout style.
     * Returns false for table, standard, or form-grid layout architectures to prevent
     * visual DOM reconstruction errors.
     * 
     * @param {HTMLElement} wrapper - The target subform wrapper element
     * @returns {boolean} True if the wrapper matches the exact Form layout signature
     */
    function isFormLayout(wrapper) {
        if (!wrapper) return false;
        
        // 1. Hard-abort on table or default/standard layout wrappers instantly
        if (wrapper.classList.contains('subform-table-layout')) return false;
        
        // 2. Hard-abort on the newer modern Bootstrap-Grid layouts
        if (wrapper.classList.contains('subform-layout-grid')) return false;
        
        // 3. Enforce strict match: wrapper MUST contain 'subform-layout' to pass the gate
        return wrapper.classList.contains('subform-layout');
    }

 
	// -------------------------------------------------------
    // TITLE EXTRACTION & RENDERING
    // -------------------------------------------------------     
    /**
     * Creates a fallback-safe title label extracted from a specific form field 
     * defined in backend options, while filtering nested subforms and cascading 
     * down to any filled alternative field if the target element evaluates to empty.
     * 
     * @param {HTMLElement} el - The current subform group container row
     */
    function createCollapseTitle(el) {
        const targetIndex = (options.titleFieldIndex ? parseInt(options.titleFieldIndex, 10) : 1) - 1;
        // 1. Locate all control groups on the current nesting level
        const allControlGroups = Array.from(el.querySelectorAll(':scope > .control-group'));
        // 2. Exclude any control groups containing deeply nested subform structures
        const controlGroups = allControlGroups.filter(group => {
            return !group.querySelector('.subform-repeatable-wrapper');
        });
        let title = '';
        let elChild = null;
        // Step A: Attempt to retrieve the user's preferred field index configuration
        if (controlGroups[targetIndex]) {
            const testInput = controlGroups[targetIndex].querySelector('input, textarea, select');
            if (testInput && (testInput.value || (testInput.selectedOptions && testInput.selectedOptions.length > 0 && testInput.selectedOptions[0].text))) {
                elChild = controlGroups[targetIndex];
            }
        }
        // Step B: Fallback cascade - If preferred field is empty, search for the FIRST filled element
        if (!elChild) {
            elChild = controlGroups.find(group => {
                const input = group.querySelector('input, textarea, select');
                if (input) {
                    if (input.tagName === 'SELECT' && input.selectedOptions.length > 0 && input.selectedOptions[0].text.trim() !== '') {
                        return true;
                    }
                    if (input.value && input.value.trim() !== '') {
                        return true;
                    }
                }
                return false;
            });
        }
        // Step C: Absolute Fallback - If everything evaluates to empty, default to the very first row element
        if (!elChild && controlGroups.length > 0) {
            elChild = controlGroups[0];
        }
        // Process the extracted field layout flexibly and type-safely
        if (elChild) {
            // Locates the label element dynamically to bypass rigid index bindings
            const labelElement = elChild.querySelector('.control-label label, label');
            if (labelElement) {
                let titlePrefix = labelElement.textContent || '';
                let hasValue = false;
                // Inspect all generic input types within the matched group
                const input = elChild.querySelector('input');
                const textarea = elChild.querySelector('textarea');
                const select = elChild.querySelector('select');
                
                if (input && input.value !== '') {
                    let inputValue = input.value.trim();
                    
                    // SAFE INJECTION: Only triggers for radio groups, leaves all other inputs 100% untouched
                    if (input.type === 'radio') {
                        const checkedRadio = elChild.querySelector('input[type="radio"]:checked');
                        if (checkedRadio) {
                            const activeLabel = elChild.querySelector('label[for="' + checkedRadio.id + '"]') || elChild.querySelector('.btn.active, .btn-group .active, label.active');
                            if (activeLabel) {
                                inputValue = activeLabel.textContent.trim();
                            }
                        }
                    }

                    // MODERN JOOMLA 5/6 IMAGE PATH SANITIZATION
                    if (inputValue.includes('#')) {
                        inputValue = inputValue.split('#')[0];
                    }
                    // Filter: Only strip directory paths if a genuine image file extension evaluates to true
                    if (inputValue.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
                        if (inputValue.includes('/') || inputValue.includes('\\')) {
                            inputValue = inputValue.split(/[/\\]/).pop();
                        }
                    }
                    title = titlePrefix + ': ' + inputValue;
                    if (inputValue !== '') hasValue = true;
                } else if (textarea && textarea.value !== '') {
                    title = titlePrefix + ': ' + textarea.value;
                    if (textarea.value.trim() !== '') hasValue = true;
                } else if (select && select.selectedOptions && select.selectedOptions.length > 0) {
                    title = titlePrefix + ': ' + select.selectedOptions[0].text;
                    if (select.selectedOptions[0].text.trim() !== '') hasValue = true;
                }
                // Native support integration for Phoca Templates Rows
                const phRow = elChild.querySelector('.phTemplateRow');
                if (phRow) {
                    const inputEl = phRow.querySelector('input');
                    titlePrefix = '⏹️';
                    if (inputEl && inputEl.value !== '') {
                        const titleMatch = inputEl.value.match(/container-[^\s]*/);
                      if (titleMatch) {
                            title = titlePrefix + ' ' + titleMatch[0];
                            hasValue = true;
                        }
                    }
                }
                const phColumn = elChild.querySelector('.phTemplateColumn');
                if (phColumn) {
                    const inputEl = phColumn.querySelector('input');
                    if (inputEl && inputEl.value !== '') {
                        title = titlePrefix + ': ' + inputEl.value;
                        hasValue = true;
                    }
                }
                // Fallback numbering loop - If no value exists, attach the calculated row position number
                if (!hasValue || title === '') {
                    const allGroupsOnPage = Array.from(document.querySelectorAll('.subform-repeatable-group'));
                    const currentPosition = allGroupsOnPage.indexOf(el.closest('.subform-repeatable-group')) + 1;
                    title = titlePrefix.replace(':', '').trim() + ' #' + (currentPosition > 0 ? currentPosition : '1');
                }
            }
        }
        // Complete HTML sanitization filter stage
        if (title.trim() !== '') {
            // Strip any raw HTML tags (e.g., <p>, <strong>) completely to prevent layout breaking
            let cleanTitle = title.replace(/<\/?[^>]+(>|$)/g, "");
            // Clean common rich-text non-breaking space entities generated by editors
            cleanTitle = cleanTitle.replace(/&nbsp;/g, " ").trim();
            if (cleanTitle !== '') {
                const div = document.createElement('div');
                div.classList.add('ph-collapse-title');
                div.innerHTML = cleanTitle;
                el.appendChild(div);
            }
        }
    }


    /**
     * Safely locates and purges existing title label nodes from the current subform group.
     * 
     * @param {HTMLElement} group - The target subform row element
     */
    function removeCollapseTitle(group) {
        const title = [...group.children].find(child =>
            child.classList?.contains('ph-collapse-title')
        );
        if (title) {
            title.remove();
        }
    }
    
    
    // -------------------------------------------------------
    // BUTTONS & CORE LOGIC
    // -------------------------------------------------------  
    /**
     * Updates the icon and accessibility state of a specific subform row collapse button.
     * 
     * @param {HTMLElement} group - The target subform group row element
     */
    function updateGroupCollapseButton(group) {
        const button = group.querySelector('.group-collapse');
        if (!button) return;
        const icon = button.querySelector('span');
        if (!icon) return;
        const closed = group.classList.contains('ph-collapse-hidden');
        icon.className = getCollapseIcon(closed);
        button.setAttribute('aria-label', closed ? options.expandText : options.collapseText);
    }
    /**
     * Updates the display state, text, and icons of the master global collapse button.
     * Automatically syncs and hides the interface bar if fewer than 2 active rows exist.
     * 
     * @param {HTMLElement} wrapper - The surrounding master subform wrapper container
     */
    function updateGlobalCollapseButton(wrapper) {
        const button = wrapper.querySelector('[data-name="phCollapseClick"]');
        if (!button) return;
        const groups = getDirectGroups(wrapper);
        const visible = groups.length >= 2;
        
        // Hides the global toolbar if fewer than 2 subform items are rendered
        button.style.display = visible ? '' : 'none';

        // Safely locate optional reset and indicator elements
        const resetButton = wrapper.querySelector('[data-name="phCollapseReset"]');
        const indicatorGroup = wrapper.querySelector('.ph-indicator-group');
        const hasAnyRows = groups.length > 0;

        // Hide the reset trigger ONLY if the subform wrapper is completely empty (0 rows)
        if (resetButton) {
            resetButton.style.display = hasAnyRows ? '' : 'none';
        }

        // Hide the status indicator container ONLY if the subform wrapper is completely empty (0 rows)
        if (indicatorGroup) {
            indicatorGroup.style.display = hasAnyRows ? '' : 'none';
        }

        const allClosed = groups.every(group => group.classList.contains('ph-collapse-hidden'));
        const icon = button.querySelector('span:not(.ph-collapse-text)');
        if (icon) icon.className = getCollapseIcon(allClosed);
        const label = allClosed ? options.expandAllText : options.collapseAllText;
        button.setAttribute('aria-label', label);
        const textNode = button.querySelector('.ph-collapse-text');
        if (textNode) textNode.textContent = label;
    }
    /**
     * Iterates across the current viewport to refresh all global master buttons simultaneously.
     */
    function updateAllGlobalCollapseButtons() {
        document.querySelectorAll(wrapperSelector).forEach(wrapper => updateGlobalCollapseButton(wrapper));
    }
    /**
     * Toggles the display state of a single individual subform group row.
     * Automatically handles dynamic state preservation syncs if enabled.
     * 
     * @param {HTMLElement} group - The target subform group row element
     */
    function toggleGroup(group) {
        removeCollapseTitle(group);
        const isClosed = group.classList.toggle('ph-collapse-hidden');
        if (options.preserveCollapseState) {
            group.dataset.phCollapseState = isClosed ? 'closed' : 'open';
            saveStatesToSession(); // Persist the updated configuration block immediately into sessionStorage
        }
        if (isClosed) {
            createCollapseTitle(group);
        }
        updateGroupCollapseButton(group);
    }
    /**
     * Enforces a structural collapse (close) command across all subform rows within a wrapper.
     * 
     * @param {HTMLElement} wrapper - The target master subform wrapper
     * @param {boolean} rememberState - Flag to enforce state protection parameters
     */
    function collapseAllGroups(wrapper, rememberState = false) {
        const groups = getDirectGroups(wrapper);
        groups.forEach(function(group) {
            removeCollapseTitle(group);
            if (!group.classList.contains('ph-collapse-hidden')) {
                group.classList.add('ph-collapse-hidden');
            }
            if (rememberState && options.preserveCollapseState) {
                group.dataset.phCollapseState = 'closed';
            }
            createCollapseTitle(group);
            updateGroupCollapseButton(group);
        });
        saveStatesToSession();
    }
    /**
     * Enforces a structural expand (open) command across all subform rows within a wrapper.
     * 
     * @param {HTMLElement} wrapper - The target master subform wrapper
     */
    function expandAllGroups(wrapper) {
        const groups = getDirectGroups(wrapper);
        groups.forEach(function(group) {
            if (options.preserveCollapseState && group.dataset.phCollapseState === 'closed') {
                return;
            }
            group.classList.remove('ph-collapse-hidden');
            removeCollapseTitle(group);
            updateGroupCollapseButton(group);
        });
        saveStatesToSession();
    }
    /**
     * Masters the logical distribution toggle event for global wrapper bar clicks.
     * 
     * @param {HTMLElement} wrapper - The target master subform wrapper
     */
    function toggleAllGroups(wrapper) {
        const groups = getDirectGroups(wrapper);
        const allIndividuallyClosed = groups.every(group => group.dataset.phCollapseState === 'closed');
        const allClosed = groups.every(group => group.classList.contains('ph-collapse-hidden'));
        if (allClosed) {
            if (options.preserveCollapseState && allIndividuallyClosed) {
                groups.forEach(group => group.dataset.phCollapseState = 'open');
            }
            expandAllGroups(wrapper);
        } else {
            collapseAllGroups(wrapper);
        }
        updateGlobalCollapseButton(wrapper);
    }
    /**
     * Wipes out all manually preserved configuration storage data blocks and forces 
     * ALL rows (including deeply nested ones) back to their correct configured initialization state.
     * 
     * @param {HTMLElement} wrapper - The target master subform wrapper
     */
    function resetAllPreservedStates(wrapper) {
        // 1. Wipe out active storage entries safely
        storage.removeItem(storageKey);
        // 2. Locate ALL groups within this wrapper (including deeply nested ones)
        const groups = wrapper.querySelectorAll('.subform-repeatable-group');
        groups.forEach(group => {
            delete group.dataset.phCollapseState;
            // 3. Fallback routing back to configured initialization setups
            removeCollapseTitle(group);
            if (options.initialCollapseState) {
                // If initial state is "Eingeklappt", everything closes uniformly
                group.classList.add('ph-collapse-hidden');
                group.dataset.phCollapseState = 'closed';
                createCollapseTitle(group);
            } else {
                // If initial state is "Ausgeklappt" (Open)
                // Check if this specific row is nested inside another subform wrapper
                const isNested = group.closest('.subform-repeatable-wrapper .subform-repeatable-wrapper');
                if (isNested && options.initialNestedCollapse) {
                    // Force deeply nested subform rows to reset to collapsed for visual harmony
                    group.classList.add('ph-collapse-hidden');
                    group.dataset.phCollapseState = 'closed';
                    createCollapseTitle(group);
                } else {
                    // Regular top-level rows reset to fully expanded
                    group.classList.remove('ph-collapse-hidden');
                }
            }
            updateGroupCollapseButton(group);
        });
        // 4. Synchronize the master button visual layer
        updateGlobalCollapseButton(wrapper);
    }
    
    
    // -------------------------------------------------------
    // CORE VIEW LIST LOGIC (COMPACT COMPONENT SECTIONS)
    // -------------------------------------------------------   
    /**
     * Toggles a specific CSS hidden class name directly on a core table element node.
     * 
     * @param {string} tableId - The HTML DOM identification string of the target list table
     * @param {string} hiddenClass - The specific CSS class string to apply/remove
     * @returns {boolean} True if the table now possesses the hidden/collapse target class name
     */
    function toggleTableRows(tableId, hiddenClass) {
        const table = document.getElementById(tableId);
        if (!table) return false;
        return table.classList.toggle(hiddenClass);
    }
    /**
     * Loops across core content, contact, and custom field list IDs to toggle compact view grids. 
     * Automatically inverts and synchronizes local toolbar icon nodes upon event execution.
     * 
     * @param {HTMLElement} button - The clicked navigation link or button trigger node
     */
    function toggleArticle(button) {
        let isClosed = false;
        ['articleList', 'contactList', 'fieldList'].forEach(id => {
            const result = toggleTableRows(id, 'ph-collapse-hidden-div-div');
            if (result !== false) {
                isClosed = result;
            }
        });
        // Icon synchronization framework: Invert state parameter to trigger seamless layout shifting
        if (button) {
            const icon = button.querySelector('span');
            if (icon && !icon.classList.contains('ph-collapse-text')) {
                icon.className = getCollapseIcon(!isClosed);
            }
        }
    }
    /**
     * Loops across core menu, item, category, and tag list component table containers.
     * 
     * @param {HTMLElement} button - The clicked navigation link or button trigger node
     */
    function toggleMenu(button) {
        let isClosed = false;
        ['menuitemList', 'categoryList', 'tagList'].forEach(id => {
            const result = toggleTableRows(id, 'ph-collapse-hidden-div');
            if (result !== false) {
                isClosed = result;
            }
        });
        if (button) {
            const icon = button.querySelector('span');
            if (icon && !icon.classList.contains('ph-collapse-text')) {
                icon.className = getCollapseIcon(!isClosed);
            }
        }
    }
    // -------------------------------------------------------
    /**
     * Dynamically injects individual collapse button triggers into each subform row (group).
     * Seamlessly supports repeatable rows using Joomla's native toolbars, as well as 
     * non-repeatable fields by creating an on-the-fly fallback toolbar structure.
     */
    function addGroupCollapseButtons() {
        const groups = document.querySelectorAll(groupSelector);
        groups.forEach(function(group) {
	        
	        // --- NEU: Verhindert das Injizieren von Einzel-Buttons in Tabellen oder Grids ---
            const parentWrapper = group.closest(wrapperSelector);
            if (parentWrapper && !isFormLayout(parentWrapper)) return;
            // -----------------------------------------------------------
            
            if (!hasCollapsibleContent(group)) return;
            // 1. Locate Joomla's native repeatable subform toolbar group row
            let toolbar = group.querySelector(':scope > .btn-toolbar .btn-group');
            // 2. FALLBACK ROUTING FOR NON-REPEATABLE FIELDS:
            if (!toolbar) {
                if (group.querySelector('.ph-custom-toolbar')) return;
                const customToolbar = document.createElement('div');
                customToolbar.className = 'btn-toolbar ph-custom-toolbar';
                customToolbar.innerHTML = '<div class="btn-group"></div>';
                // Inject the freshly generated layout bar at the very top of the group container
                group.insertBefore(customToolbar, group.firstChild);
                toolbar = customToolbar.querySelector('.btn-group');
                // EXTRA ARCHITECTURE: Extract existing status indicator icons from PHP layer and merge into local toolbar
                const wrapper = group.closest(wrapperSelector);
                if (wrapper) {
                    const phpCollapseBlock = wrapper.querySelector(':scope > .ph-collapse');
                    if (phpCollapseBlock) {
                        const indicators = phpCollapseBlock.querySelectorAll('.indicator');
                        if (indicators.length > 0) {
                            // Generate a local container box for status indicator icons on the button level
                            const indicatorGroup = document.createElement('div');
                            indicatorGroup.className = 'ph-indicator-group';
                            // Migrate matching icons into this newly rendered container block
                            indicators.forEach(indicator => {
                                indicatorGroup.appendChild(indicator);
                            });
                            // Nest the indicator container box as the absolute first node inside the local .btn-group
                            toolbar.insertBefore(indicatorGroup, toolbar.firstChild);
                        }
                    }
                }
            }
            // 3. Generate and append the individual collapse trigger button
            if (!toolbar || toolbar.querySelector('.group-collapse')) return;
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'group-collapse btn btn-sm btn-secondary';
            button.setAttribute('data-name', 'phCollapseClickGroup');
            button.setAttribute('aria-label', options.collapseText);
            button.innerHTML = '<span class="' + getCollapseIcon(group.classList.contains('ph-collapse-hidden')) + '" aria-hidden="true"></span>';
            toolbar.appendChild(button);
            updateGroupCollapseButton(group);
        });
    }
    
    
    // -------------------------------------------------------
    // INITIALIZATION & RESTORATION FROM SESSION
    // -------------------------------------------------------    
    /**
     * Initializes the plugin runtime logic on page load. Coordinates individual button
     * bindings, session memory restoration cascades, and initial collapse state parameters.
     */
    function initPluginLogic() {
        if (options.individualCollapse) {
            addGroupCollapseButtons();
        }
        // Fetch manually preserved runtime session data
        const savedData = sessionStorage.getItem(storageKey);
        let sessionStates = null;
        if (savedData) {
            try {
                sessionStates = JSON.parse(savedData);
            } catch (e) {
                sessionStates = null;
            }
        }
        // Iterate through all found subform row groups to evaluate individual initialization rules
        document.querySelectorAll(groupSelector).forEach(group => {
	        
	        // --- Checking layout style of current SUBFORM ---
            const parentWrapper = group.closest(wrapperSelector);
            if (!parentWrapper || !isFormLayout(parentWrapper)) {
                return; // Überspringt diese Zeile komplett, wenn es kein Formular-Layout ist!
            }
            // ----------------------------------------------------
            
            
            let restored = false;
            // Priority 1: Check if an entry exists in session storage payload, then apply it instantly
            if (options.restoreCollapseState && sessionStates && Object.keys(sessionStates).length > 0) {
                restored = restoreStateFromSession(group);
            }
            // Priority 2: Fall back to backend configuration rules only if no active memory block exists
            if (!restored) {
                if (options.initialCollapseState) {
                    removeCollapseTitle(group);
                    if (!group.classList.contains('ph-collapse-hidden')) {
                        group.classList.add('ph-collapse-hidden');
                    }
                    group.dataset.phCollapseState = 'closed';
                    createCollapseTitle(group);
                    updateGroupCollapseButton(group);
                } else {
                    // Configured initial state evaluates to "Ausgeklappt" (Open)
                    // Check if the current row element container is nested inside an alternative subform wrapper
                    const isNested = group.closest('.subform-repeatable-wrapper .subform-repeatable-wrapper');
                    if (isNested && options.initialNestedCollapse) {
                        // Force deeply nested layout structures to start collapsed for visual ergonomics
                        removeCollapseTitle(group);
                        group.classList.add('ph-collapse-hidden');
                        group.dataset.phCollapseState = 'closed';
                        createCollapseTitle(group);
                        updateGroupCollapseButton(group);
                    } else {
                        // Top-level main layout rows expand natively to full viewport size
                        group.classList.remove('ph-collapse-hidden');
                    }
                }
            }
        });
        // Refresh master control interaction bars globally for all wrapper instances at the very end
        //document.querySelectorAll(wrapperSelector).forEach(wrapper => updateGlobalCollapseButton(wrapper));
        // Sichert ab, dass leere Tabellen- oder Grid-Subforms keine Reste anzeigen
        document.querySelectorAll(wrapperSelector).forEach(wrapper => {
            if (isFormLayout(wrapper)) {
                updateGlobalCollapseButton(wrapper);
            }
        });
        
    }
    
    
    // FAST-TRACK STARTUP LOGIC: Ignores heavy asset/image loading delays and enforces early structural injection 
    // immediately after the HTML skeleton is drawn to eliminate severe visual layout flashing (FOUC)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            requestAnimationFrame(initPluginLogic);
        });
    } else {
        // If the DOM ecosystem is already constructed, bootstrap instantly via animation frames without any delay
        requestAnimationFrame(initPluginLogic);
    }
    
    
    // -------------------------------------------------------
    // JOOMLA SUBMIT INTERVENTION & INTERCEPTIONS
    // -------------------------------------------------------    
    if (window.Joomla && window.Joomla.submitform) {
        const originalJoomlaSubmit = window.Joomla.submitform;
        window.Joomla.submitform = function(task, form, validate) {
            // Trigger 1: If 'Apply' (Anwenden) is executed, ALWAYS freeze and persist current visibility states
            if (task && task.endsWith('.apply')) {
                saveStatesToSession();
            }
            // Trigger 2: Handles clean Save or Cancel workflow routing based on backend configurations
            else if (task && (
                    task.endsWith('.save') ||
                    task.endsWith('.cancel') ||
                    task.includes('save2')
                )) {
                if (options.storageType === 'session') {
                    storage.removeItem(storageKey);
                }
            }
            return originalJoomlaSubmit.apply(this, arguments);
        };
    }
    // Catch dynamically appended repeatable Joomla subform rows
    document.addEventListener('subform-row-add', function(event) {
        if (options.individualCollapse) {
            addGroupCollapseButtons();
        }
        setTimeout(() => {
            saveStatesToSession();
            updateAllGlobalCollapseButtons();
        }, 150);
    });
    // Intercept and recalculate layouts upon dynamic row removal loops
    document.addEventListener('subform-row-remove', function(event) {
	    
	    // --- NEU: Brich sofort ab, wenn die gelöschte Reihe zu einer Tabelle/Grid gehört ---
        const targetWrapper = event.target ? event.target.closest(wrapperSelector) : null;
        if (targetWrapper && !isFormLayout(targetWrapper)) return;
        // -----------------------------------------------------------------------------------

	    
        setTimeout(() => {
            if (options.individualCollapse) {
                addGroupCollapseButtons();
            }
            saveStatesToSession();
            updateAllGlobalCollapseButtons();
        }, 150);
    });
    
    
    // -------------------------------------------------------
    // CENTRAL EVENT DELEGATION (GLOBAL CLICK LISTENER)
    // -------------------------------------------------------  
    document.addEventListener('click', function(event) {
        const target = event.target.closest('[data-name]');
        if (!target) return;
        const action = target.getAttribute('data-name');
        if (action === 'phCollapseClick') {
            const collapseWrapper = target.closest(wrapperSelector);
            if (collapseWrapper) toggleAllGroups(collapseWrapper);
        } else if (action === 'phCollapseReset') {
            const collapseWrapper = target.closest(wrapperSelector);
            if (collapseWrapper) resetAllPreservedStates(collapseWrapper);
        } else if (action === 'phCollapseClickGroup') {
            const group = target.closest(groupSelector);
            if (group) {
                toggleGroup(group);
                const wrapper = group.closest(wrapperSelector);
                if (wrapper) updateGlobalCollapseButton(wrapper);
            }
            // Compact table list view trigger redirection routings
        } else if (action === 'phCollapseClickArticle' && options.listCollapseActive) {
            toggleArticle(target);
        } else if (action === 'phCollapseClickList' && options.listCollapseActive) {
            toggleMenu(target);
        }
    });
});
