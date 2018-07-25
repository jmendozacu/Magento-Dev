<?php
/**
 * Copyright (c) 2013 Hawksearch (www.hawksearch.com) - All Rights Reserved
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */
class Hawksearch_Datafeed_Block_System_Config_Frontend_Clearts_Js
	extends Mage_Adminhtml_Block_Template {

    /**
     * constructor
     */
    protected function _construct() {
		parent::_construct();
		$this->setTemplate('hawksearch/datafeed/clearts/js.phtml');
	}


    /**
     * @return string
     */
    public function getClearUrl() {
        return Mage::getModel('adminhtml/url')->getUrl(
            'adminhtml/hawkdatagenerate/clearTimestamp',
            array(
                '_secure' => true,
                '_store' => Mage_Core_Model_App::ADMIN_STORE_ID
            )
        );

	}
}