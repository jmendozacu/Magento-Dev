<?php
class CSH_OnepageNewsletter_Model_Observer
{

    public function AssignNewsletter(Varien_Event_Observer $observer)
    {
    $event = $observer->getEvent();
            $order = $event->getOrder();
        $Quote =$event->getQuote();
        if (in_array($Quote()->getCheckoutMethod(), array('register','customer'))):

            if Mage::app()->getFrontController()->getParam('is_subscribed', false)){
        $status = Mage::getModel('newsletter/subscriber')->subscribe($Quote->getBillingAddress()->getEmail());
         }
        endif;
    }

}