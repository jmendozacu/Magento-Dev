<?php

/**
 * Magestore
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Magestore.com license that is
 * available through the world-wide-web at this URL:
 * http://www.magestore.com/license-agreement.html
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade this extension to newer
 * version in the future.
 *
 * @category    Magestore
 * @package     Magestore_Sociallogin
 * @module      Sociallogin
 * @author      Magestore Developer
 *
 * @copyright   Copyright (c) 2016 Magestore (http://www.magestore.com/)
 * @license     http://www.magestore.com/license-agreement.html
 *
 */
class Magestore_Sociallogin_Block_Fblogin extends Mage_Core_Block_Template
{
    /**
     * @return mixed
     */
    public function getLoginUrl() {
        return $this->getUrl('sociallogin/fblogin/login');
    }

    /**
     * @return mixed
     */
    public function getFbUser() {
        return Mage::getModel('sociallogin/fblogin')->getFbUser();
    }

    /**
     * @return mixed
     */
    public function getFbLoginUrl() {
        return Mage::getModel('sociallogin/fblogin')->getFbLoginUrl();
    }

    /**
     * @return mixed
     */
    public function getDirectLoginUrl() {
        return Mage::helper('sociallogin')->getDirectLoginUrl();
    }

    /**
     * @return mixed
     */
    protected function _beforeToHtml() {
        return parent::_beforeToHtml();
    }
}