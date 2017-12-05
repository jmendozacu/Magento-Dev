<?php
/**
 * Sitesquad - Refactoring modifications to core Magento files
 *
 * =============================================================================
 * NOTE: See README.txt for more information about this extension
 * =============================================================================
 *
 * @category   CSH
 * @package    CSH_Rewrite
 * @copyright  Copyright (c) 2015 Sitesquad. (http://www.sitesquad.net)
 * @license    http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 * @author     Phil Mobley <phil.mobley@sitesquad.net>
 */

/**
 * NOTE: this file does not exist in Core Magento -- added in case used by DB
 */
class CSH_Rewrite_Block_Catalog_Product_Special
    extends Mage_Catalog_Block_Product_Abstract
{
    protected $_productsCount = null;

    const DEFAULT_PRODUCTS_COUNT = 50;

    /**
     * Initialize block's cache
     */
    protected function _construct()
    {
        parent::_construct();

        $this->addColumnCountLayoutDepend('empty', 6)
            ->addColumnCountLayoutDepend('one_column', 5)
            ->addColumnCountLayoutDepend('two_columns_left', 4)
            ->addColumnCountLayoutDepend('two_columns_right', 4)
            ->addColumnCountLayoutDepend('three_columns', 3);

    }

    /**
     * Prepare collection with new products and applied page limits.
     *
     * return Mage_Catalog_Block_Product_New
     */
    protected function _beforeToHtml()
    {
        $todayDate  = Mage::app()->getLocale()->date()->toString(Varien_Date::DATETIME_INTERNAL_FORMAT);

        $collection = Mage::getResourceModel('catalog/product_collection');
        $collection->setVisibility(Mage::getSingleton('catalog/product_visibility')->getVisibleInCatalogIds());

        $collection = $this->_addProductAttributesAndPrices($collection)
            ->addStoreFilter()
            ->addAttributeToFilter('special_from_date', array('or'=> array(
                0 => array('date' => true, 'to' => $todayDate),
                1 => array('is' => new Zend_Db_Expr('null')))
            ), 'left')
            ->addAttributeToFilter('special_to_date', array('or'=> array(
                0 => array('date' => true, 'from' => $todayDate),
                1 => array('is' => new Zend_Db_Expr('null')))
            ), 'left')
            ->addAttributeToFilter(
                array(
                    array('attribute' => 'special_from_date', 'is'=>new Zend_Db_Expr('not null')),
                    array('attribute' => 'special_to_date', 'is'=>new Zend_Db_Expr('not null'))
                    )
              )
            ->addAttributeToSort('special_from_date', 'asc')
            
            
 
            
            
            
            ->setPageSize($this->getProductsCount())
            ->setCurPage(1)
        ;

        $this->setProductCollection($collection);

        return parent::_beforeToHtml();
    }

    /**
     * Set how much product should be displayed at once.
     *
     * @param $count
     * @return Mage_Catalog_Block_Product_New
     */
    public function setProductsCount($count)
    {
        $this->_productsCount = $count;
        return $this;
    }

    /**
     * Get how much products should be displayed at once.
     *
     * @return int
     */
    public function getProductsCount()
    {
        if (null === $this->_productsCount) {
            $this->_productsCount = self::DEFAULT_PRODUCTS_COUNT;
        }
        return $this->_productsCount;
    }
}
