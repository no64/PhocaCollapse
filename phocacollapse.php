<?php
/**
 * @package     Joomla.Plugin
 * @subpackage  System.PhocaCollapse
 * @extension 	Phoca Extension
 *
 * @copyright   Copyright (C) 2026 Jan Pavelka - www.phoca.cz.
 * @copyright   Copyright (C) 2026 Niklas Olofsson - www.2n2media.de.
 * @license 	http://www.gnu.org/copyleft/gpl.html GNU/GPL
 *
 * @author      Jan Pavelka
 * @author      Niklas Olofsson
 */
 

use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Plugin\CMSPlugin;

defined('_JEXEC') or die('Restricted access');


class plgSystemPhocaCollapse extends CMSPlugin
{
	protected $autoloadLanguage = true;

	public function __construct(&$subject, $config) {
		$this->loadLanguage('plg_system_phocacollapse');
		parent::__construct($subject, $config);
	}

	public function onBeforeRender() {
		$app = Factory::getApplication();

		if ($app->getDocument()->getType() !== 'html') {
			return true;
		}

		$frontend_active = $this->params->get('frontend_active', 0);

		if ($frontend_active == 0 && !Factory::getApplication()->isClient('administrator')) {
			return true;
		}


		$wa = $app->getDocument()->getWebAssetManager();

		// Check if Joomla global system debugging is enabled (returns true or false)
		$debug = (bool) Factory::getApplication()->get('debug', 0);

		// Use Joomla's native 'auto' for production, but a pure timestamp for debugging
		// This eliminates the need to manually update version numbers in PHP code during a release!
		$assetVersion = $debug ? 'debug_' . time() : 'auto';

		// Dynamic routing: Load unminified source code for debugging, or optimized minified script for production
		$jsFile = $debug ? 'media/plg_system_phocacollapse/js/phocacollapse.es6.js' : 'media/plg_system_phocacollapse/js/phocacollapse.es6.min.js';

		// Register and inject the selected JavaScript file asset
		$wa->registerAndUseScript(
			'plg_system_phocacollapse.phocacollapse',
			$jsFile,
			['version' => $assetVersion]
		);


		// Register and inject the core plugin stylesheet asset
		$wa->registerAndUseStyle(
			'plg_system_phocacollapse.phocacollapse',
			'media/plg_system_phocacollapse/css/phocacollapse.css',
			['version' => $assetVersion]
		);



		$wa->addInlineScript(
			'window.phocaCollapseOptions = ' . json_encode([
				// Group 1: Standard text strings strictly at the top for early parser pass
				'expandText'            => Text::_('PLG_SYSTEM_PHOCACOLLAPSE_EXPAND'),
				'collapseText'          => Text::_('PLG_SYSTEM_PHOCACOLLAPSE_COLLAPSE'),
				'expandAllText'         => Text::_('PLG_SYSTEM_PHOCACOLLAPSE_EXPAND_ALL'),
				'collapseAllText'       => Text::_('PLG_SYSTEM_PHOCACOLLAPSE_COLLAPSE_ALL'),
				
				// Group 2: Visual styling selectors
				'iconStyle'             => $this->params->get('icon_style', 'chevron'),
				'storageType'           => $this->params->get('storage_type', 'session'),
				
				// Group 3: Strict integer evaluation blocks at the bottom
				'titleFieldIndex'       => (int) $this->params->get('title_field_index', 1),
				'initialCollapseState'  => (int) $this->params->get('initial_collapse_state', 0),				
				'initialNestedCollapse' => (int) $this->params->get('initial_nested_collapse', 1),
				'individualCollapse'    => (int) $this->params->get('individual_collapse', 1),
				'preserveCollapseState' => (int) $this->params->get('preserve_collapse_state', 1),
				'restoreCollapseState'  => (int) $this->params->get('restore_collapse_state_after_save', 1),
				'showResetButton'       => (int) $this->params->get('show_reset_button', 1),
				'listCollapseActive'    => (int) $this->params->get('list_collapse_active', 1),
			]) . ';'
		);

		return true;


	}

	public function onAfterRender() {
		$app = Factory::getApplication();

		if ($app->getDocument()->getType() !== 'html') {
			return true;
		}

		$frontend_active = $this->params->get('frontend_active', 0);

		if ($frontend_active == 0 && !Factory::getApplication()->isClient('administrator')) {
			return true;
		}

		// FIXED: Set the correct dynamic text fallback default matching the new XML options
		$button_style 	= $this->params->get('button_style', 'icon_text');
		$icon_style  	= $this->params->get('icon_style', 'chevron');

		$text = Text::_('PLG_SYSTEM_PHOCACOLLAPSE_COLLAPSE_ALL');
		$class = 'btn btn-sm btn-secondary phCollapseClick';

		switch ($icon_style) {
			case 'chevron':
				$icon = '<span class="ph-collapse-icon icon-chevron-down" aria-hidden="true"></span>';
				$iconOnly = '<span class="ph-collapse-icon icon-chevron-down" aria-hidden="true" style="pointer-events:none;"></span>';
			break;

			case 'eye':
			default:
				$icon = '<span class="ph-collapse-icon icon-eye" aria-hidden="true"></span>';
				$iconOnly = '<span class="ph-collapse-icon icon-eye" aria-hidden="true" style="pointer-events:none;"></span>';
			break;
		}

		// Evaluating human-readable string values instead of generic numbers for professional code standards
		switch ($button_style) {
			case 'text_only':
				// Text only
				$text = '<span class="ph-collapse-text">'
					. Text::_('PLG_SYSTEM_PHOCACOLLAPSE_COLLAPSE_ALL')
					. '</span>';
			break;

			case 'icon_only':
				// Icon only
				$text = $iconOnly;
				$class = 'group-show btn btn-sm btn-secondary phCollapseClick';
			break;

			case 'icon_text':
			default:
				// Icon + Text
				$text = $icon . ' <span class="ph-collapse-text">'
					. Text::_('PLG_SYSTEM_PHOCACOLLAPSE_COLLAPSE_ALL')
					. '</span>';
			break;
		}



		$buffer = $app->getBody();

		// --- STATUS INDICATORS FOR USER EXPERIENCE (OPTIONAL VERSION) ---------------------
		$preserveState   = (int) $this->params->get('preserve_collapse_state', 1);
		$restoreState    = (int) $this->params->get('restore_collapse_state_after_save', 1);
		$storageType     = $this->params->get('storage_type', 'session');
		$showIndicators  = (int) $this->params->get('show_status_indicators', 1);
		$indicators      = '';
		

		// Icons are generated only if state preservation is active AND enabled in parameters
		if ($preserveState === 1 && $showIndicators === 1) {
			$iconSpans = '<span class="indicator icon-bookmark text-muted" title="' 
				. Text::_('PLG_SYSTEM_PHOCACOLLAPSE_INDICATOR_PRESERVE_ACTIVE') . '" aria-hidden="true"></span>';
				
			if ($restoreState === 1) {
				if ($storageType === 'local') {
					$iconSpans .= '<span class="indicator icon-database text-muted" title="' 
						. Text::_('PLG_SYSTEM_PHOCACOLLAPSE_INDICATOR_LOCAL') . '" aria-hidden="true"></span>';
				} else {
					$iconSpans .= '<span class="indicator icon-clock text-muted" title="' 
						. Text::_('PLG_SYSTEM_PHOCACOLLAPSE_INDICATOR_SESSION') . '" aria-hidden="true"></span>';
				}
			}

			// Wrap individual indicator icons inside a matching container group layout element
			$indicators = '<div class="ph-indicator-group">' . $iconSpans . '</div>';
		}
		// ----------------------------------------------------------------------------------

		// --- GLOBAL RESET BUTTON CONTROLS -------------------------------------------------
		$showReset = (int) $this->params->get('show_reset_button', 1);
		$resetBtn  = '';

		// The reset trigger control is created only if state preservation is active AND enabled
		if ($preserveState === 1 && $showReset === 1) {
			$resetBtn = '<a href="javascript:void(0)" class="text-muted ph-reset-icon-trigger" data-name="phCollapseReset" title="' . Text::_('PLG_SYSTEM_PHOCACOLLAPSE_RESET_ALL') . '">'
				. '<span class="icon-loop" aria-hidden="true"></span>'
				. '</a>';
		}
		// ----------------------------------------------------------------------------------

		// CORE MASTER BUTTON INJECTION (For repeatable and non-repeatable subforms) --------
		$from = '<div class="subform-repeatable-wrapper subform-layout">';
		$to = $from
			. '<div class="ph-collapse">'
			. $indicators
			. $resetBtn			
			. '<a href="javascript:void(0)" class="' . $class . '" data-name="phCollapseClick">'
			. $text
			. '</a>'
			. '</div>';
		
		$buffer = str_replace($from, $to, $buffer);
		// ----------------------------------------------------------------------------------
		
		
		// List views master toggle buttons are injected only if option is enabled ------------
		if ((int) $this->params->get('list_collapse_active', 1) === 1) {

			// Validation: Inject buttons directly BEFORE the table element tag to guarantee valid HTML5 layouts
			
			$from = '<table class="table" id="menuitemList">';
			$to   = '<div class="ph-collapse"><a href="javascript:void(0)" class="' . $class . '" data-name="phCollapseClickList">' . $text . '</a></div>' . $from;
			$buffer = str_replace($from, $to, $buffer);

			$from = '<table class="table" id="tagList">';
			$to   = '<div class="ph-collapse"><a href="javascript:void(0)" class="' . $class . '" data-name="phCollapseClickList">' . $text . '</a></div>' . $from;
			$buffer = str_replace($from, $to, $buffer);	
			
			$from = '<table class="table" id="categoryList">';
			$to   = '<div class="ph-collapse"><a href="javascript:void(0)" class="' . $class . '" data-name="phCollapseClickList">' . $text . '</a></div>' . $from;
			$buffer = str_replace($from, $to, $buffer);
				
			$from = '<table class="table itemList" id="articleList">';
			$to   = '<div class="ph-collapse"><a href="javascript:void(0)" class="' . $class . '" data-name="phCollapseClickArticle">' . $text . '</a></div>' . $from;
			$buffer = str_replace($from, $to, $buffer);
						
			$from = '<table class="table" id="contactList">';
			$to   = '<div class="ph-collapse"><a href="javascript:void(0)" class="' . $class . '" data-name="phCollapseClickArticle">' . $text . '</a></div>' . $from;
			$buffer = str_replace($from, $to, $buffer);			

			$from = '<table class="table" id="fieldList">';
			$to   = '<div class="ph-collapse"><a href="javascript:void(0)" class="' . $class . '" data-name="phCollapseClickArticle">' . $text . '</a></div>' . $from;
			$buffer = str_replace($from, $to, $buffer);	

		} // End of list view injection check
		// ----------------------------------------------------------------------------------


		$app->setBody($buffer);
		return true;


	}

}
	
