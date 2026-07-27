/*
 * @package Joomla
 * @copyright Copyright (C) 2005 Open Source Matters. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 *
 * @extension Phoca Collapse System Plugin
 * @copyright Copyright (C) Jan Pavelka www.phoca.cz
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL
 */
 
/**
 * contributor Niklas Olofsson
 *
 * Enhanced version:	 
 * - Improved support for nested subforms
 * - Global collapse now affects only direct child subforms
 * - Added optional individual collapse buttons
 * - Added option to remember individual collapse state
 * - Fixed duplicate collapse titles
 * - Fixed collapse button visibility
 * - Improved handling of dynamically added subforms
 */
 
 
 
document.addEventListener("DOMContentLoaded", () => {
    const options = window.phocaCollapseOptions || {
        iconStyle: 'eye',
        individualCollapse: 0,
        expandText: 'Expand',
        collapseText: 'Collapse',
        expandAllText: 'Expand All',
        collapseAllText: 'Collapse All'
    };
    const groupSelector = '.subform-repeatable-group';
    const wrapperSelector = '.subform-repeatable-wrapper';
    
    
    
    // -------------------------------------------------------
    // Helpers
    // -------------------------------------------------------   
    /**
     * Get collapse icon depending on plugin settings
     */
    function getCollapseIcon(closed) {
        if (options.iconStyle === 'eye') {
            return closed ? 'icon-eye-blocked' : 'icon-eye';
        }
        return closed ? 'icon-chevron-down' : 'icon-chevron-up';
    }
    /**
     * Get direct repeatable groups of one wrapper
     */
    function getDirectGroups(wrapper) {
        const repeatable = wrapper.querySelector(':scope > .subform-repeatable');
        if (!repeatable) {
            return [];
        }
        const children = Array.from(repeatable.children);
        const groups = children.filter(function(child) {
            return child.classList.contains('subform-repeatable-group');
        });
        return groups;
    }
    /**
     * Check if a group contains collapsible content
     */
    function hasCollapsibleContent(group) {
        let controlGroups = 0;
        for (const child of group.children) {
            if (child.classList.contains('control-group')) {
                controlGroups++;
            }
            if (child.classList.contains('subform-repeatable-wrapper')) {
                return true;
            }
        }
        return controlGroups > 1;
    }
    // -------------------------------------------------------
    
    
    
    // -------------------------------------------------------
    // Title
    // -------------------------------------------------------     
    /**
     * Create title from first useful field
     */
    function createCollapseTitle(el) {
        const children = el.childNodes;
        const childrenArray = Array.from(children);
        let textApplied = 0;
        let title = '';
        childrenArray.forEach(function(elChild) {
            if (textApplied !== 0) {
                return;
            }
            if (
                (typeof elChild.children !== 'undefined' &&
                    elChild.children[0] &&
                    elChild.children[0].classList.contains('control-label')) ||
                (typeof elChild.children !== 'undefined' &&
                    elChild.querySelector('fieldset') &&
                    elChild.querySelector('fieldset').querySelector('.control-label'))
            ) {
                if (elChild.children[0].querySelector('label') !== 'undefined') {
                    let titlePrefix = elChild.children[0].querySelector('label').textContent;
                    if (
                        titlePrefix.trim() === '' &&
                        elChild.children[1] &&
                        elChild.children[1].querySelector('label') !== null
                    ) {
                        titlePrefix = elChild.children[1].querySelector('label').textContent;
                    }
                    if (typeof elChild.children[1] !== 'undefined') {
                        const input = elChild.children[1].querySelector('input');
                        const textarea = elChild.children[1].querySelector('textarea');
                        const select = elChild.children[1].querySelector('select');
                        if (input && input.value !== '') {
                            title = titlePrefix + ': ' + input.value;
                        } else if (textarea && textarea.textContent !== '') {
                            title = titlePrefix + ': ' + textarea.textContent;
                        } else if (
                            select &&
                            select.selectedOptions.length > 0
                        ) {
                            title = titlePrefix + ': ' + select.selectedOptions[0].text;
                        }
                    }
                    /**
                     * Phoca Templates support
                     */
                    if (
                        elChild &&
                        elChild.children &&
                        elChild.children[0] &&
                        elChild.children[0].children
                    ) {
                        // ROW
                        if (
                            elChild.children[0].children[4] &&
                            elChild.children[0].className == 'phTemplateRow'
                        ) {
                            const inputEl =
                                elChild.children[0].children[4].querySelector('input');
                            titlePrefix = '⏹️';
                            if (inputEl && inputEl.value !== '') {
                                const titleFull = inputEl.value;
                                const titleMatch = titleFull.match(/container-[^\s]*/);
                                if (titleMatch) {
                                    title = titlePrefix + ' ' + titleMatch[0];
                                }
                            }
                        }
                        // COLUMN
                        if (
                            elChild.children[0].children[1] &&
                            elChild.children[0].children[1].children &&
                            elChild.children[0].children[1].children[1] &&
                            elChild.children[0].className == 'phTemplateColumn'
                        ) {
                            const inputEl =
                                elChild.children[0].children[1].children[1].querySelector('input');
                            if (inputEl && inputEl.value !== '') {
                                title = titlePrefix + ': ' + inputEl.value;
                            }
                        }
                    }
                    if (title === '') {
                        title = titlePrefix;
                    }
                    if (title.trim() !== '') {
                        textApplied = 1;
                    }
                }
            }
        });
        if (title.trim() !== '') {
            const div = document.createElement('div');
            div.classList.add('ph-collapse-title');
            div.innerHTML = title.trim();
            el.appendChild(div);
        }
    }
    /**
     * Remove one generated collapse title
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
    
    
    
    // -------------------------------------------------------
    // Buttons
    // -------------------------------------------------------  
    /**
     * Update single collapse button icon
     */
    function updateGroupCollapseButton(group) {
        const button = group.querySelector('.group-collapse');
        if (!button) {
            return;
        }
        const icon = button.querySelector('span');
        if (!icon) {
            return;
        }
        const closed = group.classList.contains('ph-collapse-hidden');
        icon.className = getCollapseIcon(closed);
        button.setAttribute(
            'aria-label',
            closed ? options.expandText : options.collapseText
        );
    }
    /**
     * Update global collapse button icon
     */
    function updateGlobalCollapseButton(wrapper) {
        const button = wrapper.querySelector('[data-name="phCollapseClick"]');
        if (!button) {
            return;
        }
        const groups = getDirectGroups(wrapper);
        const visible = groups.length >= 2;
        button.style.display = visible ? '' : 'none';
        const allClosed = groups.every(function(group) {
            return group.classList.contains('ph-collapse-hidden');
        });
        const icon = button.querySelector('span:not(.ph-collapse-text)');
        if (icon) {
            icon.className = getCollapseIcon(allClosed);
        }
        const label = allClosed ?
            options.expandAllText :
            options.collapseAllText;
        button.setAttribute(
            'aria-label',
            label
        );
        const textNode = button.querySelector('.ph-collapse-text');
        if (textNode) {
            textNode.textContent = label;
        }
    }
    /**
     * Update all global collapse buttons
     */
    function updateAllGlobalCollapseButtons() {
        document.querySelectorAll(wrapperSelector).forEach(function(wrapper) {
            updateGlobalCollapseButton(wrapper);
        });
    }
    // -------------------------------------------------------
    
    
    
    // -------------------------------------------------------
    // Collapse
    // -------------------------------------------------------  
    /**
     * Toggle one repeatable group
     */
    function toggleGroup(group) {
        removeCollapseTitle(group);
        const isClosed = group.classList.toggle('ph-collapse-hidden');
        // Benutzerentscheidung merken
        if (options.preserveCollapseState) {
            group.dataset.phCollapseState = isClosed ? 'closed' : 'open';
        }
        if (isClosed) {
            createCollapseTitle(group);
        }
        updateGroupCollapseButton(group);
    }
    /**
     * Collapse all groups
     */
    function collapseAllGroups(wrapper) {
        const groups = getDirectGroups(wrapper);
        groups.forEach(function(group) {
            removeCollapseTitle(group);
            if (!group.classList.contains('ph-collapse-hidden')) {
                group.classList.add('ph-collapse-hidden');
            }
            createCollapseTitle(group);
            updateGroupCollapseButton(group);
        });
    }
    /**
     * Expand all groups
     */
    function expandAllGroups(wrapper) {
        const groups = getDirectGroups(wrapper);
        groups.forEach(function(group) {
            // Individuell geschlossene Gruppen bleiben geschlossen
            if (
                options.preserveCollapseState &&
                group.dataset.phCollapseState === 'closed'
            ) {
                return;
            }
            group.classList.remove('ph-collapse-hidden');
            removeCollapseTitle(group);
            updateGroupCollapseButton(group);
        });
    }
    /**
     * Toggle all groups
     */
    function toggleAllGroups(wrapper) {
        const groups = getDirectGroups(wrapper);
        const allIndividuallyClosed = groups.every(function(group) {
            return group.dataset.phCollapseState === 'closed';
        });
        const allClosed = groups.every(function(group) {
            return group.classList.contains('ph-collapse-hidden');
        });
        if (allClosed) {
            // Sonderfall:
            // Alle wurden individuell geschlossen.
            if (
                options.preserveCollapseState &&
                allIndividuallyClosed
            ) {
                groups.forEach(function(group) {
                    group.dataset.phCollapseState = 'open';
                });
            }
            expandAllGroups(wrapper);
        } else {
            collapseAllGroups(wrapper);
        }
        updateGlobalCollapseButton(wrapper);
    }
    // -------------------------------------------------------
    
    
    
    // -------------------------------------------------------
    // Collapse Button in Joomla Article and Menu lists
    // -------------------------------------------------------     

    /**
	 * Toggle table rows
     */
	function toggleTableRows(tableId, hiddenClass) {
    	const table = document.getElementById(tableId);
		if (!table) {
        	return;
    	}
		table.querySelectorAll('tbody > tr').forEach(function(row) {
        	row.classList.toggle(hiddenClass);
    	});
	}
	/**
	 * Toggle menu rows
 	 */	
	function toggleMenu() {
    	toggleTableRows('menuitemList', 'ph-collapse-hidden-menu');
		toggleTableRows('categoryList', 'ph-collapse-hidden-menu');
		toggleTableRows('tagList', 'ph-collapse-hidden-menu');
	}
	/**
	 * Toggle article rows
 	 */	
	function toggleArticles() {
    	toggleTableRows('articleList', 'ph-collapse-hidden-article');
	}
	/**
	 * Toggle field and contact rows
 	 */
	function toggleFields() {
    	toggleTableRows('fieldList', 'ph-collapse-hidden-field');
		toggleTableRows('contactList', 'ph-collapse-hidden-field');

	}
    // -------------------------------------------------------
    
    
    
    // -------------------------------------------------------
    // Initialize
    // -------------------------------------------------------    
    /**
     * Add collapse button to each subform group
     */
    function addGroupCollapseButtons() {
        const groups = document.querySelectorAll(groupSelector);
        groups.forEach(function(group) {
            // Group has nothing to collapse
            if (!hasCollapsibleContent(group)) {
                return;
            }
            const toolbar = group.querySelector(':scope > .btn-toolbar .btn-group');
            if (!toolbar) {
                return;
            }
            // Button already exists
            if (toolbar.querySelector('.group-collapse')) {
                return;
            }
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'group-collapse btn btn-sm btn-secondary';
            button.setAttribute(
                'data-name',
                'phCollapseClickGroup'
            );
            button.setAttribute(
                'aria-label',
                options.collapseText
            );
            button.innerHTML =
                '<span class="' +
                getCollapseIcon(
                    group.classList.contains('ph-collapse-hidden')
                ) +
                '" aria-hidden="true"></span>';
            toolbar.appendChild(button);
            updateGroupCollapseButton(group);
        });
    }
    /**
     * Initialize individual collapse buttons
     */
    if (options.individualCollapse) {
        addGroupCollapseButtons();
    }
    // -------------------------------------------------------
    
    
    
    // -------------------------------------------------------
    // Events
    // -------------------------------------------------------    
    /**
     * New subform row added
     */
    document.addEventListener('subform-row-add', function(event) {
        if (options.individualCollapse) {
            addGroupCollapseButtons();
        }
        const wrapper =
            event.detail?.row?.closest(wrapperSelector) ||
            event.target.closest(wrapperSelector);
        if (wrapper) {
            requestAnimationFrame(function() {
                updateAllGlobalCollapseButtons();
            });
        }
    });
    /**
     * New subform row remove
     */
    document.addEventListener('subform-row-remove', function(event) {
        const wrapper =
            event.detail?.row?.closest(wrapperSelector) ||
            event.target.closest(wrapperSelector);
        if (wrapper) {
            requestAnimationFrame(function() {
                if (options.individualCollapse) {
                    addGroupCollapseButtons();
                }
                updateGlobalCollapseButton(wrapper);
            });
        }
    });
    /**
     * Initialize global buttons
     */
    document.querySelectorAll(wrapperSelector).forEach(function(wrapper) {
        updateGlobalCollapseButton(wrapper);
    });
    /**
     * Handle clicks
     * Works also for dynamically created buttons
     */
	    document.addEventListener('click', function(event) {
        const target = event.target.closest('[data-name]');
        if (!target) {
            return;
        }
        const action = target.getAttribute('data-name');
        /**
         * Main collapse button
         */
        if (action === 'phCollapseClick') {
            const collapseWrapper =
                target.closest(wrapperSelector);
            if (!collapseWrapper) {
                return;
            }
            toggleAllGroups(collapseWrapper);
            /**
             * Single subform collapse button
             */
        } else if (action === 'phCollapseClickGroup') {
            const group =
                target.closest(groupSelector);
            if (!group) {
                return;
            }
            toggleGroup(group);
            const wrapper =
                group.closest(wrapperSelector);
            if (wrapper) {
                updateGlobalCollapseButton(wrapper);
            }

			/**
			 * Menu / Category / Tag lists
         	*/
    	} else if (action === 'phCollapseClickMenu') {
        	toggleMenu();
			/**
			 * Article list
         	 */
    	} else if (action === 'phCollapseClickArticle') {
        	toggleArticles();
			/**
			 * Field / Contact lists
         	 */
    	} else if (action === 'phCollapseClickField') {
        	toggleFields();
    	}
 
    });
    


});


