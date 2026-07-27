<?php
/* @package Joomla
 * @copyright Copyright (C) Open Source Matters. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @extension Phoca Extension
 * @copyright Copyright (C) Jan Pavelka www.phoca.cz
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL
 */

use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Plugin\CMSPlugin;

defined('_JEXEC') or die('Restricted access');

jimport('joomla.plugin.plugin');

class plgSystemPhocaCollapse extends CMSPlugin
{
	protected $autoloadLanguage = true;

	public function __construct(&$subject, $config)
	{
		$this->loadLanguage('plg_system_phocacollapse');
		parent::__construct($subject, $config);
	}

	public function onBeforeRender()
	{
		$app = Factory::getApplication();

		if ($app->getDocument()->getType() !== 'html') {
			return true;
		}

		$frontend_active = $this->params->get('frontend_active', 0);

		if ($frontend_active == 0 && !Factory::getApplication()->isClient('administrator')) {
			return true;
		}

		$wa = $app->getDocument()->getWebAssetManager();

		$wa->registerAndUseScript(
			'plg_system_phocacollapse.phocacollapse',
			'media/plg_system_phocacollapse/js/phocacollapse.es6.js',
			['version' => 'auto']
		);

		$wa->registerAndUseStyle(
			'plg_system_phocacollapse.phocacollapse',
			'media/plg_system_phocacollapse/css/phocacollapse.css',
			['version' => 'auto']
		);


		$wa->addInlineScript(
			'window.phocaCollapseOptions = ' . json_encode([
				'iconStyle'           	=> $this->params->get('icon_style', 'eye'),
				'individualCollapse'  	=> (int) $this->params->get('individual_collapse', 0),
				'preserveCollapseState' => (int) $this->params->get('preserve_collapse_state', 0),
				
				'expandText'          => Text::_('PLG_SYSTEM_PHOCACOLLAPSE_EXPAND'),
				'collapseText'        => Text::_('PLG_SYSTEM_PHOCACOLLAPSE_COLLAPSE'),
				
				'expandAllText'       => Text::_('PLG_SYSTEM_PHOCACOLLAPSE_EXPAND_ALL'),
				'collapseAllText'     => Text::_('PLG_SYSTEM_PHOCACOLLAPSE_COLLAPSE_ALL'),		
			]) . ';'
		);


		return true;
	}

	public function onAfterRender()
	{
		$app = Factory::getApplication();

		if ($app->getDocument()->getType() !== 'html') {
			return true;
		}

		$frontend_active = $this->params->get('frontend_active', 0);

		if ($frontend_active == 0 && !Factory::getApplication()->isClient('administrator')) {
			return true;
		}

		$text_format = $this->params->get('text_format', 1);
		$icon_style  = $this->params->get('icon_style', 'eye');

		
		$text = Text::_('PLG_SYSTEM_PHOCACOLLAPSE_COLLAPSE_ALL');
	
		$class = 'btn btn-sm btn-secondary phCollapseClick';

		switch ($icon_style) {

			case 'chevron':
				$icon = '<span class="icon-chevron-down" aria-hidden="true"></span>';
				$iconOnly = '<span class="icon-chevron-down icon-white" aria-hidden="true" style="pointer-events:none;"></span>';
			break;

			case 'eye':
			default:
				$icon = '<span class="icon-eye" aria-hidden="true"></span>';
				$iconOnly = '<span class="icon-eye icon-white" aria-hidden="true" style="pointer-events:none;"></span>';
			break;
		}

		switch ($text_format) {

			case 2:
				// Text only
				$text = '<span class="ph-collapse-text">'
					. Text::_('PLG_SYSTEM_PHOCACOLLAPSE_COLLAPSE_ALL')
					. '</span>';
			break;

			case 3:
				// Icon only
				$text = $iconOnly;
				$class = 'group-show btn btn-sm btn-secondary phCollapseClick';
			break;

			case 1:
			default:
				// Icon + Text
				$text = $icon . ' <span class="ph-collapse-text">'
					. Text::_('PLG_SYSTEM_PHOCACOLLAPSE_COLLAPSE_ALL')
					. '</span>';
					
			break;
		}

		$buffer = $app->getBody();

		$from = '<div class="subform-repeatable-wrapper subform-layout">';

		$to = $from
			. '<div class="ph-collapse">'
			. '<a href="javascript:void(0)" class="' . $class . '" data-name="phCollapseClick">'
			. $text
			. '</a></div>';
		
		$buffer = str_replace($from, $to, $buffer);





		$from = '<table class="table itemList" id="articleList">';
		$to   = $from
			. '<div class="ph-collapse">'
			. '<a href="javascript:void(0)" class="' . $class . '" data-name="phCollapseClickArticle">'
			. $text
			. '</a></div>';

		$buffer = str_replace($from, $to, $buffer);
		
		
$from = '<table class="table" id="menuitemList">';
		$to   = $from
			. '<div class="ph-collapse">'
			. '<a href="javascript:void(0)" class="' . $class . '" data-name="phCollapseClickMenu">'
			. $text
			. '</a></div>';

		$buffer = str_replace($from, $to, $buffer);



		
$from = '<table class="table" id="categoryList">';
		$to   = $from
			. '<div class="ph-collapse">'
			. '<a href="javascript:void(0)" class="' . $class . '" data-name="phCollapseClickMenu">'
			. $text
			. '</a></div>';

		$buffer = str_replace($from, $to, $buffer);
			
		
$from = '<table class="table" id="tagList">';
		$to   = $from
			. '<div class="ph-collapse">'
			. '<a href="javascript:void(0)" class="' . $class . '" data-name="phCollapseClickMenu">'
			. $text
			. '</a></div>';

		$buffer = str_replace($from, $to, $buffer);		
						
		

			

$from = '<table class="table" id="fieldList">';
		$to   = $from
			. '<div class="ph-collapse">'
			. '<a href="javascript:void(0)" class="' . $class . '" data-name="phCollapseClickField">'
			. $text
			. '</a></div>';

		$buffer = str_replace($from, $to, $buffer);	
			
		
$from = '<table class="table" id="contactList">';
		$to   = $from
			. '<div class="ph-collapse">'
			. '<a href="javascript:void(0)" class="' . $class . '" data-name="phCollapseClickField">'
			. $text
			. '</a></div>';

		$buffer = str_replace($from, $to, $buffer);			


		

		$app->setBody($buffer);

		return true;
	}
}

