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
$opts = getopt('r:t:i:');
chdir($opts['r']);
require 'app/Mage.php';

Mage::app()->setCurrentStore(Mage_Core_Model_App::ADMIN_STORE_ID);
/** @var Mage $app */
$app = Mage::app();

$helper = Mage::helper('hawksearch_datafeed');
$datafeed = Mage::getModel('hawksearch_datafeed/datafeed');

if ($helper->isFeedLocked()) {
	Mage::throwException("One or more feeds are being generated. Generation temporarily locked.");
}
if ($helper->createFeedLocks()) {
	if (isset($opts['i'])) {
        $datafeed->refreshImageCache();
	} else {
        $datafeed->generateFeed();
	}
}
unlink($opts['t']);

