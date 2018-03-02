<?php

class Simplesolutions_Groupedproduct_Model_Product_Type_Grouped
extends Mage_Catalog_Model_Product_Type_Abstract
{
    const TYPE_GROUPED = 'grouped';

    /**
     * Cache key for Associated Categories
     *
     * @var string
     */
    protected $_keyAssociatedCategories = '_cache_instance_associated_categories';


    /**
     * Cache key for Associated Category Ids
     *
     * @var string
     */
    protected $_keyAssociatedProductIds = '_cache_instance_associated_category_ids';


    /**
     * Cache key for Status Filters
     *
     * @var string
     */
    protected $_keyStatusFilters = '_cache_instance_status_filters';


    /**
     * Product is configurable
     *
     * @var bool
     */
    protected $_canConfigure = true;


    public function getGroupedProducts($product = null)
    {
        if (!$this->getProduct($product)->hasData($this->_keyAssociatedCategories))
        {
            $associated_categories = array();
            $category_collections = array();

            if (!Mage::app()->getStore()->isAdmin()) {
                $this->setSaleableStatus($product);
            }

            $associated_category = $product->getAssociatedCategories();

            // get category model
            $category_model = Mage::getModel('catalog/category');

            // $categoryid for which the child categories to be found
            $_category = $category_model->load($associated_category);

            $categories = $this->getChildrenCollection($associated_category);
            $associated_categories = $this->getGroupedCategories($categories);
            $category_collections = $associated_categories;

            $this->getProduct($product)->setData($this->_keyAssociatedCategories, $category_collections);
        }
        return $this->getProduct($product)->getData($this->_keyAssociatedCategories);
    }

    public function getGroupedCategories($categories)
    {
        $output = array();

        foreach($categories as $category)
        {
            $count = $category->getProductCount();
            $products = array();
            $children = array();

            if ($category->hasChildren())
            {
                $children = $this->getGroupedCategories($this->getChildrenCollection($category->getId()));
            }
            $collection = $category->getProductCollection()->getAllIds();

            foreach($collection as $item)
            {
                $product = new Mage_Catalog_Model_Product();
                $product = $product->load($item);
                $attributes = $product->getAttributes();

                foreach($attributes as $attribute) {
                    if ($attribute->getUsedInProductListing() && $attribute->getIsVisibleOnFront()
                        && $attribute->getFrontend()->getValue($product) && $attribute->getFrontEnd()->getValue($product) != 'No') {
                        $output[$category->getId()]['attributes'][$attribute->getAttributeCode()] = $attribute->getFrontend()->getLabel();
                    }
                }
                    $products[$item] = $product;
                }

                if ($children || $products)
                {
                    $output[$category->getId()]['count'] = $count;
                    $output[$category->getId()]['name'] = $category->getName();
                    $output[$category->getId()]['children'] = $children;
                    $output[$category->getId()]['products'] = $products;
                }
            }
            return $output;
        }

        public function getChildrenCollection($parentId=false, $sort='ASC', $attribute='position')
        {
            if (empty($parentId) || !is_numeric($parentId))
            {
                return false;
            }

            $childrenArray = explode(',', Mage::getModel('catalog/category')->load($parentId)->getChildren());

            // remove parent id from array in case it gets returned
            if ($key = array_search($parentId, $childrenArray))
            {
                unset($childrenArray[$key]);
            }

            $collection = Mage::getModel('catalog/category')->getCollection()->addAttributeToFilter('entity_id', array('in' => $childrenArray))->addAttributeToSelect('*');

            if (!empty($sort))
            {
                return $collection->setOrder($attribute, $sort);
            }

            return $collection;
        }

        /**
         * Retrieve related products identifiers
         *
         * @param Mage_Catalog_Model_Product $product
         * @return array
         */
        public function getAssociatedProductIds($product = null)
        {
            if (!$this->getProduct($product)->hasData($this->_keyAssociatedProductIds)) {

                $category_filter = array();
                $associated_category = $product->getAssociatedCategories();

                $category = Mage::getModel('catalog/category')->load($associated_category);
                $categories = $category->getAllChildren(true);

                foreach ($categories as $cat) {
                    $category = new Mage_Catalog_Model_Category();
                    $category->load($cat);
                    $collection = $category->getProductCollection()->getAllIds();

                    foreach ($collection as $item) {
                        $product = new Mage_Catalog_Model_Product();
                        $product = $product->load($item);
                        $_productCollection[] = $product;
                    }
                }
                $this->getProduct($product)->setData($this->_keyAssociatedProductIds, $_productCollection);
            }
            return $this->getProduct($product)->getData($this->_keyAssociatedProductIds);
        }

        /**
         * Set only saleable filter
         *
         * @param  Mage_Catalog_Model_Product $product
         * @return Mage_Catalog_Model_Product_Type_Grouped
         */
        public function setSaleableStatus($product = null)
        {
            $this->getProduct($product)->setData($this->_keyStatusFilters,
                Mage::getSingleton('catalog/product_status')->getSaleableStatusIds());

            return $this;
        }

        /**
         * Prepare selected qty for grouped product's options
         *
         * @param  Mage_Catalog_Model_Product $product
         * @param  Varien_Object $buyRequest
         * @return array
         */
        public function processBuyRequest($product, $buyRequest)
        {
            $superGroup = $buyRequest->getSuperGroup();
            $superGroup = (is_array($superGroup)) ? array_filter($superGroup, 'intval') : array();

            $options = array('super_group' => $superGroup);

            return $options;
        }

        /**
         * Prepare product and its configuration to be added to some products list.
         * Perform standard preparation process and add logic specific to Grouped product type.
         *
         * @param Varien_Object $buyRequest
         * @param Mage_Catalog_Model_Product $product
         * @param string $processMode
         * @return array|string
         */
        protected function _prepareProduct(Varien_Object $buyRequest, $product, $processMode)
        {
            $product = $this->getProduct($product);
            $productsInfo = $buyRequest->getSuperGroup();
            $isStrictProcessMode = $this->_isStrictProcessMode($processMode);

            if (!$isStrictProcessMode || (!empty($productsInfo) && is_array($productsInfo)))
            {
                $products = array();
                $associatedProductsInfo = array();
                $associatedProducts = $this->getAssociatedProductIds($product);

                if ($associatedProducts || !$isStrictProcessMode)
                {
                    foreach ($associatedProducts as $subProduct)
                    {
                        $subProductId = $subProduct->getId();

                        if (isset($productsInfo[$subProductId]))
                        {
                            $qty = $productsInfo[$subProductId];

                            if (!empty($qty) && is_numeric($qty))
                            {
                                $_result = $subProduct->getTypeInstance(true)->_prepareProduct($buyRequest, $subProduct, $processMode);

                                if (is_string($_result) && !is_array($_result))
                                {
                                    return $_result;
                                }

                                if (!isset($_result[0]))
                                {
                                    return Mage::helper('checkout')->__('Cannot process the item.');
                                }

                                if ($isStrictProcessMode) {
                                    $_result[0]->setCartQty($qty);
                                    $_result[0]->addCustomOption('product_type', self::TYPE_GROUPED, $product);
                                    $_result[0]->addCustomOption('info_buyRequest',
                                        serialize(array(
                                            'super_product_config' => array(
                                                'product_type'  => self::TYPE_GROUPED,
                                                'product_id'    => $product->getId()
                                            )
                                        ))
                                    );
                                    $products[] = $_result[0];
                                } else {
                                    $associatedProductsInfo[] = array($subProductId => $qty);
                                    $product->addCustomOption('associated_product_' . $subProductId, $qty);
                                }
                            }
                        }
                    }
                }

                if (!$isStrictProcessMode || count($associatedProductsInfo)) {
                    $product->addCustomOption('product_type', self::TYPE_GROUPED, $product);
                    $product->addCustomOption('info_buyRequest', serialize($buyRequest->getData()));

                    $products[] = $product;
                }

                if (count($products)) {
                    return $products;
                }
            }

            return Mage::helper('catalog')->__('Please specify the quantity of product(s).');
    }
}