var sku_info = {},
	skus_to_load = [],
	pending_skus = [],
	is_updating = false,
	cookie_session = "",
	vars = {}

function read_cookie(name) {
	var nameEQ = name + "="
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}

function split_parameters(param_list) {
	//if (!param_list) {
	//	return null
	//}
	param_list = decodeURIComponent(param_list).split("&")
	var params = {}
	var param = ""
	for (var i=0; i<param_list.length; i++) {
		param = param_list[i].split("=")
		params[param[0]] = encodeURIComponent(param[1])
	}
	return params
}

function save_sku_qty(elem) {
	var sku = elem.parentNode.parentNode.firstChild.nextSibling.innerHTML
	sku_info[sku].qty = elem.value
}

function NumbersOnly(myfield, e) {
	var key;
	var keychar;
	if (window.event) {
		key = window.event.keyCode;
	} else if (e) {
		key = e.which;
	} else {
		return true;
	}
	keychar = String.fromCharCode(key);
	// control keys
	if ((key==null) || (key==0) || (key==8) || (key==9) || (key==27) ) {
		return true;
	} else if ((key==13) || (key==32)) { // no enters or spaces
		return false;
	} else if (keychar=='.' && myfield.value.indexOf('.')>-1) { // only one deicmal
		return false;
	} else if ((("0123456789").indexOf(keychar) > -1)) { // numbers
		return true;
	} else {
		return false;
	}
}

// Makes the AJAX call for queued skus and writes received data to the appropriate <tr>
function flush_pending_skus() {
	var str = '', sku
	while (skus_to_load.length > 0) { // build the AJAX search string
		sku = skus_to_load.pop()
		//str += (str ? ("|or|searchexact~p.sku~" + sku) : ("searchexact~p.sku~" + sku))
		str += (str ? ("|" + sku) : (sku))
	}
	while (pending_skus.length > 0) { // seldom, if ever, will both of these while loops run in the same function call
		sku = pending_skus.pop()
		// gets the inner data of the <tr> returned by get_tr_from_sku() and writes it to the <tr> with id=sku
		// jQuery doesn't like periods or colons in the id (thinks it's a CSS selector), so we escape it with .replace()
		jQuery("#" + sku.replace(/(:|\.)/g,'\\$1')).html(jQuery('<div />').html(get_tr_from_sku(sku)).children(":first").html())
	}
	if (str) { // if a search string was built, make the AJAX call below
		jQuery.get("/ssajax", {rb_id: "0AFBE47B797546FFB51B455F9E12553A", sku: str}, function(data) {
			jQuery("record", data).each(function () {
				var record = jQuery(this)
				sku = record.find("sku").text()
				sku_info[sku] = {}
				sku_info[sku].p_key = record.find("p_key").text()
				sku_info[sku].nm = record.find("nm").text()
				sku_info[sku].ds = jQuery('<div />').html(record.find("ds").text()).text()
				sku_info[sku].retail_price = parseFloat(record.find("retail_price").text())
				sku_info[sku].image = record.find("thumb").text()
				sku_info[sku].qty = ''
				pending_skus.push(sku)
			})
			// the is_updating flag is set and cleared by update_parts(); we don't want to write the pending skus until update_parts() finishes
			//  update_parts() calls flush_pending_skus() when it is done
			if (!is_updating) {
				flush_pending_skus()
			}
		})
	}
}

function get_tr_from_sku(sku) {
	if (!sku_info[sku]) { // if the sku hasn't been stored, we need to get it
		// queue the sku for the AJAX call
		skus_to_load.push(sku)
		// return an empty <tr> that will be populated once the AJAX call is made
		return '<tr id="' + sku + '"><td class="sku_image">&nbsp;</td><td class="sku_td">' + sku + '</td><td>Loading product info...</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>'
	} else {
		var str = '<tr id="' + sku + '"><td class="sku_image"><img src="' + sku_info[sku].image + '" /></td>'
		str += '<td class="sku_td">' + sku + '</td>'
		str += '<td><div class="sku_name">' + sku_info[sku].nm + '</div><div class="sku_desc">' + sku_info[sku].ds + '</div><div class="toggle_desc"><a onclick="toggle_desc(this); return false;" href="#">[+] Show more</a></div></td>'
		str += '<td class="sku_price">$' + sku_info[sku].retail_price.toFixed(2) + '</td>'
		str += '<td>&nbsp;Qty: <input type="hidden" name="keys" value="' + sku_info[sku].p_key + '" /><input type="text" name="qty[' + sku_info[sku].p_key + ']" onfocus="this.select();" onkeypress="return NumbersOnly(this, event);" onchange="save_sku_qty(this)" value="' + sku_info[sku].qty + '" class="qtyinput" tabindex="" /></td></tr>'
		return str
	}
}

function toggle_desc(elem) {
	if (elem.parentNode.previousSibling.style.display == "" || elem.parentNode.previousSibling.style.display == "none") {
		elem.innerHTML = "[-] Show less"
	} else {
		elem.innerHTML = "[+] Show more"
	}
	jQuery(elem.parentNode.previousSibling).slideToggle()
}

function update_page(elem) {
	vars[elem.name] = elem.value
	switch(elem.name) {
	case "strap":
		if (elem.value == "11" || elem.value == "12") {
			document.getElementById("finish_02").disabled = true
		} else {
			document.getElementById("finish_02").disabled = false
		}
		break;
	case "finish":
		document.getElementById("finish_img").src = "images/QGDHTML" + elem.value + "_a.jpg"
		if (elem.value == "02") {
			document.getElementById("strap_11").disabled = true
			document.getElementById("strap_12").disabled = true
		} else {
			document.getElementById("strap_11").disabled = false
			document.getElementById("strap_12").disabled = false
		}
	}
	update_parts()
}

function update_parts() {
	is_updating = true // used to signal when this function finishes and ends (for the AJAX calls, which happen asynchronously)
	var html_string = ""
	// look for errors
	if (!cookie_session) {
		html_string = "Error: Cookies must be enabled."
	} else if (!vars["strap"]) {
		html_string = "Please select a roller style first (Step 1)."
	} else if (!vars["finish"]) {
		html_string = "Please select a finish type (Step 2)."
	} else if (!vars["door"]) {
		html_string = "Please specify a door thickness (Step 3)."
	}
		
	// load and list the part numbers
	if (html_string == "") { // if html_string is empty, then there was no error
		html_string += '<form action="http://' + window.location.hostname + '/addcart?'
		html_string += 'type=v200add&o_url=https%3A%2F%2F' + window.location.hostname.replace(".","%2E") + '&createsessioncookie=1&noredirect=1&'
		html_string += "a_name=" + cookie_session["a_name"] + "&"
		html_string += "c_Lastname=" + cookie_session["c_Lastname"] + "&"
		html_string += "c_firstName=" + cookie_session["c_firstName"] + "&"
		html_string += "c_userName=" + cookie_session["c_userName"] + "&"
		html_string += "c_id=" + cookie_session["c_id"] + "&"
		html_string += "a_id=" + cookie_session["a_id"] + "&"
		html_string += "s_url=" + cookie_session["s_url"] + "&"
		html_string += "s_key=" + cookie_session["s_key"] + "&"
		html_string += "l_ws_key=" + cookie_session["l_ws_id"] + "&"
		html_string += "sc_id=" + cookie_session["s_key"]
		html_string += '" method="post">'
		html_string += '<table class="parts_list">'
		html_string += '<tr><th colspan="4">Roller Strap</th></tr>'
		html_string += get_tr_from_sku("QG." + ((vars["strap"] == "11" || vars["strap"] == "12") ? vars["strap"] + "04." : "1304." + vars["strap"] + ".") + vars["finish"])
		switch (vars["strap"]) {
		case "GB":
		case "IC":
		case "PL":
		case "WR":
			html_string += get_tr_from_sku("QG.1304." + vars["strap"] + ".11")
		}
		html_string += '<tr><td>&nbsp;</td><td colspan="3" class="sku_note">Note: Sold individaully; 2 recommended for each door.</td></tr>'
		html_string += '<tr><th colspan="4">Rails</th></tr>'
		html_string += get_tr_from_sku("QG.4004." + vars["finish"])
		html_string += get_tr_from_sku("QG.4006." + vars["finish"])
		html_string += get_tr_from_sku("QG.4008." + vars["finish"])
		html_string += '<tr><th colspan="4">Wall mounting brackets</th></tr>'
		html_string += get_tr_from_sku("QG.2" + vars["door"] + "." + vars["finish"])
		html_string += '<tr><td>&nbsp;</td><td colspan="3" class="sku_note">Note: We recommend a minimum of 1 bracket for every 16in of rail. Additional brackets may be needed depending on the weight of the door.</td></tr>'
		html_string += '<tr><th colspan="4">Rail accessories</th></tr>'
		html_string += get_tr_from_sku("QG.40." + vars["finish"])
		html_string += get_tr_from_sku("QG.401." + vars["finish"])
		html_string += get_tr_from_sku("QG.41")
		html_string += get_tr_from_sku("QG.TAP1420")
		html_string += '<tr><th colspan="4">Door stops and center guides</th></tr>'
		if (vars["strap"] == "11" || vars["strap"] == "12") {
			html_string += get_tr_from_sku("QG." + vars["strap"] + "02." + vars["finish"])
			html_string += get_tr_from_sku("QG." + vars["strap"] + "03." + vars["finish"])
			html_string += get_tr_from_sku("QG." + vars["strap"] + "01." + vars["finish"])
		} else {
			html_string += get_tr_from_sku("QG.1306." + ((vars["door"] == "03") ? "01.": "02.") + vars["finish"])
			html_string += get_tr_from_sku("QG.1305.DS." + vars["finish"])
			html_string += get_tr_from_sku("QG.1301.DG." + vars["finish"])
		}
		html_string += get_tr_from_sku("QG.1000.08")
		
		html_string += '<tr><th colspan="4">Handles</th></tr>'

		html_string += get_tr_from_sku("QG.1199.01." + vars["finish"])
		html_string += get_tr_from_sku("QG.1199.02." + vars["finish"])
		html_string += get_tr_from_sku("QG.1199.03." + vars["finish"])
		html_string += get_tr_from_sku("QG.1199.04." + vars["finish"])
		
		html_string += '<tr><th colspan="4">Latches</th></tr>'
		html_string += get_tr_from_sku("QG.1307.01." + vars["finish"])
		
		html_string += '<tr><th colspan="4">Doors</th></tr>'
		html_string += get_tr_from_sku("QG.RTA.00.36X80.PN")
		
		html_string += '<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td><input type="submit" value="Add to Cart" class="btn_addtocart chrome" /></td></tr></table></form>'
	}
	document.getElementById("parts").innerHTML = html_string
	is_updating = false // used to signal when this function finishes and ends (for the AJAX calls, which happen asynchronously)
	flush_pending_skus()
}

jQuery(document).ready(function($)
{
	cookie_session = split_parameters(read_cookie("cookie%5Fsession"))
})