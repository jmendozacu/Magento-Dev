<?php
/**
 * NOTICE OF LICENSE
 *
 * You may not sell, sub-license, rent or lease
 * any portion of the Software or Documentation to anyone.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade to newer
 * versions in the future.
 *
 * @category   ET
 * @package    ET_CurrencyManager
 * @copyright  Copyright (c) 2012 ET Web Solutions (http://etwebsolutions.com)
 * @contacts   support@etwebsolutions.com
 * @license    http://shop.etwebsolutions.com/etws-license-free-v1/   ETWS Free License (EFL1)
 */

class ET_CurrencyManager_Model_Currency extends Mage_Directory_Model_Currency
{

    public function format($price, $options = array(), $includeContainer = true, $addBrackets = false)
    {
        if (method_exists($this, "formatPrecision")) {
            $options = Mage::helper('currencymanager')->getOptions(array());

            return $this->formatPrecision(
                $price,
                isset($options["precision"]) ? $options["precision"] : 2,
                Mage::helper('currencymanager')->clearOptions($options),
                $includeContainer,
                $addBrackets
            );
        }
        return parent::format($price, $options, $includeContainer, $addBrackets);
    }

    public function getOutputFormat()
    {
        $formatted = $this->formatTxt(10);
        $number = $this->formatTxt(10, array('display' => Zend_Currency::NO_SYMBOL));
        return str_replace($number, '%s', $formatted);
    }

    public function formatTxt($price, $options = array())
    {
        /* @var $helper ET_CurrencyManager_Helper_Data */
        $helper = Mage::helper('currencymanager');

        $answer = parent::formatTxt($price, $helper->clearOptions($options));

        if ($helper->isEnabled()) {
            $moduleName = Mage::app()->getRequest()->getModuleName();

            $optionsAdvanced = $helper->getOptions($options, false, $this->getCurrencyCode());
            $options = $helper->getOptions($options, true, $this->getCurrencyCode());

            $answer = parent::formatTxt($price, $options);

            if (count($options) > 0) {
                if (($moduleName == 'admin')) {
                    $answer = parent::formatTxt($price, $helper->clearOptions($options));
                }

                //check against -0
                $answer = $this->_formatWithPrecision($options, $optionsAdvanced, $price, $answer);

                if (!($helper->isInOrder() & $optionsAdvanced['excludecheckout'])) {
                    if ($price == 0) {
                        if (isset($optionsAdvanced['zerotext']) && $optionsAdvanced['zerotext'] != "") {
                            return $optionsAdvanced['zerotext'];
                        }
                    }

                    $answer = $this->_cutZeroDecimal($options, $optionsAdvanced, $price, $answer);
                }
            }
        }
		$answer = '$' . preg_replace("/(?<=\\.[0-9]{3})[0]+\$/", "", str_replace('$', '', $answer));
		$answer = '$' . preg_replace("/(?<=\\.[0-9]{2})[0]+\$/", "", str_replace('$', '', $answer));

		if ($_SERVER['REMOTE_ADDR'] == '72.224.80.40') {
			//$mage_request = Mage::app()->getRequest();
			//$mage_request = Mage::app();
			//Mage::Log('get_class_methods: ' . print_r(get_class_methods($mage_request), true));
			//Mage::Log('Mage::app() methods: ' . print_r(get_class_methods(Mage::app()), true));
			
			
			
			
			//Mage::Log('answer: ' . print_r($answer, true));
			//Mage::Log('getArea: ' . print_r(get_class_methods($mage_request->getArea()), true));
			//Mage::Log('getLayout: ' . print_r($mage_request->getLayout(), true));			
			//Mage::Log('getFrontController: ' . print_r(get_class_methods($mage_request->getFrontController()), true));
			//Mage::Log('getLayout methods: ' . print_r(get_class_methods($mage_request->getLayout()), true));	
			
			//Mage::Log('getLayout getArea methods: ' . print_r(get_class_methods($mage_request->getLayout()->getArea()), true));
			//Mage::Log('getLayout getArea: ' . print_r($mage_request->getLayout()->getArea(), true));
			
			
			
			
			
			
			/*Mage::Log('getControllerName: ' . print_r($mage_request->getControllerName(), true));
			Mage::Log('getControllerModule: ' . print_r($mage_request->getControllerModule(), true));
			Mage::Log('getModuleName: ' . print_r($mage_request->getModuleName(), true));
			Mage::Log('getActionName: ' . print_r($mage_request->getActionName(), true));
			Mage::Log('getRequestedRouteName: ' . print_r($mage_request->getRequestedRouteName(), true));
			Mage::Log('getRequestedControllerName: ' . print_r($mage_request->getRequestedControllerName(), true));
			Mage::Log('getRequestedActionName: ' . print_r($mage_request->getRequestedActionName(), true));*/
			//echo '<pre>te';
			//print_r($this);
			//Varien_Debug::backtrace();
			//print_r(Mage::app());
			//print_r(Mage::getIsDeveloperMode());
			//echo '</pre>';
			//echo '<h1>' . print_r($this->getResource(), true) . '</h1>';
			//print_r(get_class_methods(get_class($this))); 
			//echo Zend_Debug::dump($this);
			//echo 'tp' . $this->getTemplateFile(); 
			
			
			//if ($totalCode == 'subtotal') {
			//	$answer = $this->ceil_dec($answer, 2);
			//}
		}
        return $answer;
    }
	public function ceil_dec($number, $precision)
    {
        $coefficient = pow(10,$precision);
        return ceil($number*$coefficient)/$coefficient;
    }
	
    protected function _formatWithPrecision($options, $optionsAdvanced, &$price, $answer)
    {
        $helper = Mage::helper('currencymanager');
        if (isset($optionsAdvanced['precision'])) {
            $price = round($price, $optionsAdvanced['precision']);
            if ($optionsAdvanced['precision'] < 0) {
                $options['precision'] = 0;
            }

            //for correction -0 float zero
            if ($price == 0) {
                $price = 0;
            }
            //if no need to cut zero we must recreate default answer
            return parent::formatTxt($price, $helper->clearOptions($options));
        }
        return $answer;
    }

    protected function _cutZeroDecimal($options, $optionsAdvanced, $price, $answer)
    {
        $helper = Mage::helper('currencymanager');
        $zeroDecimal = (round($price, $optionsAdvanced['precision']) == round($price, 0));
        $suffix = isset($optionsAdvanced['cutzerodecimal_suffix']) ? $optionsAdvanced['cutzerodecimal_suffix'] : "";
        if ($optionsAdvanced['cutzerodecimal'] && $zeroDecimal) { // cut decimal if it is equal to 0
            if ((isset($suffix)) && (strlen($suffix) > 0)) { // if need to add suffix
                // searching for fully formatted currency without currency symbol
                $options['display'] = Zend_Currency::NO_SYMBOL;
                $answerBlank = $this->_localizeNumber(parent::formatTxt($price, $options), $options);

                //print "answerBlank: " . $answerBlank . "<br />";
                // searching for fully formatted currency without currency symbol and rounded to int
                $options['precision'] = 0;
                $answerRound = $this->_localizeNumber(parent::formatTxt($price,
                    $helper->clearOptions($options)
                ), $options);
                //print "answerRound: " . $answerRound . "<br />";

                // replace cut decimals with suffix
                $answer = str_replace($answerBlank, $answerRound . $suffix, $answer);
                return $answer;
            } else { // only changing precision
                $options['precision'] = 0;
                $answer = parent::formatTxt($price, $helper->clearOptions($options));
                return $answer;
            }
        } else {
            return $answer;
        }
    }

    protected function _localizeNumber($number, $options = array())
    {
        $options = Mage::helper('currencymanager')->getOptions($options, true, $this->getCurrencyCode());
        if ($options['display'] == Zend_Currency::NO_SYMBOL) {
            // in Zend_Currency toCurrency() function
            // are stripped unbreakable spaces only for currency without Currency Symbol
            return $number;
        } else {
            $locale = Mage::app()->getLocale()->getLocaleCode();
            $format = Zend_Locale_Data::getContent($locale, 'decimalnumber');
            $numberOptions = array(
                'locale' => $locale,
                'number_format' => $format,
                'precision' => 0,
            );
            $number = Zend_Locale_Format::getNumber($number, $numberOptions);
            return Zend_Locale_Format::toNumber($number, $numberOptions);
        }
    }

    //sometimes we need make correction
    public function convert($price, $toCurrency = null)
    {
        $result = parent::convert($price, $toCurrency);
        $data = new Varien_Object(array(
            "price" => $price,
            "toCurrency" => $toCurrency,
            "result" => $result
        ));
        Mage::dispatchEvent("currency_convert_after", array("conversion" => $data));
        return $data->getData("result");
    }

}