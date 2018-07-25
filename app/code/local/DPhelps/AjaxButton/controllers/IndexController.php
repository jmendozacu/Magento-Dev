<?php

/* DPhelps_AjaxButton_IndexController */

class DPhelps_AjaxButton_IndexController extends Mage_Core_Controller_Front_Action {

    public function indexAction() {
        $result = Mage::getModel('dphelpsajaxbutton/logic')->priceThreshold($this->getRequest()->getParam('price'));

        $this->loadLayout();
        $this->getLayout()->getBlock('root')->setResult($result);
        $this->renderLayout();
    }
}