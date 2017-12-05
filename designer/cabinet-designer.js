/* Copyright 2014 Custom Service Hardware, Inc. */
/* This source code is the intellectual property
of Custom Service Hardware, Inc. It may not be
used, copied, modified, or distributed apart from
express written permission of an authorized
representative of Custom Service Hardware.
############## GLOBALS #########################*/
var WIDTH, HEIGHT;
var _WIDTH, _HEIGHT;
var container, renderer, camera, mirrorCamera, scene;
var controls, editor, thisObject;
var axis = new THREE.Vector3(0,1,0);
var base_material;
var wall_material;
var maxAnisotropy;
var sectionCount;
var sprite;
var objects = [];
var floor_size = 400;
var mouse = new THREE.Vector2(), offset = new THREE.Vector3(), INTERSECTED, SELECTED;
var screenToInchRatio = 0.48;
var z = [];
var w = [];
var floor_tex;
var cab_line;
var wall_tex;
var countertop_tex;
var solidGround;
var error_material = new THREE.MeshPhongMaterial({ color: 'red', transparent: true, opacity: 0.5 });
/* var projector; */
var crown_profile = { points: [{x: 0, y: 0},{x: 0, y: 1.125},{x: 1.125, y: 2.625},{x: 1.5, y: 2.625},{x: 1.5, y: 3.125},{x: 2, y: 3.75},{x: 3.25, y: 3.75},{x: 3.25, y: 3.5},{x: 2.75, y: 3.375},{x: 2.5, y: 3.125},{x: 2.5, y: 2.875},{x: 2.375, y: 2.375},{x: 2.25, y: 2.25},{x: 2, y: 2.125},{x: 1.75, y: 2.125},{x: 1.75, y: 2},{x: 1.5, y: 1.875},{x: 1.5, y: 1.625},{x: 1.125, y: 1.5},{x: 1.125, y: 0.75},{x: 0.75, y: 0.625},{x: 0.75, y: 0.375},{x: 0.5, y: 0.25},{x: 0.5, y: 0}]};
var upper = upperLeft(crown_profile.points);
var crown = true;
/* SNAP SVG GLOBAL VARIABLES */
var paper;
var screen_width = 400, screen_height = 400;
var screenToInchRatio = 0.48;
/* SKU-PRICE DATA MAPPING */
var product = [];
var product_definitions;
var cur_price = 0;
var cab_finish = [];
var productList;
var crownMesh = 0;
/* ################################################# */
/* WebGL Detector */
var Detector = {
			canvas: !! window.CanvasRenderingContext2D,
			webgl: ( function () { try { var canvas = document.createElement( 'canvas' ); return !! window.WebGLRenderingContext && ( canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' ) ); } catch( e ) { return false; } } )(),
			workers: !! window.Worker,
			fileapi: window.File && window.FileReader && window.FileList && window.Blob,
			getWebGLErrorMessage: function () {
					var element = document.createElement( 'div' );
					element.id = 'webgl-error-message';
					element.style.fontFamily = 'monospace';
					element.style.fontSize = '13px';
					element.style.fontWeight = 'normal';
					element.style.textAlign = 'center';
					element.style.background = '#fff';
					element.style.color = '#000';
					element.style.padding = '1.5em';
					element.style.width = '400px';
					element.style.margin = '5em auto 0';
					if ( ! this.webgl ) {
								element.innerHTML = window.WebGLRenderingContext ? [
											'Your graphics card does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br />',
											'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'
								].join( '\n' ) : [
											'Your browser does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br/>',
											'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'
								].join( '\n' );
					}
					return element;
			},
			addGetWebGLMessage: function ( parameters ) {
					var parent, id, element;
					parameters = parameters || {};
					parent = parameters.parent !== undefined ? parameters.parent : document.body;
					id = parameters.id !== undefined ? parameters.id : 'oldie';
					element = Detector.getWebGLErrorMessage();
					element.id = id;
					parent.appendChild( element );
			}
};
/* ################################################# */
/*jshint sub:true*/
/* http://stackoverflow.com/questions/13678523/three-js-material-texture-and-color */
THREE.ShaderChunk.map_fragment = [
	"#ifdef USE_MAP",
			"vec4 texelColor = texture2D( map, vUv ); /* NEWWW */",
			"#ifdef GAMMA_INPUT",
			"texelColor.xyz *= texelColor.xyz;",
			"#endif",
			"gl_FragColor.rgb = mix(gl_FragColor.rgb,texelColor.rgb,texelColor.a);",
			"vec3 surfDiffuse = mix(diffuse,vec3(1,1,1),texelColor.a);",
	"#else",
			"vec3 surfDiffuse = diffuse;",
	"#endif"].join('\n');
/* now replace references to 'diffuse' with 'surfDiffuse' */
THREE.ShaderChunk.lights_phong_fragment = THREE.ShaderChunk.lights_phong_fragment.replace(/\bdiffuse\b/gm,'surfDiffuse');
THREE.ShaderLib.phong.fragmentShader = [
	"uniform vec3 diffuse;",
	"uniform float opacity;",
	"uniform vec3 ambient;",
	"uniform vec3 emissive;",
	"uniform vec3 specular;",
	"uniform float shininess;",
	THREE.ShaderChunk[ "color_pars_fragment" ],
	THREE.ShaderChunk[ "map_pars_fragment" ],
	THREE.ShaderChunk[ "lightmap_pars_fragment" ],
	THREE.ShaderChunk[ "envmap_pars_fragment" ],
	THREE.ShaderChunk[ "fog_pars_fragment" ],
	THREE.ShaderChunk[ "lights_phong_pars_fragment" ],
	THREE.ShaderChunk[ "shadowmap_pars_fragment" ],
	THREE.ShaderChunk[ "bumpmap_pars_fragment" ],
	THREE.ShaderChunk[ "normalmap_pars_fragment" ],
	THREE.ShaderChunk[ "specularmap_pars_fragment" ],
	"void main() {",
			"gl_FragColor = vec4( vec3 ( 1.0 ), opacity );",
			THREE.ShaderChunk[ "map_fragment" ],
			THREE.ShaderChunk[ "alphatest_fragment" ],
			THREE.ShaderChunk[ "specularmap_fragment" ],
			THREE.ShaderChunk[ "lights_phong_fragment" ],
			THREE.ShaderChunk[ "lightmap_fragment" ],
			THREE.ShaderChunk[ "color_fragment" ],
			THREE.ShaderChunk[ "envmap_fragment" ],
			THREE.ShaderChunk[ "shadowmap_fragment" ],
			THREE.ShaderChunk[ "linear_to_gamma_fragment" ],
			THREE.ShaderChunk[ "fog_fragment" ],
	"}"
].join('\n');

/* ################################################# */
THREE.TubeGeometry.NewFrenetFrames = function(path, segments, closed) {
    var tangent = new THREE.Vector3(),
        normal = new THREE.Vector3(),
        binormal = new THREE.Vector3(),
        tangents = [],
        normals = [],
        binormals = [],
        vec = new THREE.Vector3(),
        mat = new THREE.Matrix4(),
        numpoints = segments + 1,
        theta,
        epsilon = 0.0001,
        smallest,
        tx, ty, tz,
        i, u, v;
    this.tangents = tangents;
    this.normals = normals;
    this.binormals = binormals;
    for (i = 0; i < numpoints; i++) {
        u = i / (numpoints - 1);
        tangents[i] = path.getTangentAt(u);
        tangents[i].normalize();
    }
    initialNormal3();
    
    function initialNormal3() {
            normals[0] = new THREE.Vector3();
            binormals[0] = new THREE.Vector3();
            tx = Math.abs(tangents[0].x);
            ty = Math.abs(tangents[0].y);
            tz = Math.abs(tangents[0].z);
            normal.set(0, 1, 0);
			normals[0] = normal;
            binormals[0].crossVectors(tangents[0], normals[0]);
        }

    for (i = 1; i < numpoints; i++) {
        normals[i] = normals[i - 1].clone();
        binormals[i] = binormals[i - 1].clone();
        binormals[i].crossVectors(tangents[i], normals[i]);
    }
};

/* ################################################# */

/**************************************************************
 *	Spline 3D curve
 **************************************************************/
THREE.Curve.prototype.getUtoTmapping = function(u) {
    return u;
};

THREE.SplineStraight3 = THREE.Curve.create(

	function ( points /* array of Vector3 */) {

		this.points = (points === undefined) ? [] : points;

	},

	function ( t ) {
		var points = this.points;
		
		var index = ( points.length - 1 ) * t;
		
		var floorIndex = Math.floor(index);
		
		if(floorIndex == points.length-1)
			return points[floorIndex];
			
		var floorPoint = points[floorIndex];
		
		var ceilPoint = points[floorIndex+1];
		
		return floorPoint.clone().lerp(ceilPoint, index - floorIndex);
	}

);



function render() {
	var delta = clock.getDelta();
	controls.update();
	renderer.render( scene, camera );
}

function inchesToScreen(inches) {
	"use strict";
	return (inches / screenToInchRatio);
}

function screenToInches(screen) {
	"use strict";
	return (screen * screenToInchRatio);
}

function Point(x, y) {
	"use strict";
	this.x = x;
	this.y = y;
}

function setProduct(data) {
	product = data;
	/* product.data.sort(function(a, b) {
			var textA = a.sku.toUpperCase();
			var textB = b.sku.toUpperCase();
			return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
		}); */
}

function split_parameters(param_list) {
	param_list = decodeURIComponent(param_list).split("&");
	var params = {};
	var param = "";
	for (var i=0; i<param_list.length; i++) {
		param = param_list[i].split("=");
		params[param[0]] = encodeURIComponent(param[1]);
	}
	return params;
}

function read_cookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}

function getItem(list, sku) {
	for (var item in list.data) {
		if (list.data[item].sku === sku) {
			return list.data[item];
		}
	}
	return null;
}

function getTypeWithOptions(type, index) {
	var opt_string = type.substring(type.indexOf("[") + 1, type.indexOf("]"));
	var options = opt_string.split("/");
	var base = type.replace(/\[.+\]/, options[index] );
	return base;
}

function updateCabinetTexture(tex, sku, name) {
	cab_tex = tex;
	cab_line = sku;
	var c = getCabinetLine();
	
	
	new_tex = THREE.ImageUtils.loadTexture(tex, {}, function() {
		render();
	});
	new_tex.anisotropy = maxAnisotropy;
	new_tex.repeat.set( 0.02, 0.02 );
	new_tex.wrapS = new_tex.wrapT = THREE.RepeatWrapping;
	base_material = new THREE.MeshPhongMaterial( { color: 0xffffff, map: new_tex } );
	var i = 0, len = z.length;
	for ( i = 0; i < len; i++ ) {
		var d = getCabinetDef(z[i].sku);
		if (typeof(d) !== 'undefined') {
			if (d.door === 'default') {
				z[i].door = c.door;
			} else {
				z[i].door = d.door;
			}
		
			z[i].drawer = c.drawer;
			
			z[i].build();
			if (!available(z[i].sku)) {
				z[i].updateMaterial(error_material);
			}
		}
		/* z[i].updateMaterial(base_material); */
	}
	save();
	
	for (i = 0; i < z.length; i++) {
		if (z[i].state === 1) {
			$( "#information" ).html(getSelectedInfo( z[i].sku ));
		}
	}
	
	/* Update Cart */
	if (typeof product !== 'undefined') {
		$("#cart").html( generateAddToCart() );
		$("#price").html( generatePriceEstimate() );
		$("#cabinet_products").html( generateSeriesProducts() );
		$("#basecabinets").html( generateSeriesProductsCategorically("base") );
		$("#wallcabinets").html( generateSeriesProductsCategorically("wall") );
		$("#specialtycabinets").html( generateSeriesProductsCategorically("oven") + generateSeriesProductsCategorically("pantry") );
		$("#accessories").html( generateSeriesProductsCategorically("valance") );
		var options = {
			valueNames: [ 'name' ],
			plugins: [ ListFuzzySearch() ]
		};
		productList = new List('product_list', options);
		$("#series").html( '' + name + '' );
		$("#cabinet_products").scrollTop = 0;
	}
	
}

function getCabinetLineTexture() {
	var media_dir = 'http://www.cshardware.com/media/catalog/product';
	for (var item in product.data) {
		if ( product.data[item].sku.indexOf("CAB."+cab_line) > -1 ) {
			var c = product.data[item];
			return (media_dir + c.finish);
		}
	}
}	

function getCabinetLine() {
	for (var item in product.data) {
		if ( product.data[item].sku.indexOf("CAB."+cab_line) > -1 ) {
			var c = product.data[item];
			return c;
		}
	}
}	

function addCabinet(sku) {
	var itm = getCabinetDef(baseSku(sku));
	var c = getCabinetLine();
	var door = c.door;
	var drawer = c.drawer;
	if (itm.door !== 'default') {
		door = itm.door;
	}	
	var type = getTypeWithOptions(itm.type, 0);
	z.push(new Zone(type, door, drawer, baseSku(sku), 0, 0, itm.height, itm.width, itm.depth, 0, itm.base_height, false));
	var i = z.length - 1;
	updateSelected(z[i].id);
	
	$("#cart").html( generateAddToCart() );
	$("#price").html( generatePriceEstimate() );
}

function available(base_sku) {
	for (var item in product.data) {
		if ( product.data[item].sku.indexOf("8.") > -1 && product.data[item].sku.indexOf(cab_line) > -1) {
			var c = product.data[item];
			if (base_sku === baseSku(c.sku)) {
				return true;
			}
		}
	}
	return false;
}

function getDownload() {
	var doc = new jsPDF();
	var currentTime = new Date().toDateString();
	var logo = "data:image/png;base64,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";
	var svg = '<svg xmlns="http://www.w3.org/2000/svg">' + paper.innerSVG() + '</svg>';
	
	svg = svg.replace(/<defs\b[^>]*\>(.*?)<\/defs>/g,'');
	svg = svg.replace(/filter=\"(.*?)\"/g,'');
	doc.setProperties({
		title: 'Cabinet Design',
		subject: 'Custom Service Hardware Cabinet Design',
		author: 'Custom Service Hardware',
		keywords: 'Custom Service Hardware, cabinet, design',
		creator: 'Custom Service Hardware Cabinet Design Tool'
	});
	
	var canvas = document.getElementById('download_canvas');
	canvg(canvas, svg, { renderCallback: function () {
		var img = canvas.toDataURL("image/png");
		
		doc.addImage(logo, 'png', 120, 5, 60, 30);
		doc.addImage(img, 'png', -10, 0, 200, 200);
		doc.text(20, 15, 'Cabinet Design - ' + currentTime);
		doc.text(20, 22, 'Custom Service Hardware, Inc.');
		doc.text(20, 29, 'Ph: (262) 243-3088');
	
		doc.text(20, 200, 'Estimated Price (Products Only): ' + generatePriceEstimate());
	
		var c = getCabinetLine();
		doc.text(20, 210, 'Cabinet Series: ' + c.name);
	
		
	
		doc.addPage();
	
		doc.text(90, 15, 'Product List');
		var page = 0;
		for (var i = 0; i < z.length; i++) {
			if ((i * 7	- (page * 268) + 30) >= 270) {
				page++;
				doc.addPage();
			}
			var d = getCabinetDef(baseSku(z[i].sku));
			doc.text(20, (i * 7 - (page * 253) + 30), z[i].sku + cab_line);
			doc.text(80, (i * 7 - (page * 253) + 30), d.description);
		}
	

		doc.save('CabinetDesign-' + guid() + '.pdf');
	}});
	
	

		
	
}

function generateSeriesProductsCategorically(cat) {
	/* var html_string = '<div class="pic-container">'; */
	var html_string = '';
	var media_dir = 'http://www.cshardware.com/media/catalog/product';

		
	for (var item in product.data) {
		if ( product.data[item].sku.indexOf("8.") > -1 && product.data[item].sku.indexOf(cab_line) > -1) {
			var c = product.data[item];
			var d = getCabinetDef(baseSku(c.sku));
			if (typeof d !== 'undefined' && c.image !== 'no_selection') {
				if (d.type !== 'x') {
					if (d.type.indexOf(cat) > -1) {
						html_string += '<span style="float: left; width: 116px; height: 240px; vertical-align: bottom-text;"><input type="radio" style="display:none;" onclick="addCabinet(\x27' + c.sku + '\x27)" name="addcabinet' + item + '" id="addcabinet_opt' + item + '" value="' + c.sku + '"/>';
						html_string += '<label for="addcabinet_opt' + item + '"><p>' + d.description + '</p><p>' + c.sku + '</p><img class="lazy" src="' + media_dir + c.image + '" width="96" height="96" style="z-index: -1;"/></label></span>';
					}
				}
			}
		}
	}	
	
	
	return html_string;
}

function generateSeriesProducts() {
	/* var html_string = '<div class="pic-container">'; */
	var html_string = '<div class="pic-container" id="product_list">';
	var media_dir = 'http://www.cshardware.com/media/catalog/product';
	
	html_string += '<input class="search" placeholder="Search" />';
	html_string += '<ul class="list">';
	
	
	for (var item in product.data) {
		if ( product.data[item].sku.indexOf("8.") > -1 && product.data[item].sku.indexOf(cab_line) > -1) {
			var c = product.data[item];
			var d = getCabinetDef(baseSku(c.sku));
			if (typeof d !== 'undefined' && c.image !== 'no_selection') {
				if (d.type !== 'x') {
				
					html_string += '<li><input type="radio" style="display:none;" onclick="addCabinet(\x27' + c.sku + '\x27)" name="addcabinet' + item + '" id="addcabinet_opt' + item + '" value="' + c.sku + '"/>';
					html_string += '<label for="addcabinet_opt' + item + '"><p class="name">' + d.description + '</p><p class="sku">' + c.sku + '</p><img class="lazy" src="' + media_dir + c.image + '" width="96" height="96" style="z-index: -1;"/></label></li>';
				}
			}
		}
	}	
	
	
	html_string += '</ul></div>';
	
	return html_string;
}

function baseSku(sku) {
	return (sku.substring( 0, sku.indexOf(".", 3) + 1 ));
}

function generateCabinetLineOptions() {
	var html_string = '<div class="pic-container">';
	var media_dir = 'http://www.cshardware.com/media/catalog/product';
	
	for (var item in product.data) {
		if ( product.data[item].sku.indexOf("CAB.") > -1 ) {
			var c = product.data[item];
			var suffix = c.sku.substring(4,7);
			var door = getItem(product, '8.DOOR.' + suffix);
			
			if( c.finish && c.finish !== 'no_selection') {
				html_string += '<input type="radio" style="display:none;" onclick="updateCabinetTexture(\x27' + (media_dir + c.finish) + '\x27,\x27' + c.sku.substring(4) + '\x27,\x27' + c.name + '\x27)" name="cabinetline_opt' + item + '" id="cabinetline_opt' + item + '" value="' + c.sku + '"/>';
				html_string += '<p class="separated"><label for="cabinetline_opt' + item + '">' + c.name + '<br><img class="lazy" src="' + media_dir + (door !== null ? door.image : c.finish) + '" width="96" height="96" style="z-index: -1;"/></label><br></p>';
			}
		}
	}	
	
	html_string += '</div>';
	
	return html_string;
}

function updateCounterTexture(tex) {
	/* floor_tex = tex;
	new_tex = THREE.ImageUtils.loadTexture(tex, {}, function() {
		render();
	});
	new_tex.repeat.set( 8, 8 );
	new_tex.wrapS = new_tex.wrapT = THREE.RepeatWrapping;
	var mat = new THREE.MeshPhongMaterial( { side: THREE.DoubleSide, map: new_tex } );
	solidGround.material = mat; */
}

function generateCounterOptions() {
	var html_string = '<div class="pic-container">';
	
	var i = 0, len = counter.length;
	for ( i = 0; i < len; i++ ) {
		html_string += '<input type="radio" style="display:none;" onclick="updateCounterTexture(\x27' + counter[i] + '\x27)" name="counter_opt' + i + '" id="counter_opt' + i + '" value="' + counter[i] + '"/>';
		html_string += '<label for="counter_opt' + i + '"><img class="lazy" src="' + counter[i] + '" width="96" height="96" ></label>';
	}
	html_string += '</div>';
	
	return html_string;
}

function updateFloorTexture(tex) {
	floor_tex = tex;
	new_tex = THREE.ImageUtils.loadTexture(tex, {}, function() {
		render();
	});
	new_tex.repeat.set( 8, 8 );
	new_tex.wrapS = new_tex.wrapT = THREE.RepeatWrapping;
	var mat = new THREE.MeshPhongMaterial( { side: THREE.DoubleSide, map: new_tex } );
	solidGround.material = mat;
	save();
}

function startsWith(str, str2) {
	return (str.charAt(0) === str2.charAt(0) && str.charAt(1) === str.charAt(1) && str.charAt(2) === str.charAt(2));
}

function addDeco(sku) {
	var opt = $('input[name="design_mode"]:checked').val();
	alert(opt);
	/* Stub */
	
}

function generateDesignOptions() {
	var media_dir = 'http://www.cshardware.com/media/catalog/product';
	var html_string = '<div class="pic-container" id="design_list">';
	html_string += '<input type="radio" id="doorrad" checked name="design_mode" value="door"><label for="doorrad">Door</label><input id="drawerrad" type="radio" name="design_mode" value="drawer"><label for="drawerrad">Drawer</label>';
	html_string += '<input class="search" placeholder="Search" />';
	
	html_string += '<input type="radio" style="display:none;" onclick="addDeco(\x27NONE\x27)" name="adddecoNone" id="adddeco_optNone" value="None"/>';
	html_string += '<label for="adddeco_optNone"><img class="lazy" src="./images/x.png" title="Clear" width="32" height="32" style="z-index: -1;"/></label>';
	
	html_string += '<ul class="list">';
	
	for (var item in product.data) {
		if ( startsWith(product.data[item].sku, "50.") || startsWith(product.data[item].sku, "52.") ) {
			var c = product.data[item];
			if( c.image && c.image !== 'no_selection') {
				html_string += '<li><input type="radio" style="display:none;" onclick="addDeco(\x27' + c.sku + '\x27)" name="adddeco' + item + '" id="adddeco_opt' + item + '" value="' + c.sku + '"/>';
				html_string += '<label for="adddeco_opt' + item + '"><p class="name">' + c.name + '</p><p class="sku">' + c.sku + '</p><img class="lazy" src="' + media_dir + c.image + '" width="96" height="96" style="z-index: -1;"/></label></li>';
			}
		}
	}
	
	html_string += '</ul></div>';
	
	return html_string;
}

function generateFloorOptions() {
	var html_string = '<div class="pic-container">';
	
	var i = 0, len = floor.length;
	for ( i = 0; i < len; i++ ) {
		html_string += '<input type="radio" style="display:none;" onclick="updateFloorTexture(\x27' + floor[i] + '\x27)" name="floor_opt' + i + '" id="floor_opt' + i + '" value="' + floor[i] + '"/>';
		html_string += '<label for="floor_opt' + i + '"><img class="lazy" src="' + floor[i] + '" width="96" height="96" ></label>';
	}
	html_string += '</div>';
	
	return html_string;
}

function updateWallTexture(tex) {
	/* floor_tex = tex;
	new_tex = THREE.ImageUtils.loadTexture(tex, {}, function() {
		render();
	});
	new_tex.repeat.set( 8, 8 );
	new_tex.wrapS = new_tex.wrapT = THREE.RepeatWrapping;
	var mat = new THREE.MeshPhongMaterial( { side: THREE.DoubleSide, map: new_tex } );
	solidGround.material = mat; */
}

function generateWallOptions() {
	var html_string = '<div class="pic-container">';
	
	var i = 0, len = wall_tex.length;
	for ( i = 0; i < len; i++ ) {
		html_string += '<input type="radio" style="display:none;" onclick="updateWallTexture(\x27' + wall_tex[i] + '\x27)" name="wall_opt' + i + '" id="wall_opt' + i + '" value="' + wall_tex[i] + '"/>';
		html_string += '<label for="wall_opt' + i + '"><img class="lazy" src="' + wall_tex[i] + '" width="96" height="96" ></label>';
	}
	html_string += '</div>';
	
	return html_string;
}

function generatePriceEstimate() {
	var html_string = 'Price Estimate: ';
	var price = 0;
	var i = 0, len = z.length;
	for ( i = 0; i < len; i++ ) {
		var s = z[i].sku+cab_line;
		if ( s.indexOf('8.') !== -1 ) {
			var item = getItem(product, s);
			if (item) {
				price += item.price;
			}
		}
	}
	html_string += '$ '+price+'.00';
	
	return html_string;
}

function generateAddToCart() {
	var cookie_session = split_parameters(read_cookie("cookie%5Fsession"));
	var html_string = '';
		html_string += '<form action="http://' + window.location.hostname + '/addcart?';
		html_string += 'type=v200add&o_url=https%3A%2F%2F' + window.location.hostname.replace(".","%2E") + '&createsessioncookie=1&noredirect=1&';
		html_string += "a_name=" + cookie_session["a_name"] + "&";
		html_string += "c_Lastname=" + cookie_session["c_Lastname"] + "&";
		html_string += "c_firstName=" + cookie_session["c_firstName"] + "&";
		html_string += "c_userName=" + cookie_session["c_userName"] + "&";
		html_string += "c_id=" + cookie_session["c_id"] + "&";
		html_string += "a_id=" + cookie_session["a_id"] + "&";
		html_string += "s_url=" + cookie_session["s_url"] + "&";
		html_string += "s_key=" + cookie_session["s_key"] + "&";
		html_string += "l_ws_key=" + cookie_session["l_ws_id"] + "&";
		html_string += "sc_id=" + cookie_session["s_key"];
		html_string += '" method="post">';
		
		var skuqty = {};
		var i = 0, len = z.length;
		for ( i = 0; i < len; i++ ) {
			var s = z[i].sku;
			if ( s.indexOf('8.') !== -1 ) {
				if (!(s in skuqty)) {
					skuqty[s] = 1;
				} else {
					skuqty[s]++;
				}
			}
		}
		
		for (var sku in skuqty) {
			html_string += '<input name="keys" value="'+sku+cab_line+'" type="hidden">';
			html_string += '<input name="qty['+sku+cab_line+']" value="'+skuqty[sku]+'" type="hidden">';
		}
		

		/* <img height="96" width="96" src="images/empty-shopping-cart-icon.png" title="Add to cart" id="addcart"/> */
		html_string += '<input type="image" alt="Add to cart" title="Add to cart" value="Add to Cart" src="images/empty-shopping-cart-icon.png" no-repeat;" /></form>';
		
	return html_string;
}

function getSelectedInfo( sku ) {
	var html_string = '';
	var media_dir = 'http://www.cshardware.com/media/catalog/product';
	var found = false;
	for (var item in product.data) {
		if ( product.data[item].sku.indexOf(sku+cab_line) > -1) {
			var c = product.data[item];
			var d = getCabinetDef(baseSku(c.sku));
			if (typeof d !== 'undefined' && c.image !== 'no_selection') {
				if (d.type !== 'x') {
					html_string += '<img style="float:left;" src="' + media_dir + c.image +	'"	width="64" height="64"/>';
					html_string += d.description;
					html_string += '<br/>Unit price: $' + c.price + '.00';
				}
			}
			found = true;
			break;
		}
	}	
	
	if( !found ) {
		html_string += 'Not available in this cabinet series';
	}
	
	return html_string;
}

function updateSelected(id) {
	var selected = false, wall_selected = false;
	for (var i = 0; i < z.length; i++) {
		if(z[i].id === id) {
			z[i].setState(1);
			selected = true;
			$( "#slider-vertical" ).slider( "value", z[i].base_height);
			$( "#amount" ).val( $( "#slider-vertical" ).slider( "value" ));
			$( "#information" ).html(getSelectedInfo( z[i].sku ));
		} else {
			z[i].setState(0);
		}
		z[i].HighlightBB();
	}
	var wall_info = '';
	for (i = 0; i < w.length; i++) {
		if(w[i].id === id) {
			wall_selected = true;
			w[i].setState(1);
			wall_info = '<b>Length: ' + w[i].length() + 'in</b>';
		} else {
			w[i].setState(0);
		}
	}
	if (wall_selected) {
		$("#delete_wall").fadeTo(100,1.0);
		$("#delete_wall").css('z-index', 10002);
		$("#wall").fadeTo(100,0.0);
		$( "#information" ).html(wall_info);
	} else {
		$("#delete_wall").fadeTo(100,0.0);
		$("#delete_wall").css('z-index', -1);
		$("#wall").fadeTo(100,1.0);
	}
	if (selected) {
		$("#ui").fadeTo(100,1.0, function() { $("#ui").show(); });	
	} else {
		$("#ui").fadeTo(100,0.1, function() { $("#ui").hide(); });
		if (!wall_selected) {
			$( "#information" ).html('');
		}
	}
}

function deleteSelected() {
	for (var i = 0; i < z.length; i++) {
		if (z[i].state === 1) {
			z[i]._delete();
			/* z[i] = null; */
			z.splice(i, 1);
			save();
			break;
		}
	}
	for (i = 0; i < w.length; i++) {
		if (w[i].state === 1) {
			w[i]._delete();
			w.splice(i, 1);
			save();
			$("#delete_wall").fadeTo(250,0.0);
			$("#delete_wall").css('z-index', -1);
			$("#wall").fadeTo(250,1.0);
			break;
		}
	}
	$("#cart").html( generateAddToCart() );
	$("#price").html( generatePriceEstimate() );
	$("#ui").fadeTo(100,0.1, function() { $("#ui").hide(); });
	$( "#information" ).html('');
}

$(document).keydown(function(event){
	var x = 0, y = 0;
	if (event.which === 37) {
		x = inchesToScreen(-1);
	}
	if (event.which === 38) {
		y = inchesToScreen(-1);
	}
	if (event.which === 39) {
		x = inchesToScreen(1);
	}
	if (event.which === 40) {
		y = inchesToScreen(1);
	}	
	if (x !== 0 || y !== 0) {
		for (var i = 0; i < z.length; i++) {
			if (z[i].state === 1) {
				z[i].move(x,y);
				save();
				break;
			}
		}
	}
})

function rotateSelected() {
	for (var i = 0; i < z.length; i++) {
		if (z[i].state === 1) {
			z[i].rotate();
			save();
			break;
		}
	}
}

function elevateSelected(amount) {
	for (var i = 0; i < z.length; i++) {
		if (z[i].state === 1) {
			z[i].base_height = amount;
			z[i].build();
			z[i].update();
		}
	}
}

function autoSave() {


	save();
	var auto = function() {
		autoSave();
	};
	
	setTimeout( auto, 30000);
}

function Handle(x, y, idx, path, parent) {
	var pathArray = parse(path.attr("path"));
	function parse(s) {
		var arr = [];
		var str = s.split(/M|L/g);
		
		arr.push(["M", str[1].split(" ")[0], str[1].split(" ")[1]]);
		
		for ( var i = 2; i < str.length; i++ ) {
			arr.push(["L", str[i].split(" ")[0], str[i].split(" ")[1]]);
		}
		
		return arr;
	}
	function toPath(arr) {
		var p = "M" + arr[0][1] + " " + arr[0][2];
		for  ( var i = 1; i < arr.length; i ++ ) {
			p = p + "L" + arr[i][1] + " " + arr[i][2];
		}
		return p;	
	}
	var handle = paper.circle(x,y,5).attr({
		fill: "black",
		cursor: "pointer",
		"stroke-width": 10,
		stroke: "transparent",
		cx: x,
		cy: y
	});
	this.handle = handle;
	var start = function () {
		this.cx = this.attr("cx"),
		this.cy = this.attr("cy");
	},
	move = function (dx, dy) {
		pathArray = parse(path.attr("path"));
		var X = Snap.snapTo(inchesToScreen(1.5), (+this.cx) + (+dx), 100000000),
			Y = Snap.snapTo(inchesToScreen(1.5), (+this.cy) + (+dy), 100000000);
		this.attr({cx: X, cy: Y});
		pathArray[idx][1] = X;
		pathArray[idx][2] = Y;
		path.attr({path: toPath(pathArray)});
		parent.updateGeometry(idx);
	},
	up = function () {
		this.dx = this.dy = 0;
	};
	handle.drag(move, start, up);
}

function Wall(x1, y1, x2, y2, nmaterial, nprofile, nbase_height) {
	"use strict";
	var x_1 = x1, y_1 = y1, x_2 = x2, y_2 = y2;
	
	this.x1 = function() { return x_1; };
	this.y1 = function() { return y_1; };
	this.x2 = function() { return x_2; };
	this.y2 = function() { return y_2; };
	this.state = 0;
		
	x1 = inchesToScreen(x1) + (screen_width / 2);
	y1 = inchesToScreen(y1) + (screen_height / 2);
	x2 = inchesToScreen(x2) + (screen_width / 2);
	y2 = inchesToScreen(y2) + (screen_height / 2);
	
	this.length = function() {
		 var xs = 0;
		  var ys = 0;
		 
		  xs = handle.attr("cx") - handle2.attr("cx");
		  xs = xs * xs;
		 
		  ys = handle.attr("cy") - handle2.attr("cy");;
		  ys = ys * ys;
		 
		  return Math.round(screenToInches(Math.sqrt( (xs + ys) )), 1);
	}
	
	function length() {
		 var xs = 0;
		  var ys = 0;
		 
		  xs = handle.attr("cx") - handle2.attr("cx");
		  xs = xs * xs;
		 
		  ys = handle.attr("cy") - handle2.attr("cy");;
		  ys = ys * ys;
		 
		  return Math.round(screenToInches(Math.sqrt( (xs + ys) )), 1);
	}

	var scope = this;
	var path = paper.path("M" + x1 + " " + y1 + "L" + x2 + " " + y2);
	var mesh;
	var x, y;
	var material = (typeof nmaterial === 'undefined') ? wall_material : nmaterial;
	var profile = (typeof nprofile === 'undefined') ? [[-1.5,0],[-1.5,96],[1.5,96],[1.5,0]] : nprofile;
	var base_height = (typeof nbase_height === 'undefined') ? 0 : nbase_height;
	path.attr({"stroke-width": 7, stroke: "yellow"});
	var pathArray = parse(path.attr("path"));
	var handle = paper.circle(x2,y2,5).attr({
		fill: "black",
		cursor: "pointer",
		"stroke-width": 10,
		stroke: "transparent",
		cx: x2,
		cy: y2
	});
	function parse(s) {
		var arr = [["M",0,0],["L",0,0]];
		var str1 = s.split("L")[0];
		str1 = str1.replace("M","");
		var str2 = s.split("L")[1];
			
		arr[1][1] = str2.split(" ")[0];
		arr[1][2] = str2.split(" ")[1];
		arr[0][1] = str1.split(" ")[0];
		arr[0][2] = str1.split(" ")[1];
		return arr;
	}
	function toPath(arr) {
		return "M" + arr[0][1] + " " + arr[0][2] + "L" + arr[1][1] + " " + arr[1][2];	
	}
	var handle2 = paper.circle(x1,y1,5).attr({
		fill: "black",
		cursor: "pointer",
		"stroke-width": 10,
		stroke: "transparent",
		cx: x1,
		cy: y1
	});
	var start = function () {
		this.cx = this.attr("cx"),
		this.cy = this.attr("cy");
		this.x1 = +handle2.attr("cx");
		this.y1 = +handle2.attr("cy");
		this.x2 = +handle.attr("cx");
		this.y2 = +handle.attr("cy");
	},
	move = function (dx, dy) {
		var X = Snap.snapTo(inchesToScreen(1.5), (+this.cx) + (+dx), 100000000),
			Y = Snap.snapTo(inchesToScreen(1.5), (+this.cy) + (+dy), 100000000);
		this.attr({cx: X, cy: Y});
		pathArray[1][1] = X;
		pathArray[1][2] = Y;
		path.attr({path: toPath(pathArray)});
		updateGeometry();
		$( "#information" ).html('<b>Length: ' + length() + 'in</b>');
	},
	move2 = function (dx, dy) {
		var X = Snap.snapTo(inchesToScreen(1.5), (+this.cx) + (+dx), 100000000),
			Y = Snap.snapTo(inchesToScreen(1.5), (+this.cy) + (+dy), 100000000);
		this.attr({cx: X, cy: Y});
		pathArray[0][1] = X;
		pathArray[0][2] = Y;
		path.attr({path: toPath(pathArray)});
		updateGeometry();
		$( "#information" ).html('<b>Length: ' + length() + 'in</b>');
	},
	moveall = function (dx, dy) {
		var X1 = +this.x1 + (+dx);
		var Y1 = +this.y1 + (+dy);
		var X2 = +this.x2 + (+dx);
		var Y2 = +this.y2 + (+dy);
		X1 = Snap.snapTo(inchesToScreen(1.5), X1, 100000000);
		Y1 = Snap.snapTo(inchesToScreen(1.5), Y1, 100000000);
		X2 = Snap.snapTo(inchesToScreen(1.5), X2, 100000000);
		Y2 = Snap.snapTo(inchesToScreen(1.5), Y2, 100000000);
		handle.attr({cx: X2, cy: Y2});
		handle2.attr({cx: X1, cy: Y1});
		pathArray[1][1] = X2;
		pathArray[1][2] = Y2;
		pathArray[0][1] = X1;
		pathArray[0][2] = Y1;
		path.attr({path: toPath(pathArray)});
		updateGeometry();
	},
	up = function () {
		this.dx = this.dy = 0;
	};

	function updateGeometry() {
		toFront(path);
		toFront(handle);
		toFront(handle2);
	
		if ( mesh ) {
			scene.remove(mesh);
		}
		var x1 = (+handle2.attr("cx")),
			y1 = (+handle2.attr("cy")),
			x2 = (+handle.attr("cx")),
			y2 = (+handle.attr("cy"));			
				
		var angle = Math.atan2(x2 - x1, y2 - y1);
		var len = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
		
		var height = 0;
		var Points = [];
		for ( var i = 0; i < profile.length; i++ ) {
			Points.push( new THREE.Vector2 ( inchesToScreen(profile[i][0]), inchesToScreen(profile[i][1])) );
			if (height < profile[i][1]) {
				height = profile[i][1];
			}
		}

		var Shape = new THREE.Shape( Points );
		var extrusionSettings = {
			bevelThickness: 1, bevelSize: 2, bevelEnabled: false,
			material: 0, extrudeMaterial: 1,
			amount: len
		};	
		var geom = new THREE.ExtrudeGeometry( Shape, extrusionSettings );
		geom.computeFaceNormals();
		/* geom.center(); */
		
		x = (screenToInches(x1) - screenToInches(screen_width / 2 ));
		y = (screenToInches(y1) - screenToInches(screen_height / 2));
		
		mesh = new THREE.Mesh( geom, material );
		mesh.geometry.applyMatrix( new THREE.Matrix4().makeRotationY( angle ) );
		mesh.position.x = inchesToScreen(x);
		mesh.position.z = inchesToScreen(y);
		mesh.position.y = inchesToScreen(base_height);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		mesh.name = "wall";
		
		scene.add(mesh);
		
		x_1 = screenToInches(x1 - (screen_width / 2 ));
		y_1 = screenToInches(y1 - (screen_height / 2));
		x_2 = screenToInches(x2 - (screen_width / 2 ));
		y_2 = screenToInches(y2 - (screen_height / 2));
		
		render();
	}
	
	path.drag(moveall, start, up);
	handle.drag(move, start, up);
	handle2.drag(move2, start, up);
	
	toFront(path);
	toFront(handle);
	toFront(handle2);
	
	handle.attr({cx: x2, cy: y2});
	handle2.attr({cx: x1, cy: y1});
	updateGeometry();
	
	var id = guid();
	this.id = id;
	
	var click = function(event) {
		if (scope.state === 0) {
			updateSelected(id);
		} else {
			updateSelected(null);
		}
	};
	
	path.click(click);
	
	this.setState = function(state) {	_setState(state); };
	
	function _setState(state) {
		scope.state = state;
		if (scope.state === 0) {
			path.animate({ stroke: 'yellow' }, 250);
		} else {
			path.animate({ stroke: "#EE52EE"}, 250);
		}	
	}
	
	this._delete = function () {
		scene.remove(mesh);
		path.remove();
		handle.remove();
		handle2.remove();
		render();
	};
}

/* Collision Detection Area */
var in_range = function (val, start, size) {
	return !(val + size < start || val > start + size);				
};

function rect_collision (x1, y1, width1, height1, x2, y2, width2, height2) {
	var a = {top: parseFloat(y1), bottom: parseFloat(y1) + parseFloat(height1), left: parseFloat(x1), right: parseFloat(x1) + parseFloat(width1)};
	var b = {top: parseFloat(y2), bottom: parseFloat(y2) + parseFloat(height2), left: parseFloat(x2), right: parseFloat(x2) + parseFloat(width2)};
	return !(a.left + 1 > b.right || a.right - 1 < b.left ||
			a.top + 1 > b.bottom || a.bottom - 1 < b.top);											
}
/* End Collision Detection */

function createCrown() {
	var convexHull = new ConvexHullGrahamScan();
	for (var i = 0; i < z.length; i++) {
		if ( z[i].base_height > 53 ) {
			convexHull.addPoint(z[i].x + (z[i].width / 2), z[i].y + (z[i].height / 2));
			convexHull.addPoint(z[i].x - (z[i].width / 2), z[i].y + (z[i].height / 2));
			convexHull.addPoint(z[i].x - (z[i].width / 2), z[i].y - (z[i].height / 2));
			convexHull.addPoint(z[i].x + (z[i].width / 2), z[i].y - (z[i].height / 2));
		}		
	}
	var hullPoints = convexHull.getHull();
	
	var p2 = []
		for ( var i = 0; i < hullPoints.length; i ++ ) {
			p2.push([inchesToScreen(+hullPoints[i].x), inchesToScreen(+hullPoints.y) ]);
		}
	
	if ( crownMesh !== 0 ) {
		scene.remove(crownMesh);
	}
	
	crownMesh = makeCrown( p2, 0, 0, 96, base_material, true );
	scene.add(crownMesh);
}

function Zone (typ, sdoor, sdrawer, ssku, px, py, nheight, nwidth, ndepth, nrotation, nbase_height, do_save) {
	"use strict";
	
	if( typeof nrotation === 'undefined' ) {
		nrotation = 0;
	}
	
	var type = typ;
	var color = (nbase_height < 54) ? (nheight > 54) ? "#33FF99" : "#3399FF" : "#FF9933";
	this.door = sdoor;
	this.drawer = sdrawer;
	var sku = ssku;
	this.sku = sku;
	this.depth = ndepth;
	var depth = ndepth;
	this.width = nwidth;
	var width = nwidth;
	this.x = px;
	this.y = py;
	this.base_x = px;
	this.base_y = py;
	var shape;
	var rotation = nrotation;
	this.rotation = nrotation;
	this.height = nheight;
	var id = guid();
	this.id = id;
	this.base_height = nbase_height;
	var material;
	this.material = material;
	this.state = 0;
	var scope = this;
	var updateSave = false;
	var x = px;
	var y = py;
	var dragging = false;
	var collidebox;
	var mesh;
	
	this.update = function() {
		scope = this;
	};
	
	if(typeof(do_save)==='undefined') do_save = true;
	
	
	if (type === 'refrigerator' || type === 'oven' || type === 'microwave') {
		color = "#33FF99";
		var groundTex = THREE.ImageUtils.loadTexture( './resources/textures/rough2.png' );
		groundTex.repeat.set( 0.04, 0.08 );
		groundTex.anisotropy = maxAnisotropy;
		groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping;
		material = new THREE.MeshPhongMaterial({
			color: sku,
		ambient: sku,
		emissive: 0x030303,
		specular: 0x050505, shininess: 300,
		/*map: groundTex,*/
		metal: true
		
		});
	}
	this.material = material;

	function getSku() {
		return sku;
	}

	function getId() {
		return id;
	}
	this.id = getId();
	
	this.updateMaterial = function(mat) {
		mesh.traverse( function (child) {
			if ( child instanceof THREE.Mesh ) {
					child.material = mat;
					child.material.needsUpdate = true;
			}
		});
		render();
	};
	
	function updateMaterial(obj, mat) {
		obj.traverse( function (child) {
			if ( child instanceof THREE.Mesh ) {
					child.material = mat;
					child.material.needsUpdate = true;
			}
		});
		
		render();
	}
	
	function setID() {
		mesh.traverse( function (child) {
			if ( child instanceof THREE.Mesh ) {
					child.name = id;
			}
		});
	}
	
	function nullID(obj) {
		obj.traverse( function (child) {
			if ( child instanceof THREE.Mesh ) {
					child.name = null;
					child.receiveShadow = false;
					child.castShadow = false;
			}
		});
	}
	
	var vertShader = 'uniform vec3 viewVector; uniform float c; uniform float p; varying float intensity; void main() {vec3 vNormal = normalize( normalMatrix * normal ); vec3 vNormel = normalize( normalMatrix * viewVector );intensity = pow( c - dot(vNormal, vNormel), p );gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }';
	var fragShader = 'uniform vec3 glowColor; varying float intensity; void main() {vec3 glow = glowColor * intensity;gl_FragColor = vec4( glow, 1.0 );}';
	
	var glowMaterial = new THREE.ShaderMaterial( 
	{
		uniforms: 
		{ 
			"c":	{ type: "f", value: 1.0 },
			"p":	{ type: "f", value: 1.4 },
			glowColor: { type: "c", value: new THREE.Color(0xffff00) },
			viewVector: { type: "v3", value: camera.position }
		},
		vertexShader: vertShader,
		fragmentShader: fragShader,
		side: THREE.FrontSide,
		blending: THREE.AdditiveBlending,
		transparent: true
	}	);
	
	this.build = function() {
		if (mesh && type === 'winerack' || type === 'winerackvertical') {
			scope.updateMaterial(base_material);
		} else {
		if (mesh) {
			scene.remove(mesh);
		}
			mesh = buildShape(type, inchesToScreen(scope.height), inchesToScreen(scope.width), inchesToScreen(scope.depth), inchesToScreen(scope.x), inchesToScreen(scope.y), inchesToScreen(scope.base_height), scope.sku, scope.door, scope.drawer, rotation, scope.material);
			mesh.name = id;
			
			setID();
			addObject(mesh);
			
			if (glow) {
				scene.remove(glow);
				glow = mesh.clone();
				updateMaterial(glow, glowMaterial);
				glow.scale.set(1.1, 1.0, 1.1);
				glow.position.x = mesh.position.x;
				glow.position.y = 0;
				glow.position.z = mesh.position.z;
				nullID(glow);
				scene.add(glow);
			}
			renderer.render( scene, camera );
		}
	};
	
	this.build();
	var glow = false;
	mesh.name = id;
	setID();
	addObject(mesh);
	
	this.object = function() {
		return mesh;
	};
	
	var innershape;
	
	if ( scope.width < 9 || scope.depth < 9 ) {
		var _x = inchesToScreen(scope.x) + (screen_width / 2) - inchesToScreen(scope.width / 2),
			_y = inchesToScreen(scope.y) + (screen_height / 2) - inchesToScreen(scope.depth / 2), 
			_x2 = _x + inchesToScreen(scope.width), 
			_y2 = _y + inchesToScreen(scope.depth), 
			_cx = _x + inchesToScreen(scope.width / 2), 
			_cy = _y + inchesToScreen(scope.depth / 2);
	
		innershape = paper.path("M" + (+_cx - 5) + " " + (+_cy) + "a5 5 0 1 0 10 0a5,5 0 1,0 -10,0Z M" + _x + " " + _y + "L" + _x + " " + _y2 + "L" + _x2 + " " + _y2 + "L" + _x2 + " " + _y + "Z");
		innershape.attr({fill: color, 'stroke': 'black', 'strokeWidth': 0.1});
		innershape.attr({ x: _x, y: _y });
		innershape.attr({"nx": 0});
		innershape.attr({"ny": 0});
	} else {
		innershape = paper.rect(inchesToScreen(scope.x) - inchesToScreen(scope.width / 2) + (screen_width / 2), inchesToScreen(scope.y) - inchesToScreen(scope.depth / 2) + (screen_height / 2), inchesToScreen(scope.width), inchesToScreen(scope.depth));
		innershape.attr({fill: color, 'stroke': 'black', 'stroke-dasharray': '- ', 'strokeWidth': 0.5});
		innershape.attr({"nx": 0});
		innershape.attr({"ny": 0});
	}	
	
	toBack(innershape);
	innershape.transform('R' + rotation);	
	innershape.node.id = this.id;
	var f = paper.filter(Snap.filter.shadow(0, 0, 15, 'black', 0.75));
	innershape.attr({filter: f});
	
	this.getBBox = function() {
		return innershape.getBBox();
	};
	
	this.pointInside = function(x, y) {
		return innershape.isPointInside(x, y);
	};
	
	this.HighlightBB = function() {
		innershape.ftHighlightBB();
	};
	
	
	
	innershape.ftHighlightBB();
	
	innershape.node.onclick = function () {
		
		if (!dragging) {
			if (scope.state === 0) {
				updateSelected(id);
			} else {
				updateSelected(null);
			}
		}
	};
	
	this.setState = function(state) {	_setState(state); };
	
	function _setState(state) {
		scope.state = state;
		if (scope.state === 0) {
			innershape.animate({ fill: color, 'stroke': 'black', 'stroke-dasharray': '- ', 'strokeWidth': 0.5 }, 250);
			if (glow) {
				scene.remove(glow);
				glow = false;
			}
			render();
		} else {
			innershape.animate({ fill: "#EE52EE", 'stroke': 'black', 'stroke-dasharray': '- ', 'strokeWidth': 2 }, 250);
			if( !glow ) {
				glow = mesh.clone();
				updateMaterial(glow, glowMaterial);
				glow.scale.set(1.1, 1.0, 1.1);
				glow.position.x = mesh.position.x;
				glow.position.z = mesh.position.z;
				nullID(glow);
				scene.add(glow);
				render();
			}
		}		
	}
	
	if (nbase_height < 54) { 
			toBack(innershape);
		} else {
			toFront(innershape);
		}
		
	this.getY = function() {
		return Number(y);
	};
	this.getX = function() {
		return Number(x);
	};
	this.getShape= function() {
		return innershape;
	};
	
		
	this.update = function() {
		color = ((nbase_height < 54) ? "#3399FF" : "#FF9933");
		if (nbase_height < 54) { 
			toBack(innershape);
		} else {
			toFront(innershape);
		}
	};
	/* toFront(innershape.node.children[0]); */

	this._delete = function () {
		scene.remove(mesh);
		innershape.clearBB();
		innershape.remove();
		if (glow) {
			scene.remove(glow);
			glow = false;
		}
		/* scope = null; */
		render();
	};
	
	
	
	/* Begin Dragging */
	var start = function () {
		// storing original coordinates
		this.ox = this.attr('x');
		this.oy = this.attr('y');
		this.tx = this.attr('nx');
		this.ty = this.attr('ny');
		dragging = true;
	};
	
	var start2 = function () {
		// storing original coordinates
		innershape.ox = innershape.attr('x');
		innershape.oy = innershape.attr('y');
		innershape.tx = innershape.attr('nx');
		innershape.ty = innershape.attr('ny');
		dragging = true;
	};
	
	this.move = function( dx, dy ) {
		innershape.move(dx, dy);
	};
	
	innershape.move = function( dx, dy ) {
		start2();
	
		var x_collide, y_collide;
		var x = (parseFloat(innershape.ox) + parseFloat(dx));
		var y = (parseFloat(innershape.oy) + parseFloat(dy));
				
		innershape.attr({x:x});
		innershape.attr({y:y});
				
		var xSnap = Snap.snapTo(inchesToScreen(0.75), innershape.attr('x'), 100000000);
		var ySnap = Snap.snapTo(inchesToScreen(0.75), innershape.attr('y'), 100000000);
		innershape.attr({
			x: xSnap,
			y: ySnap
		});
		
		scope.x = Math.round(screenToInches(innershape.attr('x')) + scope.width / 2 - screenToInches(screen_width / 2 ) );
		scope.y = Math.round(screenToInches(innershape.attr('y')) + scope.depth / 2 - screenToInches(screen_height / 2) );
		
		mesh.position.x = inchesToScreen(scope.x);
		mesh.position.z = inchesToScreen(scope.y);
		
		if (glow) {
			glow.position.x = mesh.position.x;
			glow.position.z = mesh.position.z;
		}
		
		if ( scope.width < 9 || scope.depth < 9 ) {
			innershape.transform("T" + Snap.snapTo(inchesToScreen(0.75), inchesToScreen(scope.x), 100000000) + " " + Snap.snapTo(inchesToScreen(0.75), inchesToScreen(scope.y), 100000000) + "R" + rotation);
			innershape.attr({"nx": inchesToScreen(scope.x)});
			innershape.attr({"ny": inchesToScreen(scope.y)});
		} else {
			innershape.transform("R" + rotation);
		}
				
		innershape.ftHighlightBB();
		
		renderer.render( scene, camera );

		end();
	};
	
	var move = function (dx, dy) {
		var x_collide, y_collide;

		/* Removed limits - they are being problematic */
		var x = (parseFloat(this.ox) + parseFloat(dx));
		var y = (parseFloat(this.oy) + parseFloat(dy));
				
		this.attr({x:x});
		this.attr({y:y});
				
		var xSnap = Snap.snapTo(inchesToScreen(1.5), this.attr('x'), 100000000);
		var ySnap = Snap.snapTo(inchesToScreen(1.5), this.attr('y'), 100000000);
		
		this.attr({
			x: xSnap,
			y: ySnap
		});
		
		scope.x = Math.round(screenToInches(this.attr('x')) + scope.width / 2 - screenToInches(screen_width / 2 ) );
		scope.y = Math.round(screenToInches(this.attr('y')) + scope.depth / 2 - screenToInches(screen_height / 2) );
		
		mesh.position.x = inchesToScreen(scope.x);
		mesh.position.z = inchesToScreen(scope.y);
		
		if (glow) {
			glow.position.x = mesh.position.x;
			glow.position.z = mesh.position.z;
		}
		
		if ( scope.width < 9 || scope.depth < 9 ) {
			this.transform("T" + Snap.snapTo(inchesToScreen(1.5), inchesToScreen(scope.x), 100000000) + " " + Snap.snapTo(inchesToScreen(1.5), inchesToScreen(scope.y), 100000000) + "R" + rotation);
			this.attr({"nx": inchesToScreen(scope.x)});
			this.attr({"ny": inchesToScreen(scope.y)});
		} else {
			this.transform("R" + rotation);
		}
				
		innershape.ftHighlightBB();
		
		/* TODO: Fix outline detection in createCrown */
		/* createCrown(); */
		
		renderer.render( scene, camera );
		
	};

	var end = function () {
		dragging = false;
	};
	
	this.rotate = function() {
		rotation += 45;
		if (rotation >= 360) {
			rotation = 0;
		}	
	
		innershape.transform('T' + innershape.attr('nx') + " " + innershape.attr('ny') + 'R' + rotation);
		innershape.ftHighlightBB();
		scope.rotation = rotation;
		mesh.rotation.y = degreesToRadians(rotation);
		
		if (glow) {
			scene.remove(glow);
			glow = mesh.clone();
			updateMaterial(glow, glowMaterial);
			glow.scale.set(1.1, 1.0, 1.1);
			glow.position.x = mesh.position.x;
			glow.position.z = mesh.position.z;
			nullID(glow);
			scene.add(glow);
		}
		
		renderer.render( scene, camera );
	};
	innershape.drag(move, start, end);
	/* End Dragging/Rotating */
		
	if (do_save) {
		save(this);
	}
	
	renderer.render( scene, camera );
	
}

Snap.plugin( function( Snap, Element, Paper, global ) {

		var ftOption = {
			handleFill: "silver",
			handleStrokeDash: "5,5",
			handleStrokeWidth: "2",
			handleLength: "75",
			handleRadius: "7",
			handleLineWidth: 2
		};
		/*jshint expr:true */
		Element.prototype.ftHighlightBB = function() {
			this.data("bbT") && this.data("bbT").remove();
			this.data("bb") && this.data("bb").remove();

			this.data("bbT", this.paper.rect( rectObjFromBB( this.getBBox(1) ) )
							.attr({ fill: "none", stroke: ftOption.handleFill, strokeDasharray: ftOption.handleStrokeDash })
							.transform( this.transform().local.toString() ) );
			this.data("bb", this.paper.rect( rectObjFromBB( this.getBBox() ) )
							.attr({ fill: "none", stroke: ftOption.handleFill, strokeDasharray: ftOption.handleStrokeDash }) );
			return this;
		};
		
		Element.prototype.clearBB = function() {
			this.data("bbT") && this.data("bbT").remove();
			this.data("bb") && this.data("bb").remove();

			return this;
		};
		
});

	
function rectObjFromBB ( bb ) {
	return { x: bb.x, y: bb.y, width: bb.width, height: bb.height };
}

function toFront(el) {
	el.appendTo(paper);
}
function toBack(el) {
	el.prependTo(paper);
}


function swap(i, c) {
	
}

function save(itm) {
	var i = 0, len = z.length;
	var cab = [];
	if ( itm ) {
		cab.push({"sku": itm.sku, "x": itm.x, "y": itm.y, "base_height": itm.base_height, "rotation": itm.rotation});
	}
	for ( i = 0; i < len; i++ ) {
		if ( z[i] !== null ) {
			cab.push({"sku": z[i].sku, "x": z[i].x, "y": z[i].y, "base_height": z[i].base_height, "rotation": z[i].rotation});
		}
	}
	
	var walls = [];
	len = w.length;
	for ( i = 0; i < len; i++ ) {
		if ( w[i] !== null ) {
			var x1 = w[i].x1();
			var y1 = w[i].y1();
			var x2 = w[i].x2();
			var y2 = w[i].y2();
			walls.push({"x1": x1,"y1": y1,"x2": x2,"y2": y2});
		}
	}
	
	var data = {"line": cab_line, "items": cab, "floor": floor_tex, "walls": walls};

	$.jStorage.set("CabinetDesign", data);
}

function getCabinetDef(sku) {
	var i = 0, len = cab_def.length;
	for ( i = 0; i < len; i++ ) {
		var p = cab_def[i];
		if (p.sku === sku) {
			return p;
		}
	}
}

function load() {
	/* Check url for shared design data... */
	var value = typeof shared_data !== 'undefined' ? shared_data : false;
	if (value) {
		value = JSON.parse( window.atob( value ) );
	} else {
		/* Load cabinet design from local storage if it exists */
		value = $.jStorage.get("CabinetDesign");
	}
	
	if(value){
		
		cab_line = value.line ? value.line : 'SVH';
		if (value.floor) {
			floor_tex = value.floor;
			updateFloorTexture(floor_tex);
		}
		var c = getCabinetLine();
		var i = 0, len = value.items.length;
		for ( i = 0; i < len; i++ ) {
			var p = value.items[i];
			
			var itm = getCabinetDef(p.sku.substring( 0, p.sku.indexOf(".", 3) + 1 ));
			
			if (typeof(itm) !== 'undefined') {
				var door = c.door;
				var drawer = c.drawer;
				if (itm.door !== 'default') {
					door = itm.door;
				}	
				
				var type = getTypeWithOptions(itm.type, 0);
				
				z.push(new Zone(type, door, drawer, p.sku, p.x, p.y, itm.height, itm.width, itm.depth, p.rotation, p.base_height, false));
			} else {
				if (p.sku === '#EEFFEE') {
					z.push(new Zone('refrigerator', 'topmount', null, '#EEFFEE', p.x, p.y, 69, 36, 29, p.rotation, p.base_height, false));
				}
			}
			
			
		}		
		updateCabinetTexture(getCabinetLineTexture(), cab_line, c.name);
		
		len = value.walls.length;
		for ( i = 0; i < len; i++ ) {
			var j = value.walls[i];
			
			w.push(new Wall(j.x1, j.y1, j.x2, j.y2));
		}	
		
	}
}

$(window).resize(function () { cameraUpdate(); });

function cameraUpdate() {
	"use strict";
	WIDTH = document.getElementById('container').clientWidth;
	HEIGHT = document.getElementById('container').clientHeight;
	var VIEW_ANGLE = 45, ASPECT = WIDTH / HEIGHT, NEAR = 0.1, FAR = 10000;
	camera.aspect = ASPECT;
	camera.updateProjectionMatrix();
	renderer.setSize( WIDTH, HEIGHT );
	renderer.render( scene, camera );
	
	_WIDTH = document.getElementById('canvas').clientWidth;
	_HEIGHT = document.getElementById('canvas').clientHeight;
	paper.attr({
		width: _WIDTH + 'px',
		height: _HEIGHT + 'px'
	});
}

$("#wall").click(function(event) {
	w.push( new Wall(0, 0, 0, 90) );
});
$("#delete_wall").click(function(event) {
	deleteSelected();
});

$("#refrigerator").click(function(event) {
	z.push(new Zone('refrigerator', 'topmount', null, '#EEFFEE', 0, 0, 69, 36, 29, 0, 0, false));
});

$("#clear_all").click(function(event) {
	if (confirm('Are you sure you want to clear this design?')) {
		for (var i = 0; i < z.length; i++) {
			z[i]._delete();
		}
		z = [];
		
		for (i = 0; i < w.length; i++) {
			w[i]._delete();
		}
		w = [];
		
		save();
		$("#cart").html('');
		$("#price").html('$ 0.00');
		$("#ui").fadeTo(100,0.1, function() { $("#ui").hide(); });
		$( "#information" ).html('');
	}
});
$("#share").click(function(event) {
	var value = $.jStorage.get("CabinetDesign");
	var currentTime = new Date().toDateString();
	if (value.items.length > 0) {
		value = JSON.stringify(value);
		window.location.href = 'mailto: ?subject=New Kitchen Cabinet Design.&body=I want to share this kitchen design with you on the Custom Service Hardware website.%0D%0A%0D%0A Click this link or paste it into your web browser:%0D%0A ' + getShareLink(value) + '%0D%0A%0D%0AThis design was created at http://www.cshardware.com/designer/cabinet-designer.html on ' + currentTime;
	} else {
		alert("There is no design to send!");
	}
		
});



function getShareLink(value) {
	save();
	var url = '';
	if (document.URL.indexOf("?") > -1) {
		url = document.URL.substring(0, document.URL.indexOf("?") - 1);
	} else {
		url = document.URL;
	}
	return url + '?data=' + window.btoa(value);
}

function Crown( points, nbase_height, nmat, x, y, profile ) {
	var base_height = nbase_height, x, y, mesh, pts = typeof points === 'undefined' ? [[0,0],[0,96]] : points;
	var handles = [];
	this.base_height = base_height;
	this.x = x;
	this.y = y;
	
	for ( var i = 0; i < pts.length; i ++ ) {
		pts[i][0] = inchesToScreen(pts[i][0]) + (screen_width / 2);
		pts[i][1] = inchesToScreen(pts[i][1]) + (screen_height / 2);
	}
	var path = paper.path(toPath(pts));
	path.attr({"stroke-width": 7, stroke: "yellow", fill: "none"});
	var pathArray = parse(path.attr("path"));
	
	function parse(s) {
		var arr = [];
		var str = s.split(/M|L/g);		
		arr.push(["M", str[1].split(" ")[0], str[1].split(" ")[1]]);
		for ( var i = 2; i < str.length; i++ ) {
			arr.push(["L", str[i].split(" ")[0], str[i].split(" ")[1]]);
		}		
		return arr;
	}
	function parse2(s) {
		var arr = [];
		var str = s.split(/M|L/g);		
		arr.push([+str[1].split(" ")[0], +str[1].split(" ")[1]]);
		for ( var i = 2; i < str.length; i++ ) {
			arr.push([+str[i].split(" ")[0], +str[i].split(" ")[1]]);
		}		
		return arr;
	}
	function toPath(arr) {
		var p = "M" + arr[0][0] + " " + arr[0][1];
		for  ( var i = 1; i < arr.length; i ++ ) {
			p = p + "L" + arr[i][0] + " " + arr[i][1];
		}
		return p;	
	}
	function toPath2(arr) {
		var path = "";		
		for  ( var i = 0; i < arr.length; i ++ ) {
			path = path + arr[i][0] + arr[i][1] + " " + arr[i][2];
		}	
		return path;	
	}
	
	for ( var i = 0; i < pts.length; i ++ ) {
		handles.push( new Handle( pts[i][0], pts[i][1], i, path, this ) );
	}
	
	function updateGeometry(idx) {
		toFront(path);
		for ( var i = 0; i < handles.length; i ++ ) {
			toFront(handles[i].handle);
		}
			
		if ( mesh ) {
			scene.remove(mesh);
		}
		
		var p2 = []
		for ( var i = 0; i < handles.length; i ++ ) {
			if ( idx !== i ) {
				p2.push([+handles[i].handle.attr("cx"), +handles[i].handle.attr("cy") ]);
			}
		}
		
		var p = parse2(path.attr("path"));
		mesh = makeCrown( p, x, y, base_height, nmat, true, profile );

		var w2 =  getWidth2(p2) / 2, h2 = getHeight2(p2) / 2;
		x = w2;
		y = h2;
		$("#debug").html( '<strong>W: ' + w2 + ' H: ' + h2 + '</strong>');
		mesh.position.x = x;
		mesh.position.z = y;
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		
		scene.add(mesh);
		
		render();
	}
	this.updateGeometry = function() { updateGeometry() };
	
	function area(arr) {
        var area = 0,
            i,
            j,
            point1,
            point2;

        for (i = 0, j = arr.length - 1; i < arr.length; j=i,i++) {
            point1 = arr[i];
            point2 = arr[j];
            area += point1[0] * point2[1];
            area -= point1[1] * point2[0];
        }
        area /= 2;

        return area;
    };

    function centroid(arr) {
        var x = 0,
            y = 0,
            i,
            j,
            f,
            point1,
            point2;

        for (i = 0, j = arr.length - 1; i < arr.length; j=i,i++) {
            point1 = arr[i];
            point2 = arr[j];
            f = point1[0] * point2[1] - point2[0] * point1[1];
            x += (point1[0] + point2[0]) * f;
            y += (point1[1] + point2[1]) * f;
        }

        f = area(arr) * 6;

        return [[x / f],[y / f]];
    };
	
	updateGeometry();
}

/* TODO: finish make crown - when we create a crown object, we want to do it in 3-point increments, because this handles corners best. Doing more points bends too much and distorts the results */
function makeCrown( points, x, y, nbase_height, nmat, adjust_frame, profile ) {
	var base_height = (nbase_height)
	var prof = (typeof profile !== 'undefined') ? profile : crown_profile;
	var pts = points; 
	var geom, mesh;
	var id = guid();
	this.id = id;
	var material = nmat;
	profileHeight = inchesToScreen(getHeight( prof.points ));
	profileWidth  = inchesToScreen(getWidth(  prof.points ));
	
	var object = new THREE.Object3D();
	
	
	var spline = [];
	for ( var i = 0; i < pts.length; i ++ ) {
		spline.push( new THREE.Vector3( (pts[i][1]), 0, -(pts[i][0]) ) );
	}
	var extrudeSpline =	new THREE.SplineStraight3( spline );
	
	var shape = [];
	for ( i = 0; i < prof.points.length; i ++ ) {
		shape.push( new THREE.Vector2( inchesToScreen(prof.points[i].y), -inchesToScreen(prof.points[i].x) ) );
	}
	var crownShape = new THREE.Shape( shape );
	
	var frames;
	if (adjust_frame) {
		frames = new THREE.TubeGeometry.NewFrenetFrames( extrudeSpline, pts.length - 1, false);
	}
	
	var extrusionSettings = {
		bevelEnabled: false,
		material: 0, extrudeMaterial: 1,
		steps: pts.length - 1,
		extrudePath: extrudeSpline,
		frames: frames
	};	
	
	geom = new THREE.ExtrudeGeometry( crownShape, extrusionSettings );
	geom.computeFaceNormals();
	geom.center();

	mesh = new THREE.Mesh( geom, material );
	mesh.geometry.applyMatrix( new THREE.Matrix4().makeRotationY( degreesToRadians(90) ) );
	mesh.castShadow = true;
	mesh.position.x = inchesToScreen(x);
	mesh.position.z = inchesToScreen(y) + profileWidth / 3.5;
	mesh.position.y = base_height + profileHeight / 2;
	mesh.receiveShadow = true;
	mesh.name = "Crown Molding";
		
	object.add(mesh);
	
		
	return object;

}

function test() {
						/* points, nbase_height, nmat, profile */
	/* var c = new Crown([[0,0],[0,21],[21,21],[21,0]], 54, base_material, 0, 0); */

}

$(document).ready(function () {
	"use strict";
	/* $('#container').css({'width': window.innerWidth - 64, 'height': window.innerHeight - 128}); */

	/* Check to see if the browser supports WebGL... if not, display the message.*/
	if ( ! Detector.webgl ) { Detector.addGetWebGLMessage(); }

	WIDTH = document.getElementById('container').clientWidth;
	HEIGHT = document.getElementById('container').clientHeight;
	_WIDTH = document.getElementById('canvas').clientWidth;
	_HEIGHT = document.getElementById('canvas').clientHeight;

	var VIEW_ANGLE = 45, ASPECT = WIDTH / HEIGHT, NEAR = 0.1, FAR = 10000;
	container = document.getElementById('container');
	renderer = new THREE.WebGLRenderer({preserveDrawingBuffer: true, antialias: true, alpha: true});
	renderer.setClearColor( 0x777777, 1);
	camera =	new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
	
	scene = new THREE.Scene();

	scene.add(camera);

	/* the camera starts at 0,0,0
	so pull it back and give it a good location */
	camera.position.y = 350;
	camera.position.x = 0;
	camera.position.z = 450;
	camera.lookAt(new THREE.Vector3(0, 0, 0));

	controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.maxPolarAngle = (Math.PI / 2) - 0.03;
	controls.addEventListener( 'change', render );

	var ambientLight = new THREE.AmbientLight(0x777777);
	scene.add(ambientLight);
	renderer.shadowMapEnabled = true;
	renderer.shadowMapSoft = true;
	renderer.shadowMapType = THREE.PCFSoftShadowMap;

	/* ***********************************************************
	Setup directional lighting - this is a parallel stream of
	light. Can cast shadows, but only mesh by mesh, not on 
	whole Object3Ds.
	********************************************************** */
	var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
	directionalLight.position.set(-750, 750, 750);
	directionalLight.castShadow = true;
	directionalLight.shadowCameraVisible = false;
	directionalLight.intensity = 1.0;
	directionalLight.castShadow = true;
	directionalLight.shadowDarkness = 0.25;
	directionalLight.shadowBias = 0.0001;
	directionalLight.shadowMapWidth = directionalLight.shadowMapHeight = 2048;
	directionalLight.shadowCameraNear = 150;
	directionalLight.shadowCameraFar = 2550;
	directionalLight.shadowCameraLeft = -1200;
	directionalLight.shadowCameraRight = 1200;
	directionalLight.shadowCameraTop = 1200;
	directionalLight.shadowCameraBottom = -1200;
	
	scene.add(directionalLight);
	/* *********************************************************** */
	
	/* var light = new THREE.PointLight( 0xffff00, 1, 300 ); 
	light.position.set( 0, inchesToScreen(96), floor_size / 2 );
	var sphere = new THREE.SphereGeometry( 1, 16, 8 );
	light.add( new THREE.Mesh( sphere, new THREE.MeshPhongMaterial( { color: 'yellow' } ) ) );
	scene.add( light ); */
	
	/* *********************************************************** */
	/* Sky box */
	var urlPrefix = "./images/sky/";
	var urls = [ urlPrefix + "bg.png", urlPrefix + "bg.png",
		urlPrefix + "bg.png", urlPrefix + "bg.png",
		urlPrefix + "bg.png", urlPrefix + "bg.png" ];
		
	var skyGeometry = new THREE.BoxGeometry( floor_size * 5, floor_size * 5, floor_size * 5 );
	controls.maxDistance = floor_size * 2.5;
	
	var materialArray = [];
	for (var i = 0; i < 6; i++)
		materialArray.push( new THREE.MeshBasicMaterial({
			map: THREE.ImageUtils.loadTexture( urls[i] ),
			side: THREE.BackSide
		}));
	var skyMaterial = new THREE.MeshFaceMaterial( materialArray );
	var skyBox = new THREE.Mesh( skyGeometry, skyMaterial );
	skyBox.position.y = floor_size * 2;
	skyBox.rotation.y = degreesToRadians(180);
	scene.add( skyBox );
	/* ************************************************************ */

	
	/*var groundTex = base64Texture( floor[0] );*/
	floor_tex = floor[2];
	var groundTex = THREE.ImageUtils.loadTexture( floor[2] );
	groundTex.repeat.set( 8, 8 );
	groundTex.anisotropy = maxAnisotropy;
	groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping;
	solidGround = new THREE.Mesh(
	new THREE.PlaneBufferGeometry( floor_size, floor_size, 5, 5 ),
	new THREE.MeshPhongMaterial( { side: THREE.DoubleSide, map: groundTex } ) 
	);
	
	var groundTex2 = base64Texture( grass );
	groundTex2.repeat.set( 25, 25 );
	groundTex2.anisotropy = maxAnisotropy;
	groundTex2.wrapS = groundTex2.wrapT = THREE.RepeatWrapping;
	var solidGround2 = new THREE.Mesh(
	new THREE.PlaneBufferGeometry( floor_size * 5, floor_size * 5, 5, 5 ),
	new THREE.MeshPhongMaterial( { color: 0xffffff, side: THREE.DoubleSide, map: groundTex2 } ) );
	scene.add(solidGround2);

	solidGround2.position.y = -2;
	solidGround2.rotation.x = 270 * (Math.PI / 180);
	solidGround2.receiveShadow = true;
	solidGround.rotation.x = 270 * (Math.PI / 180);
	solidGround.position.z = 0;
	solidGround.receiveShadow = true;
	solidGround.castShadow = false;
	scene.add(solidGround);

	renderer.setSize(WIDTH, HEIGHT);

	container.appendChild(renderer.domElement);
	maxAnisotropy = renderer.getMaxAnisotropy();
	/* var texture1 = base64Texture( woodTex ); */
	var texture1 = THREE.ImageUtils.loadTexture( "./resources/textures/savannah-honey.jpg" );
	texture1.anisotropy = maxAnisotropy;
	texture1.wrapS = texture1.wrapT = THREE.RepeatWrapping;
	texture1.repeat.set( 0.02, 0.02);
	base_material = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture1 } );
	
	texture1 = THREE.ImageUtils.loadTexture( wall_tex[0] );
	texture1.anisotropy = maxAnisotropy;
	texture1.wrapS = texture1.wrapT = THREE.RepeatWrapping;
	texture1.repeat.set( 0.02, 0.02);
	wall_material = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture1 } );
	
	/* Setup Raphael paper */
	screen_width = document.getElementById('canvas').clientWidth;
	screen_height = document.getElementById('canvas').clientHeight;
	
	/* Setup Physijs */
	/* Physijs.scripts.worker = 'physijs_worker.js';
	Physijs.scripts.ammo = 'ammo.js'; */

	/* Create "paper" to draw on */
	paper = Snap("#canvas_container");
	
	drawGrid(paper);

	/* paper.zpd(); */

	/* projector = new THREE.Projector(); */
	renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
	renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );

	test();
});

function onDocumentMouseMove( event ) {
	event.preventDefault();
	var x = event.clientX;
	var y = event.clientY;
	var canvas = document.getElementById("container");
	x -= canvas.offsetLeft;
	y -= canvas.offsetTop;

	mouse.x = (x / WIDTH) * 2 - 1;
	mouse.y = -(y / HEIGHT) * 2 + 1;
	
}

function onDocumentMouseDown(event) {
	var eventType = '';
	if ( event.button === 0 ) {
			eventType = 'select';
	}
	if ( eventType === 'select' ) {
		var vector = new THREE.Vector3( mouse.x, mouse.y, 0.5 );
		vector.unproject( camera );
		var raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );
		var intersects = raycaster.intersectObjects(scene.children, true);
		if ( intersects.length > 0 ) {
			if ( intersects[0].object.name !== '' ) {
				updateSelected( intersects[0].object.name );
			}
		}
	}
}

/* Draw background grid for screen */
function drawGrid(canvas) {
	"use strict";
	var x, y;

	var ruler_h = canvas.path("M " + ((screen_width / 2) - (floor_size / 2)) + " " + ((screen_height / 2) - (floor_size / 2) - 15) + " l " + (floor_size / 2.5) + " 0 z");
	ruler_h.attr({stroke: "#aaa", 'stroke-width': 1});
	ruler_h = canvas.path("M " + ((screen_width / 2) + (floor_size / 2) - (floor_size / 2.5) - 1) + " " + ((screen_height / 2) - (floor_size / 2) - 15) + " l " + (floor_size / 2.5) + " 0 z");
	ruler_h.attr({stroke: "#aaa", 'stroke-width': 1});
	ruler_h = canvas.path("M " + ((screen_width / 2) + (floor_size / 2)) + " " + ((screen_height / 2) - (floor_size / 2) - 10) + " l 0 -10 z");
	ruler_h.attr({stroke: "#aaa", 'stroke-width': 1});
	ruler_h = canvas.path("M " + ((screen_width / 2) - (floor_size / 2) - 1) + " " + ((screen_height / 2) - (floor_size / 2) - 10) + " l 0 -10 z");
	ruler_h.attr({stroke: "#aaa", 'stroke-width': 1});
	ruler_h = canvas.text((screen_width / 2) - 12.5,((screen_height / 2) - (floor_size / 2) - 10), "16 ft" );
	ruler_h.attr({fill: "#aaa"});
	
	var ruler_v = canvas.path("M " + ((screen_width / 2) - (floor_size / 2) - 15) + " " + ((screen_height / 2) - (floor_size / 2) + 1) + " l 0 " + (floor_size / 2.5) + " z");
	ruler_v.attr({stroke: "#aaa", 'stroke-width': 1});
	ruler_v = canvas.path("M " + ((screen_width / 2) - (floor_size / 2) - 15) + " " + ((screen_height / 2) + (floor_size / 2) - 1) + " l 0 -" + (floor_size / 2.5) + " z");
	ruler_v.attr({stroke: "#aaa", 'stroke-width': 1});
	ruler_v = canvas.path("M " + ((screen_width / 2) - (floor_size / 2) - 10) + " " + ((screen_height / 2) + (floor_size / 2)) + " l -10 0 z");
	ruler_v.attr({stroke: "#aaa", 'stroke-width': 1});
	ruler_v = canvas.path("M " + ((screen_width / 2) - (floor_size / 2) - 10) + " " + ((screen_height / 2) - (floor_size / 2)) + " l -10 0 z");
	ruler_v.attr({stroke: "#aaa", 'stroke-width': 1});
	
	ruler_v = canvas.text(((screen_width / 2) - (floor_size / 2) - 30),((screen_height / 2)), "16 ft" );
	ruler_v.attr({fill: "#aaa"});
	ruler_v.transform("R270");
	
	for (x = (screen_width / 2) - (floor_size / 2); x < (floor_size / 2) + (screen_width / 2) + 1; x += 25) {
			var vpath = "M " + (x - 1) + " " + ((screen_height / 2) - (floor_size / 2) - 1) +	" l 0 " + floor_size + " z";
		var vline = canvas.path(vpath);
		vline.attr({stroke: "#aaa", 'stroke-width': 1});
	}
	for (y = (screen_height / 2) - (floor_size / 2); y < (floor_size / 2) + (screen_height / 2) + 1; y += 25) {
			var hpath = "M " + ((screen_width / 2) - (floor_size / 2) - 1) + " " + (y - 1) + " l " + floor_size + " 0 z";
			var hline = canvas.path(hpath);
		hline.attr({stroke: "#aaa", 'stroke-width': 1});
	}
}

 $(window).load(function() {
			render();
 });

function screenshot() {
	"use strict";
	return renderer.domElement.toDataURL("image/jpeg");
}



function render() {
	"use strict";
	renderer.render( scene, camera );
}



/* #####################################################################
FUNCTION: buildShape 
#####################################################################
VARIABLES: shape, rise, run, width, x, y, base_height, railHeight
			points (rail profile), useBothRails, useRightRail
RETURN THREE.Mesh
#####################################################################
This function builds a mesh for a given predefined shape. Currently
supports the drawing of stairs procedurally. Most of the heavy
lifting is done here.
####################################################################*/
function buildShape(shape, height, width, depth, x, y, base_height, name, type, drawer, rotation, material) {
	"use strict";
	var extrusionSettings;
	var geom;
	var mesh;
	var door;
	var Object = new THREE.Object3D();
	Object.position.x = x;
	Object.position.z = y;

/* Door rules:
	* Flat or raised panel
	* Single door up to 21" width, double door for 24" and up
 Drawer rules:
	* Single drawer up to 30", double for 33" and up (90% of the time)
	* 9" cabinets almost never have drawers, so we will default to a full door for all of them.

	ACCESSORIES
	Refrigerator, stove, dishwasher, rangehood
	*/
	if ( shape === 'refrigerator' ) {
		if ( type === 'topmount' ) {
			/* Possible dimensions:
			23"-36" W
			65"-69" H
			24"-33" D*/
			mesh = makeBaseCab(height, width, depth, base_height, material);
			Object.add(mesh);
			door = addDoorsAndDrawers(height, width, depth, base_height, material, 1,0, 'slab', 'refrigerator');
			Object.add(door);
		} else { /* Side-by-side */
			/* Possible dimensions:
			30"-36" W
			67"-70" H
			29"-35" D*/
			mesh = makeBaseCab(height, width, depth, base_height, material);
			Object.add(mesh);
			door = addDoorsAndDrawers(height, width, depth, base_height, material, 2,0, 'slab', 'refrigerator');
			Object.add(door);
		}
		
	}
	
	if ( shape === 'filler' ) {
		material = base_material;
		mesh = MakeFiller(height, width, depth, material, base_height);
		Object.add(mesh);
	}	
	if ( shape === 'basecabinet' ) {
		material = base_material;
		mesh = makeBaseCab(height, width, depth, base_height, material);
		Object.add(mesh);
		/*/ Make doors/drawers*/
		if (height < inchesToScreen(35)) {
			/*/ Single door vertical*/
			if (width < inchesToScreen(12)) {
				/*/ Full height door*/
				door = addDoorsAndDrawers(height, width, depth, base_height, material, 1,0, type, 'base', drawer);
				Object.add(door);
			} else {
				if (width < inchesToScreen(24)) {
					/*/ Single door with drawer*/
					door = addDoorsAndDrawers(height, width, depth, base_height, material, 1,1, type, 'base', drawer);
					Object.add(door);
				} else {
					/*/ Double doors*/
					if (width < inchesToScreen(33)) {
						/*/Single drawer*/
						door = addDoorsAndDrawers(height, width, depth, base_height, material, 2,1, type, 'base', drawer);
						Object.add(door);
					} else {
						if (width < inchesToScreen(60)) {
							door = addDoorsAndDrawers(height, width, depth, base_height, material, 2,2, type, 'base', drawer);
							Object.add(door);
						} else {
							door = addDoorsAndDrawers(height, width, depth, base_height, material, 4,2, type, 'base', drawer);
							Object.add(door);
						}
					}
				}
			}
		}
	}
	if ( shape === 'wallcabinet' ) {
		material = base_material;
		mesh = makeWallCab(height, width, depth, base_height, material);
		Object.add(mesh);
		/*/ Make doors/drawers*/
		if (width < inchesToScreen(24)) {
			/*/ Full height door*/
			/*/ Single door vertical*/
			door = addDoorsAndDrawers(height, width, depth, base_height, material, 1,0, type, 'wall', drawer);
			Object.add(door);
		} else {
			/*/ Double door vertical*/
			door = addDoorsAndDrawers(height, width, depth, base_height, material, 2,0, type, 'wall', drawer);
			Object.add(door);
		}
		Object.add(makeCrown( [[0, 0],[0, depth],[width, depth],[width, 0]].reverse(), 0, 0, height + base_height, material, true ));
	}
	if ( shape === 'winerack' || shape === 'winerackvertical' ) {
		material = base_material;
		mesh = makeWallCab(height, width, depth, base_height, material);
		Object.add(mesh);
		
		mesh = addRack(height, width, depth, base_height, material, 'diagonal');
		Object.add(mesh);
	}
	
	if ( shape === 'platerack' ) {
		material = base_material;
		mesh = makeWallCab(height, width, depth, base_height, material);
		Object.add(mesh);
		mesh = addRack(height, width, depth, base_height, material, 'straight');
		Object.add(mesh);
		
	}
	
	if ( shape === 'microwaveshelf' ) {
		material = base_material;
		mesh = makeMicrowaveShelf(height, width, depth, base_height, material);
		Object.add(mesh);	
	}
	if ( shape === 'pantrycabinet' ) {
		material = base_material;
		mesh = makeBaseCab(height, width, depth, base_height, material);
		Object.add(mesh);
		/*/ Make doors/drawers*/
		if (width < inchesToScreen(24)) {
			/*/ Full height door*/
			/*/ Single door vertical*/
			door = addDoorsAndDrawers(height, width, depth, base_height, material, 1,0, type, 'pantry');
			Object.add(door);
		} else {
			/*/ Double door vertical*/
			door = addDoorsAndDrawers(height, width, depth, base_height, material, 2,0, type, 'pantry');
			Object.add(door);
		}
		Object.add(makeCrown( [[0, 0],[0, depth],[width, depth],[width, 0]].reverse(), 0, 0, height + base_height, material, true ));
	}
	if ( shape === 'basemicrowave' ) {
		material = base_material;
		mesh = makeBaseCab(height, width, depth, base_height, material);
		mesh = cutMicrowaveBaseHole(mesh, height, width, depth, material);
		Object.add(mesh);
		door = addDoorsAndDrawers(height, width, depth, base_height, material, 0,1, type, 'microwave');
		Object.add(door);	
	}
	if ( shape === 'wallmicrowave' ) {
		material = base_material;
		mesh = makeWallCab(height, width, depth, base_height, material);
		Object.add(mesh);
		door = addDoorsAndDrawers(height, width, depth, base_height, material, 2,0, type, 'microwave');
		Object.add(door);	
		Object.add(makeCrown( [[0, 0],[0, depth],[width, depth],[width, 0]].reverse(), 0, 0, height + base_height, material, true ));
	}
	if ( shape === 'ovencabinet' ) {
		material = base_material;
		mesh = makeBaseCab(height, width, depth, base_height, material);
		mesh = cutOvenHole(mesh, height, width, depth, material);
		Object.add(mesh);
		
		/*/ Make doors/drawers*/
		door = addDoorsAndDrawers(height, width, depth, base_height, material, 2,3, type, 'oven');
		Object.add(door);
		Object.add(makeCrown( [[0, 0],[0, depth],[width, depth],[width, 0]].reverse(), 0, 0, height + base_height, material, true ));
	}
	if ( shape === 'drawerbasecabinet' ) {
		material = base_material;
		mesh = makeBaseCab(height, width, depth, base_height, material);
		Object.add(mesh);
		
		/*/ Make doors/drawers*/
		door = addDoorsAndDrawers(height, width, depth, base_height, material, 0,3, type, 'base', drawer);
		Object.add(door);
	}
	if ( shape === 'baseendshelf' ) {
		material = base_material;
		mesh = makeBaseShelf(height, width, depth, base_height, material);
		Object.add(mesh);
	}
	if (shape === 'valance') {
		material = base_material;
		mesh = makeValance( type, name, width, height, base_height, material );
		Object.add(mesh);
	}
	if ( shape === 'wallshelf' ) {
		material = base_material;
		mesh = makeWallShelf(height, width, depth, base_height, material);
		Object.add(mesh);
	}
	if ( shape === 'wallshelfflip' ) {
		material = base_material;
		mesh = makeWallShelf(height, width, depth, base_height, material, true);
		Object.add(mesh);
	}
	if ( shape === 'baseendshelfflip' ) {
		material = base_material;
		mesh = makeBaseShelf(height, width, depth, base_height, material, true);
		Object.add(mesh);
	}
	if ( shape === 'diagcornerbasecabinet' ) {
		material = base_material;
		mesh = makeDiagBaseCab(height, width, depth, base_height, material);
		mesh = cutDiagFooter(mesh, height, width, depth, material);
		Object.add(mesh);
		
		/*/ Make doors/drawers*/
		door = addDoorsAndDrawers(height, width, depth, base_height, material, 1,1, type, 'diag', drawer);
		Object.add(door);
	}
	if ( shape === 'diagcornerwallcabinet' ) {
		material = base_material;
		mesh = makeDiagWallCab(height, width, depth, base_height, material);
		Object.add(mesh);
		
		/*/ Make doors/drawers*/
		door = addDoorsAndDrawers(height, width, depth, base_height, material, 1,1, type, 'diagwall', drawer);
		Object.add(door);
		Object.add(makeCrown( [[0, 0],[0, depth / 2],[width / 2, depth], [width, depth]].reverse(), -1.25, 0, height + base_height, material, true ));
		
	}
	if ( shape === 'easyreachcornerbasecabinet' ) {
		material = base_material;
		mesh = makeEasyReachBaseCab(height, width, depth, base_height, material);
		mesh = cutDiagFooter(mesh, height, width, depth, material);
		Object.add(mesh);
		
		/*/ Make doors/drawers*/
		door = addDoorsAndDrawers(height, width, depth, base_height, material, 2,0, type, 'easyreach', drawer);
		Object.add(door);
	}
	if ( shape === 'leftbaseblindcornercabinet' ) {
		material = base_material;
		mesh = makeBaseCab(height, width, depth, base_height, material);
		Object.add(mesh);
		
		/*/ Make doors/drawers*/
		door = addDoorsAndDrawers(height, width, depth, base_height, material, 2,2, type, 'blindleft', drawer);
		Object.add(door);
	}	
	if ( shape === 'rightbaseblindcornercabinet' ) {
		material = base_material;
		mesh = makeBaseCab(height, width, depth, base_height, material);
		Object.add(mesh);
		
		/*/ Make doors/drawers*/
		door = addDoorsAndDrawers(height, width, depth, base_height, material, 2,2, type, 'blindright', drawer);
		Object.add(door);
	}	
	if ( shape === 'leftwallblindcornercabinet' ) {
		material = base_material;
		mesh = makeWallCab(height, width, depth, base_height, material);
		Object.add(mesh);
		/* TODO: Fill in holes where doors are missing... */
		/*/ Make doors/drawers*/
		door = addDoorsAndDrawers(height, width, depth, base_height, material, 2,0, type, 'blindleft', drawer);
		Object.add(door);
		Object.add(makeCrown( [[0, 0],[0, depth],[width, depth],[width, 0]].reverse(), 0, 0, height + base_height, material, true ));
	}	
	if ( shape === 'rightwallblindcornercabinet' ) {
		material = base_material;
		mesh = makeWallCab(height, width, depth, base_height, material);
		Object.add(mesh);
		
		/*/ Make doors/drawers*/
		door = addDoorsAndDrawers(height, width, depth, base_height, material, 2,0, type, 'blindright', drawer);
		Object.add(door);
		Object.add(makeCrown( [[0, 0],[0, depth],[width, depth],[width, 0]].reverse(), 0, 0, height + base_height, material, true ));
	}	
	if ( shape === 'sinkbasecabinet' ){
		material = base_material;
		mesh = makeBaseCab(height, width, depth, base_height, material);
		mesh = addSink(mesh, height, width, depth, material);
		Object.add(mesh);
		
		if (width < inchesToScreen(60)) {
			door = addDoorsAndDrawers(height, width, depth, base_height, material, 2,2, type, 'sinkbase', drawer);
			Object.add(door);
		} else {
			door = addDoorsAndDrawers(height, width, depth, base_height, material, 4,2, type, 'sinkbase', drawer);
			Object.add(door);
		}
	}
	if ( shape === 'cornerendbasecabinet' ){
		material = base_material;
		mesh = makeBaseEndCab(height, width, depth, base_height, material);
		Object.add(mesh);
		door = addDoorsAndDrawers(height, width, depth, base_height, material, 2,0, type, 'end', drawer);
		Object.add(door);
	}

	Object.castShadow = true;
	Object.receiveShadow = true;
	Object.name = name;
	Object.rotation.y = degreesToRadians(rotation);

	return (Object);


}

/*/ Get "X" location for given angle on a parametric curve*/
function getArcX( degrees, radius, originx ) {
	var a = degreesToRadians( degrees );
	var x = originx + radius * Math.cos(a);
	return x;
}
/*/ Get "Y" location for given angle on a parametric curve*/
function getArcY( degrees, radius, originy ) {
	var a = degreesToRadians( degrees );
	var y = originy + radius * Math.sin(a);
	return y;
}

function getSineY( x ) {
	var y = Math.sin(x / 4);
	return y;
}

function makeMicrowaveShelf(height, width, depth, base_height, material) {


	var Points = [];				
					Points.push( new THREE.Vector2 ( 0, height) );
					Points.push( new THREE.Vector2 ( 0, 0 ) );
					Points.push( new THREE.Vector2 ( depth , 0 ) );
					Points.push( new THREE.Vector2 ( depth , (height * 2) / 3 ) );
					Points.push( new THREE.Vector2 ( getArcX(105,inchesToScreen(6),depth),	getArcY(105,inchesToScreen(6), height) ));
					Points.push( new THREE.Vector2 ( getArcX(120,inchesToScreen(6),depth),	getArcY(120,inchesToScreen(6), height) ));
					Points.push( new THREE.Vector2 ( getArcX(135,inchesToScreen(6),depth),	getArcY(135,inchesToScreen(6), height) ));
					Points.push( new THREE.Vector2 ( getArcX(150,inchesToScreen(6),depth),	getArcY(150,inchesToScreen(6), height) ));
					Points.push( new THREE.Vector2 ( getArcX(165,inchesToScreen(6),depth),	getArcY(165,inchesToScreen(6), height) ));
					Points.push( new THREE.Vector2 ( (depth * 2) / 3, height ) );
	var Shape = new THREE.Shape( Points );
	extrusionSettings = {
		bevelThickness: 1, bevelSize: 2, bevelEnabled: false,
		material: 0, extrudeMaterial: 1,
		amount: width
	};	
	geom = new THREE.ExtrudeGeometry( Shape, extrusionSettings );
	geom.computeFaceNormals();
	geom.center();
	
	extrusionSettings = {
		bevelThickness: 1, bevelSize: 2, bevelEnabled: false,
		material: 0, extrudeMaterial: 1,
		amount: width
	};	
	geom = new THREE.ExtrudeGeometry( Shape, extrusionSettings );
	geom.computeFaceNormals();
	geom.center();
	
	mesh = new THREE.Mesh( geom, material );
	mesh.geometry.applyMatrix( new THREE.Matrix4().makeRotationY( degreesToRadians(90) ) );
	mesh.position.y = (height / 2) + base_height;
	mesh.castShadow = true;
	mesh.receiveShadow = true;
	mesh.name = "cabinet";
	
	
	var cab_bsp = new ThreeBSP( mesh );
	var cutWidth = width - inchesToScreen(2);
	var cutDepth = height - inchesToScreen(2);
	var cutBox;
	Points = [];
		Points.push( new THREE.Vector2 ( 0, cutWidth ) );
		Points.push( new THREE.Vector2 ( 0, 0 ) );
		Points.push( new THREE.Vector2 ( cutDepth, 0 ) );
		Points.push( new THREE.Vector2 ( cutDepth, cutWidth ) );
	Shape = new THREE.Shape( Points );

	extrusionSettings = {
		bevelThickness: 1, bevelSize: 2, bevelEnabled: false,
		material: 0, extrudeMaterial: 1,
		amount: depth
	};	

	geom = new THREE.ExtrudeGeometry( Shape, extrusionSettings );
	geom.center();
		
	cutBox = new THREE.Mesh( geom, material );
	cutBox.position.x = 0;
	cutBox.position.y = height / 2	+ base_height;
	cutBox.position.z = inchesToScreen(2);
	cutBox.rotation.z = degreesToRadians(90);
			
	var sink_bsp = new ThreeBSP( cutBox );
				
	var subtract_bsp = cab_bsp.subtract( sink_bsp );
	var result = subtract_bsp.toMesh( material );
	result.castShadow = true;
	result.receiveShadow = true;
			
	return result;
}

function cutRackHole(mesh, x, y, height, width, material) {
	var cab_bsp = new ThreeBSP( mesh );
	var cutBox;
	var i, c;
	var _g;
	var geom;
	geom = new THREE.BoxGeometry( 0.1, 0.1, 0.1 );
	
	for (i = 0; i < width + inchesToScreen(4); i += inchesToScreen(5) ) {
		for ( c = 0; c < height; c += inchesToScreen(5) ) {
			var Points = [];
				Points.push( new THREE.Vector2 ( i + inchesToScreen(2), c ) );
				Points.push( new THREE.Vector2 ( i + inchesToScreen(4), c + inchesToScreen(2) ) );
				Points.push( new THREE.Vector2 ( i + inchesToScreen(2), c + inchesToScreen(4) ) );
				Points.push( new THREE.Vector2 ( i , c + inchesToScreen(2) ) );
			var Shape = new THREE.Shape( Points );

			extrusionSettings = {
				bevelThickness: 1, bevelSize: 2, bevelEnabled: false,
				material: 0, extrudeMaterial: 1,
				amount: inchesToScreen(0.77)
			};	

			_g = new THREE.ExtrudeGeometry( Shape, extrusionSettings );
			
			geom.merge(_g);
			
			Points = [];
				Points.push( new THREE.Vector2 ( i + inchesToScreen(4.5), c + inchesToScreen(2.5) ) );
				Points.push( new THREE.Vector2 ( i + inchesToScreen(6.5), c + inchesToScreen(4.5) ) );
				Points.push( new THREE.Vector2 ( i + inchesToScreen(4.5), c + inchesToScreen(6.5) ) );
				Points.push( new THREE.Vector2 ( i + inchesToScreen(2.5), c + inchesToScreen(4.5) ) );
			Shape = new THREE.Shape( Points );

			extrusionSettings = {
				bevelThickness: 1, bevelSize: 2, bevelEnabled: false,
				material: 0, extrudeMaterial: 1,
				amount: inchesToScreen(0.75)
			};	

			_g = new THREE.ExtrudeGeometry( Shape, extrusionSettings );
			
			geom.merge(_g);
		}
	}	
	
	geom.center();
		
	cutBox = new THREE.Mesh( geom, material );
	cutBox.position.x = x - (width / 2);
	cutBox.position.y = y - (height / 2);
	var sink_bsp = new ThreeBSP( cutBox );
				
	var subtract_bsp = cab_bsp.subtract( sink_bsp );
	var result = subtract_bsp.toMesh( material );
	result.castShadow = true;
	result.receiveShadow = true;
			
	return result;
}

function addRack(height, width, depth, base_height, material, type) {
	var rack = new THREE.Object3D();
	var Points = [];
	var Shape;
	if (type === 'diagonal') {
			/* ((a < b) ? 2 : 3); */
				Points.push( new THREE.Vector2 (	width, 0 ) );
				Points.push( new THREE.Vector2 ( 0, 0 ) );
				Points.push( new THREE.Vector2 ( 0,	height ) );
				Points.push( new THREE.Vector2 (	width,	height ) );
		Shape = new THREE.Shape( Points );
		
		var i, c;
		
		extrusionSettings = {
			bevelThickness: 1, bevelSize: 2, bevelEnabled: false,
			material: 0, extrudeMaterial: 1,
			amount: inchesToScreen(0.75)
		};	
		var geom = new THREE.ExtrudeGeometry( Shape, extrusionSettings );
		geom.computeFaceNormals();
		geom.center();
		mesh = new THREE.Mesh( geom , material );
		/* TODO: Want to change this to merge geometry before cut */
		/* Because of triangulation bugs with threejs' handling of holes have to use CSG to make the latticed rack - not ideal because of speed, but this item is less common anyway */
		/* for (i = 0; i < width + inchesToScreen(4); i += inchesToScreen(5) ) {
			for ( c = 0; c < height; c += inchesToScreen(5) ) {
				mesh = cutRackHole(mesh, i, c, height, width, material);
				mesh = cutRackHole(mesh, i + inchesToScreen(2.5), c + inchesToScreen(2.5), height, width, material);
			}
		} */
	
		mesh = cutRackHole(mesh, i, c, height, width, material);
		
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		mesh.position.x = 0;
		mesh.position.y = (height / 2) + base_height;
		mesh.position.z = (depth / 2) + inchesToScreen(-0.75);
		rack.add(mesh);

	} else {
			Points.push( new THREE.Vector2 ( inchesToScreen(1), 0 ) );
			Points.push( new THREE.Vector2 ( 0, 0 ) );
			Points.push( new THREE.Vector2 ( 0,	height - inchesToScreen(1) ) );
			Points.push( new THREE.Vector2 ( inchesToScreen(1),	height - inchesToScreen(1) ) );
			Shape = new THREE.Shape( Points );
					
			extrusionSettings = {
				bevelThickness: 1, bevelSize: 2, bevelEnabled: false,
				material: 0, extrudeMaterial: 1,
				amount: inchesToScreen(0.75)
			};	
		
		for ( var j = inchesToScreen(3); j < width; j += inchesToScreen(3) ) {
			var geom = new THREE.ExtrudeGeometry( Shape, extrusionSettings );
			geom.computeFaceNormals();
			geom.center();
			mesh = new THREE.Mesh( geom , material );
			mesh.position.x = j - (width / 2);
			mesh.position.y = (height / 2) + base_height;
			mesh.position.z = (depth / 2) + inchesToScreen(-1.5);
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			rack.add(mesh);
		}
	}
	return rack;
}

function makeValance( cab_type, type, length, height, base_height, material ) {
	var mesh;
	
	if (type.indexOf('8.VAS') !== -1) {
		var Points = [];				
				Points.push( new THREE.Vector2 ( length, height) );
				Points.push( new THREE.Vector2 ( length, 0) );
				for (i = length; i > 0; i-= 0.1) {
					Points.push( new THREE.Vector2( i, getSineY( i )) );
				}
				Points.push( new THREE.Vector2 ( 0 , 0) );
				Points.push( new THREE.Vector2 ( 0, height ) );
				
		var Shape = new THREE.Shape( Points );
		extrusionSettings = {
			bevelThickness: 1, bevelSize: 2, bevelEnabled: false,
			material: 0, extrudeMaterial: 1,
			amount: inchesToScreen(0.75)
		};	
		var geom = new THREE.ExtrudeGeometry( Shape, extrusionSettings );
		geom.computeFaceNormals();
		geom.center();
		mesh = new THREE.Mesh( geom , material );
	}
	else if (type.indexOf('8.VAL') !== -1 || type.indexOf('8.VARP') !== -1) {
		var Points = [];				
				Points.push( new THREE.Vector2 ( length, height) );
				Points.push( new THREE.Vector2 ( length, 0) );
				/* Points.push( new THREE.Vector2 ( length - height, 0) ); */
				Points.push( new THREE.Vector2 ( getArcX(0,	height/2, ((length - (height * 2)) * 1.00) + height), getArcY(	0, height/2, 0)) );
				Points.push( new THREE.Vector2 ( getArcX(-15,	height/2, ((length - (height * 2)) * 0.92) + height), getArcY(-15, height/2, 0)) );
				Points.push( new THREE.Vector2 ( getArcX(-30,	height/2, ((length - (height * 2)) * 0.84) + height), getArcY(-30, height/2, 0)) );
				Points.push( new THREE.Vector2 ( getArcX(-45,	height/2, ((length - (height * 2)) * 0.76) + height), getArcY(-45, height/2, 0)) );
				Points.push( new THREE.Vector2 ( getArcX(-60,	height/2, ((length - (height * 2)) * 0.68) + height), getArcY(-60, height/2, 0)) );
				Points.push( new THREE.Vector2 ( getArcX(-75,	height/2, ((length - (height * 2)) * 0.60) + height), getArcY(-75, height/2, 0)) );
				Points.push( new THREE.Vector2 ( getArcX(-90,	height/2, ((length - (height * 2)) * 0.50) + height), getArcY(-90, height/2, 0)) );
				Points.push( new THREE.Vector2 ( getArcX(-105, height/2, ((length - (height * 2)) * 0.42) + height), getArcY(-105, height/2, 0)) );
				Points.push( new THREE.Vector2 ( getArcX(-120, height/2, ((length - (height * 2)) * 0.37) + height), getArcY(-120, height/2, 0)) );
				Points.push( new THREE.Vector2 ( getArcX(-135, height/2, ((length - (height * 2)) * 0.28) + height), getArcY(-135, height/2, 0)) );
				Points.push( new THREE.Vector2 ( getArcX(-150, height/2, ((length - (height * 2)) * 0.20) + height), getArcY(-150, height/2, 0)) );
				Points.push( new THREE.Vector2 ( getArcX(-165, height/2, ((length - (height * 2)) * 0.12) + height), getArcY(-165, height/2, 0)) );
				Points.push( new THREE.Vector2 ( getArcX(-179, height/2, ((length - (height * 2)) * 0.00) + height), getArcY(-179, height/2, 0)) );
				/* Points.push( new THREE.Vector2 ( height, 0) ); */
				Points.push( new THREE.Vector2 ( 0 , 0) );
				Points.push( new THREE.Vector2 ( 0, height ) );
			var Shape = new THREE.Shape( Points );
			extrusionSettings = {
				bevelThickness: 1, bevelSize: 2, bevelEnabled: false,
				material: 0, extrudeMaterial: 1,
				amount: inchesToScreen(0.75)
			};	
			var geom = new THREE.ExtrudeGeometry( Shape, extrusionSettings );
			geom.computeFaceNormals();
			geom.center();
			mesh = new THREE.Mesh( geom , material );	
	}
	else {
		if (cab_type === 'slab') {
			var Points = [];				
				Points.push( new THREE.Vector2 ( length, height) );
				Points.push( new THREE.Vector2 ( length, 0) );
				Points.push( new THREE.Vector2 ( 0 , 0) );
				Points.push( new THREE.Vector2 ( 0, height ) );
			var Shape = new THREE.Shape( Points );
			extrusionSettings = {
				bevelThickness: 1, bevelSize: 2, bevelEnabled: false,
				material: 0, extrudeMaterial: 1,
				amount: inchesToScreen(0.75)
			};	
			var geom = new THREE.ExtrudeGeometry( Shape, extrusionSettings );
			geom.computeFaceNormals();
			geom.center();
			mesh = new THREE.Mesh( geom , material );			
		} else {
			var Points = [];				
				Points.push( new THREE.Vector2 ( length, height) );
				Points.push( new THREE.Vector2 ( length, 0) );
				Points.push( new THREE.Vector2 ( length - height, 0) );
				Points.push( new THREE.Vector2 ( getArcX(-15, height/2, length - (height * 1.5)), getArcY(-15, height/2, 0)) );
				Points.push( new THREE.Vector2 ( getArcX(-30, height/2, length - (height * 1.5)), getArcY(-30, height/2, 0)) );
				Points.push( new THREE.Vector2 ( getArcX(-45, height/2, length - (height * 1.5)), getArcY(-45, height/2, 0)) );
				Points.push( new THREE.Vector2 ( getArcX(-60, height/2, length - (height * 1.5)), getArcY(-60, height/2, 0)) );
				Points.push( new THREE.Vector2 ( getArcX(-75, height/2, length - (height * 1.5)), getArcY(-75, height/2, 0)) );
				Points.push( new THREE.Vector2 ( getArcX(-90, height/2, length - (height * 1.5)), getArcY(-90, height/2, 0)) );
				Points.push( new THREE.Vector2 ( getArcX(-105, height/2, (height * 1.5)), getArcY(-105, height/2, 0)) );
				Points.push( new THREE.Vector2 ( getArcX(-120, height/2, (height * 1.5)), getArcY(-120, height/2, 0)) );
				Points.push( new THREE.Vector2 ( getArcX(-135, height/2, (height * 1.5)), getArcY(-135, height/2, 0)) );
				Points.push( new THREE.Vector2 ( getArcX(-150, height/2, (height * 1.5)), getArcY(-150, height/2, 0)) );
				Points.push( new THREE.Vector2 ( getArcX(-165, height/2, (height * 1.5)), getArcY(-165, height/2, 0)) );
				Points.push( new THREE.Vector2 ( getArcX(-179, height/2, (height * 1.5)), getArcY(-179, height/2, 0)) );
				Points.push( new THREE.Vector2 ( height, 0) );
				Points.push( new THREE.Vector2 ( 0 , 0) );
				Points.push( new THREE.Vector2 ( 0, height ) );
			var Shape = new THREE.Shape( Points );
			extrusionSettings = {
				bevelThickness: 1, bevelSize: 2, bevelEnabled: false,
				material: 0, extrudeMaterial: 1,
				amount: inchesToScreen(0.75)
			};	
			var geom = new THREE.ExtrudeGeometry( Shape, extrusionSettings );
			geom.computeFaceNormals();
			geom.center();
			mesh = new THREE.Mesh( geom , material );	
		}	
	}
	
	mesh.position.y = (height / 2) + base_height;
	mesh.position.z = inchesToScreen(-0.375);
	mesh.castShadow = true;
	mesh.receiveShadow = true;
	
	return mesh;
}

function makeBaseShelf(height, width, depth, base_height, material, reverse) {
	var shelf = new THREE.Object3D();
	var Points = [];				
					Points.push( new THREE.Vector2 ( 0, width) );
					Points.push( new THREE.Vector2 ( 0, 0 ) );
					Points.push( new THREE.Vector2 ( depth / 2, 0 ) );
					Points.push( new THREE.Vector2 ( getArcX(75, depth / 2, depth / 2 ), getArcY(75, depth / 2, depth / 2 ) ) );
					Points.push( new THREE.Vector2 ( getArcX(60, depth / 2, depth / 2 ), getArcY(60, depth / 2, depth / 2 ) ) );
					Points.push( new THREE.Vector2 ( getArcX(45, depth / 2, depth / 2 ), getArcY(45, depth / 2, depth / 2 ) ) );
					Points.push( new THREE.Vector2 ( getArcX(30, depth / 2, depth / 2 ), getArcY(30, depth / 2, depth / 2 ) ) );
					Points.push( new THREE.Vector2 ( getArcX(15, depth / 2, depth / 2 ), getArcY(15, depth / 2, depth / 2 ) ) );
					/* Points.push( new THREE.Vector2 ( depth, width / 4 ) ); */
					Points.push( new THREE.Vector2 ( depth, width ) );
					
		var Shape = new THREE.Shape( Points );
						
		extrusionSettings = {bevelEnabled: false,material: 1, extrudeMaterial: 1,amount: inchesToScreen(0.75)};	
		geom = new THREE.ExtrudeGeometry( Shape, extrusionSettings );
		geom.computeFaceNormals();
		geom.center();
		
		mesh = new THREE.Mesh( geom, material );
		mesh.geometry.applyMatrix( new THREE.Matrix4().makeRotationX( degreesToRadians(90) ) );
		if (reverse) {
			mesh.geometry.applyMatrix( new THREE.Matrix4().makeRotationY( degreesToRadians(-90) ) );
			mesh.geometry.applyMatrix( new THREE.Matrix4().makeRotationX( degreesToRadians(180) ) );
		} else {
			mesh.geometry.applyMatrix( new THREE.Matrix4().makeRotationY( degreesToRadians(90) ) );
		}
		mesh.position.y = (height) + base_height - inchesToScreen(0.375);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		mesh.name = "shelf";

		shelf.add(mesh);
		
		mesh = new THREE.Mesh( geom, material );
		mesh.geometry.applyMatrix( new THREE.Matrix4().makeRotationX( degreesToRadians(90) ) );
		mesh.geometry.applyMatrix( new THREE.Matrix4().makeRotationY( degreesToRadians(90) ) );
		mesh.position.y = ((height - inchesToScreen(4)) / 3) + base_height + inchesToScreen(4);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		mesh.name = "shelf";

		shelf.add(mesh);
		
		mesh = new THREE.Mesh( geom, material );
		mesh.geometry.applyMatrix( new THREE.Matrix4().makeRotationX( degreesToRadians(90) ) );
		mesh.geometry.applyMatrix( new THREE.Matrix4().makeRotationY( degreesToRadians(90) ) );
		mesh.position.y = ((height - inchesToScreen(4)) / 3) * 2 + base_height + inchesToScreen(4);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		mesh.name = "shelf";

		shelf.add(mesh);
		
		mesh = new THREE.Mesh( geom, material );
		mesh.geometry.applyMatrix( new THREE.Matrix4().makeRotationX( degreesToRadians(90) ) );
		mesh.geometry.applyMatrix( new THREE.Matrix4().makeRotationY( degreesToRadians(90) ) );
		mesh.position.y = inchesToScreen(4) + base_height;
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		mesh.name = "shelf";

		shelf.add(mesh);
		
		mesh = addBackPanel(height - inchesToScreen(4), width, depth, material);
		mesh.position.y = height / 2 + inchesToScreen(2) + base_height;
		shelf.add(mesh);
		
		/* End panel */
		mesh = addBackPanel(height - inchesToScreen(4), depth, depth, material);
		if (reverse) {
			mesh.position.x = -width / 2 + inchesToScreen(0.375);
		} else {
			mesh.position.x = width / 2 - inchesToScreen(0.375);
		}
		mesh.position.z = 0;
		mesh.position.y = height / 2 + inchesToScreen(2) + base_height;
		mesh.geometry.applyMatrix( new THREE.Matrix4().makeRotationY( degreesToRadians(90) ) );
		shelf.add(mesh);
		
		var foot = new THREE.BoxGeometry( width - inchesToScreen(3), inchesToScreen(4), depth - inchesToScreen(3));
		var footBox = new THREE.Mesh( foot , material );
		if (reverse) {
			footBox.position.z = -inchesToScreen(1.5);
			footBox.position.x = -inchesToScreen(1.5);
			footBox.position.y = inchesToScreen(2);

		} else {
			footBox.position.z = -inchesToScreen(1.5);
			footBox.position.x = inchesToScreen(1.5);
			footBox.position.y = inchesToScreen(2);
		}
		shelf.add(footBox);
		
		return shelf;
}

function makeWallShelf(height, width, depth, base_height, material, reverse) {
	var shelf = new THREE.Object3D();
	var Points = [];				
					Points.push( new THREE.Vector2 ( 0, width) );
					Points.push( new THREE.Vector2 ( 0, 0 ) );
					Points.push( new THREE.Vector2 ( depth / 2, 0 ) );
					Points.push( new THREE.Vector2 ( getArcX(75, depth / 2, depth / 2 ), getArcY(75, depth / 2, depth / 2 ) ) );
					Points.push( new THREE.Vector2 ( getArcX(60, depth / 2, depth / 2 ), getArcY(60, depth / 2, depth / 2 ) ) );
					Points.push( new THREE.Vector2 ( getArcX(45, depth / 2, depth / 2 ), getArcY(45, depth / 2, depth / 2 ) ) );
					Points.push( new THREE.Vector2 ( getArcX(30, depth / 2, depth / 2 ), getArcY(30, depth / 2, depth / 2 ) ) );
					Points.push( new THREE.Vector2 ( getArcX(15, depth / 2, depth / 2 ), getArcY(15, depth / 2, depth / 2 ) ) );
					/* Points.push( new THREE.Vector2 ( depth, width / 2 ) ); */
					Points.push( new THREE.Vector2 ( depth, width ) );
					
		var Shape = new THREE.Shape( Points );
						
		extrusionSettings = {bevelEnabled: false,material: 1, extrudeMaterial: 1,amount: inchesToScreen(0.75)};	
		geom = new THREE.ExtrudeGeometry( Shape, extrusionSettings );
		geom.computeFaceNormals();
		geom.center();
		
		mesh = new THREE.Mesh( geom, material );
		mesh.geometry.applyMatrix( new THREE.Matrix4().makeRotationX( degreesToRadians(90) ) );
		if (reverse) {
			mesh.geometry.applyMatrix( new THREE.Matrix4().makeRotationY( degreesToRadians(-90) ) );
			mesh.geometry.applyMatrix( new THREE.Matrix4().makeRotationX( degreesToRadians(180) ) );
		} else {
			mesh.geometry.applyMatrix( new THREE.Matrix4().makeRotationY( degreesToRadians(90) ) );
		}
		mesh.position.y = (height) + base_height - inchesToScreen(0.375);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		mesh.name = "shelf";

		shelf.add(mesh);
		
		mesh = new THREE.Mesh( geom, material );
		mesh.geometry.applyMatrix( new THREE.Matrix4().makeRotationX( degreesToRadians(90) ) );
		mesh.geometry.applyMatrix( new THREE.Matrix4().makeRotationY( degreesToRadians(90) ) );
		mesh.position.y = ((height) / 3) + base_height;
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		mesh.name = "shelf";

		shelf.add(mesh);
		
		mesh = new THREE.Mesh( geom, material );
		mesh.geometry.applyMatrix( new THREE.Matrix4().makeRotationX( degreesToRadians(90) ) );
		mesh.geometry.applyMatrix( new THREE.Matrix4().makeRotationY( degreesToRadians(90) ) );
		mesh.position.y = ((height) / 3) * 2 + base_height;
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		mesh.name = "shelf";

		shelf.add(mesh);
		
		mesh = new THREE.Mesh( geom, material );
		mesh.geometry.applyMatrix( new THREE.Matrix4().makeRotationX( degreesToRadians(90) ) );
		mesh.geometry.applyMatrix( new THREE.Matrix4().makeRotationY( degreesToRadians(90) ) );
		mesh.position.y = base_height + inchesToScreen(0.375);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		mesh.name = "shelf";

		shelf.add(mesh);
		
		mesh = addBackPanel(height, width, depth, material);
		mesh.position.y = height / 2	+ base_height;
		shelf.add(mesh);
		
		/* End panel */
		mesh = addBackPanel(height, depth, depth, material);
		if (reverse) {
			mesh.position.x = -width / 2 + inchesToScreen(0.375);
		} else {
			mesh.position.x = width / 2 - inchesToScreen(0.375);
		}
		mesh.position.z = 0;
		mesh.position.y = height / 2	+ base_height;
		mesh.geometry.applyMatrix( new THREE.Matrix4().makeRotationY( degreesToRadians(90) ) );
		shelf.add(mesh);
		
		return shelf;
}

function makeEasyReachBaseCab(height, width, depth, base_height, material) {
	var Points = [];				
					Points.push( new THREE.Vector2 ( depth, 0) );
					Points.push( new THREE.Vector2 ( depth, (width / 3) * 2) );
					Points.push( new THREE.Vector2 ( (depth / 3) * 2, width ) );
					Points.push( new THREE.Vector2 ( 0, width ) );
					Points.push( new THREE.Vector2 ( 0, (width / 3) ) );
					Points.push( new THREE.Vector2 ( (depth / 3), (width / 3) ) );
					Points.push( new THREE.Vector2 ( (depth / 3), 0 ) );
					
		var Shape = new THREE.Shape( Points );
		
		var closedSpline = new THREE.SplineCurve3( [
					new THREE.Vector3( 0, height,	0 ),
					new THREE.Vector3( 0,	0,	0 )
				] );
				
		extrusionSettings = {
			bevelThickness: 1, bevelSize: 2, bevelEnabled: false,
			material: 1, extrudeMaterial: 1,
			amount: height
		};	
		geom = new THREE.ExtrudeGeometry( Shape, extrusionSettings );
		geom.computeFaceNormals();
		geom.center();
		
		mesh = new THREE.Mesh( geom, material );
		mesh.geometry.applyMatrix( new THREE.Matrix4().makeRotationX( degreesToRadians(90) ) );
		mesh.position.y = (height / 2) + base_height;
		
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		mesh.name = "cabinet";

		return mesh;
}

function makeDiagWallCab(height, width, depth, base_height, material) {
	var Points = [];				
					Points.push( new THREE.Vector2 ( depth, 0) );
					Points.push( new THREE.Vector2 ( depth, (width / 3) * 2 ) );
					Points.push( new THREE.Vector2 ( (depth / 3) * 2, width ) );
					Points.push( new THREE.Vector2 ( 0, width ) );
					Points.push( new THREE.Vector2 ( 0, (width / 2) ) );
					Points.push( new THREE.Vector2 ( (depth / 2), 0 ) );
					
		var Shape = new THREE.Shape( Points );
		
		var closedSpline = new THREE.SplineCurve3( [
					new THREE.Vector3( 0, height,	0 ),
					new THREE.Vector3( 0,	0,	0 )
				] );
				
		extrusionSettings = {
			bevelThickness: 1, bevelSize: 2, bevelEnabled: false,
			material: 1, extrudeMaterial: 1,
			amount: height
		};	
		geom = new THREE.ExtrudeGeometry( Shape, extrusionSettings );
		geom.computeFaceNormals();
		geom.center();
		
		mesh = new THREE.Mesh( geom, material );
		mesh.geometry.applyMatrix( new THREE.Matrix4().makeRotationX( degreesToRadians(90) ) );
		mesh.position.y = (height / 2) + base_height;
		
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		mesh.name = "cabinet";

		var cab_bsp = new ThreeBSP( mesh );
	var cutWidth = width - inchesToScreen(2);
	var cutDepth = height - inchesToScreen(4);
	var cutBox;
	Points = [];
		Points.push( new THREE.Vector2 ( depth - inchesToScreen(1), inchesToScreen(1)) );
		Points.push( new THREE.Vector2 ( depth - inchesToScreen(1), (width / 3) * 2 - inchesToScreen(1) ) );
		Points.push( new THREE.Vector2 ( (depth / 3) * 2 - inchesToScreen(1), width - inchesToScreen(1) ) );
		Points.push( new THREE.Vector2 ( inchesToScreen(1), width - inchesToScreen(1) ) );
		Points.push( new THREE.Vector2 ( inchesToScreen(1), (width / 2) - inchesToScreen(1) ) );
		Points.push( new THREE.Vector2 ( (depth / 2) - inchesToScreen(1), inchesToScreen(1) ) );
	Shape = new THREE.Shape( Points );

	extrusionSettings = {
		bevelThickness: 1, bevelSize: 2, bevelEnabled: false,
		material: 0, extrudeMaterial: 1,
		amount: height - inchesToScreen(2)
	};	

	geom = new THREE.ExtrudeGeometry( Shape, extrusionSettings );
	geom.center();
		
	cutBox = new THREE.Mesh( geom, material );
	cutBox.position.x = 0;
	cutBox.position.y = height / 2	+ base_height;
	cutBox.position.z = 0;
	cutBox.rotation.x = degreesToRadians(90);
			
	var sink_bsp = new ThreeBSP( cutBox );
				
	var subtract_bsp = cab_bsp.subtract( sink_bsp );
	var result = subtract_bsp.toMesh( material );
	result.castShadow = true;
	result.receiveShadow = true;
	
	return result;
}

function makeDiagBaseCab(height, width, depth, base_height, material) {
	var Points = [];				
					Points.push( new THREE.Vector2 ( depth, 0) );
					Points.push( new THREE.Vector2 ( depth, (width / 3) * 2) );
					Points.push( new THREE.Vector2 ( (depth / 3) * 2, width ) );
					Points.push( new THREE.Vector2 ( 0, width ) );
					Points.push( new THREE.Vector2 ( 0, (width / 3) ) );
					Points.push( new THREE.Vector2 ( (depth / 3), 0 ) );
					
		var Shape = new THREE.Shape( Points );
		
		var closedSpline = new THREE.SplineCurve3( [
					new THREE.Vector3( 0, height,	0 ),
					new THREE.Vector3( 0,	0,	0 )
				] );
				
		extrusionSettings = {
			bevelThickness: 1, bevelSize: 2, bevelEnabled: false,
			material: 1, extrudeMaterial: 1,
			amount: height
		};	
		geom = new THREE.ExtrudeGeometry( Shape, extrusionSettings );
		geom.computeFaceNormals();
		geom.center();
		
		mesh = new THREE.Mesh( geom, material );
		mesh.geometry.applyMatrix( new THREE.Matrix4().makeRotationX( degreesToRadians(90) ) );
		mesh.position.y = (height / 2) + base_height;
		
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		mesh.name = "cabinet";
		
	
			
	return mesh;

}

function cutMicrowaveBaseHole(mesh, height, width, depth, material) {
	var cab_bsp = new ThreeBSP( mesh );
	var cutWidth = (height) - inchesToScreen(18);
	var cutDepth = (width) - inchesToScreen(3);
	var cutBox;
	var Points = [];
		Points.push( new THREE.Vector2 ( 0, cutWidth ) );
		Points.push( new THREE.Vector2 ( 0, 0 ) );
		Points.push( new THREE.Vector2 ( cutDepth, 0 ) );
		Points.push( new THREE.Vector2 ( cutDepth, cutWidth ) );
	var Shape = new THREE.Shape( Points );

	extrusionSettings = {
		bevelThickness: 1, bevelSize: 2, bevelEnabled: false,
		material: 0, extrudeMaterial: 1,
		amount: depth
	};	

	geom = new THREE.ExtrudeGeometry( Shape, extrusionSettings );
	geom.center();
		
	cutBox = new THREE.Mesh( geom, material );
	cutBox.position.y = (height / 2) + inchesToScreen(7.5);
	cutBox.position.z = inchesToScreen(2);
			
	var sink_bsp = new ThreeBSP( cutBox );
				
	var subtract_bsp = cab_bsp.subtract( sink_bsp );
	var result = subtract_bsp.toMesh( material );
	result.castShadow = true;
	result.receiveShadow = true;
			
	return result;
}

function cutOvenHole(mesh, height, width, depth, material) {
	var cab_bsp = new ThreeBSP( mesh );
	var cutWidth = (width) - inchesToScreen(4);
	var cutDepth = (height / 5) * 2 - inchesToScreen(4);
	var cutBox;
	var Points = [];
		Points.push( new THREE.Vector2 ( 0, cutDepth) );
		Points.push( new THREE.Vector2 ( 0, 0 ) );
		Points.push( new THREE.Vector2 ( cutWidth, 0 ) );
		Points.push( new THREE.Vector2 ( cutWidth, cutDepth ) );
	var Shape = new THREE.Shape( Points );

	extrusionSettings = {
		bevelThickness: 1, bevelSize: 2, bevelEnabled: false,
		material: 0, extrudeMaterial: 1,
		amount: depth
	};	

	geom = new THREE.ExtrudeGeometry( Shape, extrusionSettings );
	geom.center();
		
	cutBox = new THREE.Mesh( geom, material );
	cutBox.position.y = (height / 5) * 3;
	cutBox.position.z = inchesToScreen(4);
			
	var sink_bsp = new ThreeBSP( cutBox );
				
	var subtract_bsp = cab_bsp.subtract( sink_bsp );
	var result = subtract_bsp.toMesh( material );
	result.castShadow = true;
	result.receiveShadow = true;
			
	return result;
}

function cutDiagFooter(mesh, height, width, depth, material) {
	var cab_bsp = new ThreeBSP( mesh );
	var cutWidth = (width / 3) + inchesToScreen(6);
	var cutDepth = (depth / 3) + inchesToScreen(6);
	var cutBox;
	var Points = [];
		Points.push( new THREE.Vector2 ( 0, cutWidth ) );
		Points.push( new THREE.Vector2 ( 0, 0 ) );
		Points.push( new THREE.Vector2 ( cutDepth, 0 ) );
		Points.push( new THREE.Vector2 ( cutDepth, cutWidth ) );
	var Shape = new THREE.Shape( Points );

	extrusionSettings = {
		bevelThickness: 1, bevelSize: 2, bevelEnabled: false,
		material: 0, extrudeMaterial: 1,
		amount: inchesToScreen(4)
	};	

	geom = new THREE.ExtrudeGeometry( Shape, extrusionSettings );
	geom.center();
		
	cutBox = new THREE.Mesh( geom, material );
	cutBox.position.y = inchesToScreen(2);
	cutBox.position.x = -(width / 3);
	cutBox.position.z = (depth / 3);
	cutBox.rotation.x = degreesToRadians(90);
		
	var sink_bsp = new ThreeBSP( cutBox );
				
	var subtract_bsp = cab_bsp.subtract( sink_bsp );
	var result = subtract_bsp.toMesh( material );
	result.castShadow = true;
	result.receiveShadow = true;
			
	return result;
}

function MakeFiller(height, width, depth, material, base_height) {
	var Points = [];				
				Points.push( new THREE.Vector2 ( width, height) );
				Points.push( new THREE.Vector2 ( width, 0) );
				Points.push( new THREE.Vector2 ( 0 , 0) );
				Points.push( new THREE.Vector2 ( 0, height ) );
	var Shape = new THREE.Shape( Points );
	extrusionSettings = {
		bevelThickness: 1, bevelSize: 2, bevelEnabled: false,
		material: 0, extrudeMaterial: 1,
		amount: inchesToScreen(0.75)
	};	
	var geom = new THREE.ExtrudeGeometry( Shape, extrusionSettings );
	geom.computeFaceNormals();
	geom.center();
	var panelBox = new THREE.Mesh( geom , material );
	panelBox.position.y = (height / 2) + base_height;
	panelBox.castShadow = true;
	panelBox.receiveShadow = true;
	return panelBox;
}

function addBackPanel(height, width, depth, material) {
	var Points = [];				
				Points.push( new THREE.Vector2 ( width, height) );
				Points.push( new THREE.Vector2 ( width, 0) );
				Points.push( new THREE.Vector2 ( 0 , 0) );
				Points.push( new THREE.Vector2 ( 0, height ) );
	var Shape = new THREE.Shape( Points );
	extrusionSettings = {
		bevelThickness: 1, bevelSize: 2, bevelEnabled: false,
		material: 0, extrudeMaterial: 1,
		amount: inchesToScreen(0.75)
	};	
	var geom = new THREE.ExtrudeGeometry( Shape, extrusionSettings );
	geom.computeFaceNormals();
	geom.center();
	var panelBox = new THREE.Mesh( geom , material );
	panelBox.position.z = -(depth / 2) + inchesToScreen(0.375);
	panelBox.position.y = (height / 2) + inchesToScreen(2);
	panelBox.castShadow = true;
	return panelBox;
}

function addSink(mesh, height, width, depth, material) {
	var cab_bsp = new ThreeBSP( mesh );

	var sinkWidth;
	if ( (width / 2) < inchesToScreen(28) ) {
		sinkWidth = width - inchesToScreen(2);
		
	} else {
		sinkWidth = (width / 2);

	}
	
	var sinkBox;
	var Points = [];
		Points.push( new THREE.Vector2 ( 0, inchesToScreen(10) ) );
		Points.push( new THREE.Vector2 ( 0, 0 ) );
		Points.push( new THREE.Vector2 ( sinkWidth - inchesToScreen(2), 0 ) );
		Points.push( new THREE.Vector2 ( sinkWidth - inchesToScreen(2), inchesToScreen(10) ) );
		
		var Shape = new THREE.Shape( Points );

		extrusionSettings = {
			bevelThickness: 1, bevelSize: 2, bevelEnabled: true,
			material: 0, extrudeMaterial: 1,
			amount: depth - inchesToScreen(4)
		};	

		geom = new THREE.ExtrudeGeometry( Shape, extrusionSettings );
		geom.computeFaceNormals();
		geom.center();

		sinkBox = new THREE.Mesh( geom, material );
		sinkBox.position.y = height;
		
	
	
	var sink_bsp = new ThreeBSP( sinkBox );
				
	var subtract_bsp = cab_bsp.subtract( sink_bsp );
	var result = subtract_bsp.toMesh( material );
	result.castShadow = true;
	result.receiveShadow = true;
		
	return result;
}

function addDoorsAndDrawers(height, width, depth, base_height, material, numDoors, numDrawers, type, cab_type, drawer_type) {
	var Object = new THREE.Object3D();
	if (numDoors === 1 && numDrawers === 0) {
		if (cab_type === 'pantry') {
			cab_height = (height - inchesToScreen(4.5)) / 3 - 1;
			cab_pos = (cab_height / 2) +	base_height + inchesToScreen(4);
			var Points = [];
			Points.push( new THREE.Vector2 ( 0, cab_height ) );
			Points.push( new THREE.Vector2 ( 0, 0 ) );
			Points.push( new THREE.Vector2 ( width - inchesToScreen(1), 0 ) );
			Points.push( new THREE.Vector2 ( width - inchesToScreen(1), cab_height ) );
			var door = makeDoor(Points, material, type);
			door.position.z = (depth / 2) + inchesToScreen(0.375);
			door.position.y = cab_pos;
			Object.add(door);
			
			door = makeDoor(Points, material, type);
			door.position.z = (depth / 2) + inchesToScreen(0.375);
			door.position.y = cab_pos + cab_height;
			Object.add(door);
			
			door = makeDoor(Points, material, type);
			door.position.z = (depth / 2) + inchesToScreen(0.375);
			door.position.y = cab_pos + cab_height * 2 + 2;
			Object.add(door);			
		} 
		else if (cab_type === 'refrigerator') {
			cab_height = (height - inchesToScreen(4.5)) / 3 - 1;
			cab_pos = (cab_height / 2) +	base_height + inchesToScreen(4);
			var Points = [];
			Points.push( new THREE.Vector2 ( 0, cab_height * 2 ) );
			Points.push( new THREE.Vector2 ( 0, 0 ) );
			Points.push( new THREE.Vector2 ( width - inchesToScreen(1), 0 ) );
			Points.push( new THREE.Vector2 ( width - inchesToScreen(1), cab_height * 2 ) );
			var door = makeDoor(Points, material, type, 1.5);
			door.position.z = (depth / 2) + inchesToScreen(0.75);
			door.position.y = cab_pos + cab_height / 2;
			Object.add(door);
			
			var handle = makeApplianceHandle(cab_height * 2 - inchesToScreen(4), inchesToScreen(2), inchesToScreen(3), material);
			handle.rotation.z = degreesToRadians(90);
			handle.position.y = cab_pos + cab_height / 2;
			handle.position.x = -(width / 2) + inchesToScreen(4);
			handle.position.z = (depth / 2) + inchesToScreen(3);
			Object.add(handle);
			
			Points = [];
			Points.push( new THREE.Vector2 ( 0, cab_height) );
			Points.push( new THREE.Vector2 ( 0, 0 ) );
			Points.push( new THREE.Vector2 ( width - inchesToScreen(1), 0 ) );
			Points.push( new THREE.Vector2 ( width - inchesToScreen(1), cab_height ) );
			door = makeDoor(Points, material, type, 1.5);
			door.position.z = (depth / 2) + inchesToScreen(0.75);
			door.position.y = cab_pos + cab_height * 2 + 2;
			Object.add(door);
			
			handle = makeApplianceHandle(cab_height - inchesToScreen(4), inchesToScreen(2), inchesToScreen(3), material);
			handle.rotation.z = degreesToRadians(90);
			handle.position.y = cab_pos + cab_height * 2 + 2;
			handle.position.x = -(width / 2) + inchesToScreen(4);
			handle.position.z = (depth / 2) + inchesToScreen(3);
			Object.add(handle);
			
			
		}
		else {
			var cab_height;
			var cab_pos;
			if (cab_type === 'wall') {
				cab_height = height - inchesToScreen(0.25);
				cab_pos = (height / 2) + base_height - 0.5;
			} else {
				cab_height = height - inchesToScreen(4.5);
				cab_pos = (height / 2) + base_height + 4;
			}
			
			
			var Points = [];
			Points.push( new THREE.Vector2 ( inchesToScreen(0.25), cab_height ) );
			Points.push( new THREE.Vector2 ( inchesToScreen(0.25), 0 ) );
			Points.push( new THREE.Vector2 ( width	- inchesToScreen(0.25), 0 ) );
			Points.push( new THREE.Vector2 ( width	- inchesToScreen(0.25), cab_height ) );
			var door = makeDoor(Points, material, type);
			door.position.z = (depth / 2) + inchesToScreen(0.375);
			door.position.y = cab_pos;
			Object.add(door);
		}
	}
	if (numDoors === 1 && numDrawers === 1) {
		/* Single door with drawer */
		if (cab_type === 'diag') {
			var door_width = Math.sqrt( Math.pow( width / 3, 2 ) + Math.pow( depth / 3, 2 ) ) - inchesToScreen(2); 

			var Points = [];
		
			Points.push( new THREE.Vector2 ( 0, height - inchesToScreen(12) ) );
			Points.push( new THREE.Vector2 ( 0, 0 ) );
			Points.push( new THREE.Vector2 ( door_width, 0 ) );
			Points.push( new THREE.Vector2 ( door_width, height - inchesToScreen(12) ) );
			var door = makeDoor(Points, material, type);
			door.position.z = (depth / 2) - (depth / 6) + 0.375;
			door.position.x = -(width / 2) + (width / 6) - 0.375;
			door.position.y = (height / 2) + base_height - inchesToScreen(1.5);
			door.rotation.y = degreesToRadians(45);
			Object.add(door);
			
			var dPoints = [];
			dPoints.push( new THREE.Vector2 ( 0, inchesToScreen(6.75) ) );
			dPoints.push( new THREE.Vector2 ( 0, 0 ) );
			dPoints.push( new THREE.Vector2 ( door_width,	0 ) );
			dPoints.push( new THREE.Vector2 ( door_width, inchesToScreen(6.75) ) );
			var drawer = makeDoor(dPoints, material, drawer_type);
			drawer.position.z = (depth / 2) - (depth / 6) + 0.375;
			drawer.position.x = -(width / 2) + (width / 6) - 0.375;
			drawer.position.y = (height - inchesToScreen(3.75)) + base_height;
			drawer.rotation.y = degreesToRadians(45);
			Object.add(drawer);
		}
		else if (cab_type === 'diagwall') {
			var door_width = Math.sqrt( Math.pow( width / 2, 2 ) + Math.pow( depth / 2, 2 ) ); 

			var Points = [];
		
			Points.push( new THREE.Vector2 ( inchesToScreen(0.75), height ) );
			Points.push( new THREE.Vector2 ( inchesToScreen(0.75), 0 ) );
			Points.push( new THREE.Vector2 ( door_width - inchesToScreen(0.75), 0 ) );
			Points.push( new THREE.Vector2 ( door_width - inchesToScreen(0.75), height ) );
			var door = makeDoor(Points, material, type);
			door.position.z = (depth / 2) - (depth / 4) + 0.375;
			door.position.x = -(width / 2) + (width / 4) - 0.375;
			door.position.y = (height / 2) + base_height;
			door.rotation.y = degreesToRadians(45);
			Object.add(door);

			
		}
		else {
			var Points = [];
		
			Points.push( new THREE.Vector2 ( inchesToScreen(0.25), height - inchesToScreen(12) ) );
			Points.push( new THREE.Vector2 ( inchesToScreen(0.25), 0 ) );
			Points.push( new THREE.Vector2 ( width	- inchesToScreen(0.25), 0 ) );
			Points.push( new THREE.Vector2 ( width	- inchesToScreen(0.25), height - inchesToScreen(12) ) );
			var door = makeDoor(Points, material, type);
			door.position.z = (depth / 2) + inchesToScreen(0.375);
			door.position.y = (height / 2) + base_height - 3.25;
			Object.add(door);
			
			var dPoints = [];
			dPoints.push( new THREE.Vector2 ( inchesToScreen(0.25), inchesToScreen(6.75) ) );
			dPoints.push( new THREE.Vector2 ( inchesToScreen(0.25), 0 ) );
			dPoints.push( new THREE.Vector2 ( width - inchesToScreen(0.25),	0 ) );
			dPoints.push( new THREE.Vector2 ( width - inchesToScreen(0.25), inchesToScreen(6.75) ) );
			var drawer = makeDoor(dPoints, material, drawer_type);
			drawer.position.z = (depth / 2) + inchesToScreen(0.375);
			drawer.position.y = (height - inchesToScreen(3.75)) + base_height;
			Object.add(drawer);
		}
	}
	if (numDoors === 0 && numDrawers === 1) {
		/* Single drawer */
		var Points = [];
			
			var dPoints = [];
			dPoints.push( new THREE.Vector2 ( 0, inchesToScreen(11) ) );
			dPoints.push( new THREE.Vector2 ( 0, 0 ) );
			dPoints.push( new THREE.Vector2 ( width - inchesToScreen(0.5),	0 ) );
			dPoints.push( new THREE.Vector2 ( width - inchesToScreen(0.5), inchesToScreen(11) ) );
			var drawer = makeDoor(dPoints, material, drawer_type);
			drawer.position.z = (depth / 2) + inchesToScreen(0.375);
			drawer.position.y = (inchesToScreen(10.5)) + base_height;
			Object.add(drawer);
	}
	if (numDoors === 2 && numDrawers === 1) {
		/* Single drawer */
		var Points = [];
		Points.push( new THREE.Vector2 ( inchesToScreen(0.25), height - inchesToScreen(12) ) );
		Points.push( new THREE.Vector2 ( inchesToScreen(0.25), 0 ) );
		Points.push( new THREE.Vector2 ( (width/2)	- inchesToScreen(0.5), 0 ) );
		Points.push( new THREE.Vector2 ( (width/2)	- inchesToScreen(0.5), height - inchesToScreen(12) ) );
		var door = makeDoor(Points, material, type);
		door.position.x = -(width / 4);
		door.position.z = (depth / 2) + inchesToScreen(0.375);
		door.position.y = (height / 2) + base_height - 3.25;
		Object.add(door);
		
		var Points2 = [];
		Points2.push( new THREE.Vector2 ( inchesToScreen(0.25), height - inchesToScreen(12) ) );
		Points2.push( new THREE.Vector2 ( inchesToScreen(0.25), 0 ) );
		Points2.push( new THREE.Vector2 ( (width/2)	- inchesToScreen(0.5), 0 ) );
		Points2.push( new THREE.Vector2 ( (width/2)	- inchesToScreen(0.5), height - inchesToScreen(12) ) );
		var door = makeDoor(Points2, material, type);
		door.position.x = (width / 4);
		door.position.z = (depth / 2) + inchesToScreen(0.375);
		door.position.y = (height / 2) + base_height - 3.25;
		Object.add(door);
		
		var dPoints = [];
		dPoints.push( new THREE.Vector2 ( inchesToScreen(0.25), inchesToScreen(6.75) ) );
		dPoints.push( new THREE.Vector2 ( inchesToScreen(0.25), 0 ) );
		dPoints.push( new THREE.Vector2 ( width - inchesToScreen(0.25),	0 ) );
		dPoints.push( new THREE.Vector2 ( width - inchesToScreen(0.25), inchesToScreen(6.75) ) );
		var drawer = makeDoor(dPoints, material, drawer_type);
		drawer.position.z = (depth / 2) + inchesToScreen(0.375);
		drawer.position.y = (height - inchesToScreen(3.75)) + base_height;
		Object.add(drawer);
	} 
	
	if (numDoors === 2 && numDrawers === 0) {
		var door_height;
		var door_pos;
		if (cab_type === 'end') {
			door_height = height - inchesToScreen(4.25);
			door_pos = (height / 2) + base_height + 4;
			var Points = [];
			Points.push( new THREE.Vector2 ( inchesToScreen(0.25), door_height ) );
			Points.push( new THREE.Vector2 ( inchesToScreen(0.25), 0 ) );
			Points.push( new THREE.Vector2 ( (width)	- inchesToScreen(0.5), 0 ) );
			Points.push( new THREE.Vector2 ( (width)	- inchesToScreen(0.5), door_height ) );
			var door = makeDoor(Points, material, type);
			door.position.z = (depth / 2) + inchesToScreen(0.375);
			door.position.y = door_pos;
			Object.add(door);
			
			var Points2 = [];
			Points2.push( new THREE.Vector2 ( inchesToScreen(0.25), door_height ) );
			Points2.push( new THREE.Vector2 ( inchesToScreen(0.25), 0 ) );
			Points2.push( new THREE.Vector2 ( (width)	- inchesToScreen(0.5), 0 ) );
			Points2.push( new THREE.Vector2 ( (width)	- inchesToScreen(0.5), door_height ) );
			var door = makeDoor(Points2, material, type);
			door.position.x = (depth / 2) + inchesToScreen(0.375);
			door.rotation.y = degreesToRadians(90);
			door.position.y = door_pos;
			Object.add(door);
		}
		else if (cab_type === 'pantry') {
			cab_height = (height - inchesToScreen(4.5)) / 3 - 1;
			cab_pos = (cab_height / 2) +	base_height + inchesToScreen(4);
			var Points = [];
			Points.push( new THREE.Vector2 ( 0, cab_height ) );
			Points.push( new THREE.Vector2 ( 0, 0 ) );
			Points.push( new THREE.Vector2 ( (width / 2) - inchesToScreen(1), 0 ) );
			Points.push( new THREE.Vector2 ( (width / 2) - inchesToScreen(1), cab_height ) );
			var door = makeDoor(Points, material, type);
			door.position.z = (depth / 2) + inchesToScreen(0.375);
			door.position.x = -(width / 4);
			door.position.y = cab_pos;
			Object.add(door);
			
			door = makeDoor(Points, material, type);
			door.position.z = (depth / 2) + inchesToScreen(0.375);
			door.position.x = -(width / 4);
			door.position.y = cab_pos + cab_height;
			Object.add(door);
			
			door = makeDoor(Points, material, type);
			door.position.z = (depth / 2) + inchesToScreen(0.375);
			door.position.x = -(width / 4);
			door.position.y = cab_pos + cab_height * 2 + 2;
			Object.add(door);
			
			door = makeDoor(Points, material, type);
			door.position.z = (depth / 2) + inchesToScreen(0.375);
			door.position.x = (width / 4);
			door.position.y = cab_pos;
			Object.add(door);
			
			door = makeDoor(Points, material, type);
			door.position.z = (depth / 2) + inchesToScreen(0.375);
			door.position.x = (width / 4);
			door.position.y = cab_pos + cab_height;
			Object.add(door);
			
			door = makeDoor(Points, material, type);
			door.position.z = (depth / 2) + inchesToScreen(0.375);
			door.position.x = (width / 4);
			door.position.y = cab_pos + cab_height * 2 + 2;
			Object.add(door);
			
			
			
		}
		else if (cab_type === 'refrigerator') {
			cab_height = (height - inchesToScreen(5));
			cab_pos = (cab_height / 2) +	base_height + inchesToScreen(4);
			var Points = [];
			Points.push( new THREE.Vector2 ( 0, cab_height ) );
			Points.push( new THREE.Vector2 ( 0, 0 ) );
			Points.push( new THREE.Vector2 ( (width / 2) - inchesToScreen(0.5), 0 ) );
			Points.push( new THREE.Vector2 ( (width / 2) - inchesToScreen(0.5), cab_height ) );
			var door = makeDoor(Points, material, type, 1.5);
			door.position.z = (depth / 2) + inchesToScreen(0.75);
			door.position.x = width / 4;
			door.position.y = cab_height / 2 + inchesToScreen(4);
			Object.add(door);
			
			door = makeDoor(Points, material, type, 1.5);
			door.position.z = (depth / 2) + inchesToScreen(0.75);
			door.position.x = -width / 4;
			door.position.y = cab_height / 2 + inchesToScreen(4);
			Object.add(door);
			
			var handle = makeApplianceHandle(cab_height - inchesToScreen(5), inchesToScreen(2), inchesToScreen(3), material);
			handle.rotation.z = degreesToRadians(90);
			handle.position.y = cab_height / 2 + inchesToScreen(3.5);
			handle.position.x = -inchesToScreen(2);
			handle.position.z = (depth / 2) + inchesToScreen(3.5);
			Object.add(handle);
			
			handle = makeApplianceHandle(cab_height - inchesToScreen(5), inchesToScreen(2), inchesToScreen(3), material);
			handle.rotation.z = degreesToRadians(90);
			handle.position.y = cab_height / 2 + inchesToScreen(3.5);
			handle.position.x = inchesToScreen(2);
			handle.position.z = (depth / 2) + inchesToScreen(3.5);
			Object.add(handle);
			
			
		}
		else if (cab_type === 'easyreach') {
			door_height = height - inchesToScreen(4.25);
			door_pos = (height / 2) + base_height + 4;
			var Points = [];
			Points.push( new THREE.Vector2 ( 0, door_height ) );
			Points.push( new THREE.Vector2 ( 0, 0 ) );
			Points.push( new THREE.Vector2 ( (width / 3) - inchesToScreen(1), 0 ) );
			Points.push( new THREE.Vector2 ( (width / 3)	- inchesToScreen(1), door_height ) );
			var door = makeDoor(Points, material, type);
			door.position.z = (depth / 2) - (depth / 3) + 0.75;
			door.position.x = -(width / 2) + (width / 6);
			door.position.y = door_pos;
			Object.add(door);
			
			door = makeDoor(Points, material, type);
			door.position.z = (depth / 2) - (depth / 6) + 0.375;
			door.position.x = -(width / 2) + (width / 3) - 0.375;
			door.rotation.y = degreesToRadians(90);
			door.position.y = door_pos;
			Object.add(door);
			
			
		}
		else if (cab_type === 'microwave') {
			cab_height = (height - inchesToScreen(4)) / 2 - 1;
			cab_pos = (height / 4) * 3 +	base_height;
			var Points = [];
			Points.push( new THREE.Vector2 ( 0, cab_height ) );
			Points.push( new THREE.Vector2 ( 0, 0 ) );
			Points.push( new THREE.Vector2 ( (width / 2) - inchesToScreen(1), 0 ) );
			Points.push( new THREE.Vector2 ( (width / 2) - inchesToScreen(1), cab_height ) );
			var door = makeDoor(Points, material, type);
			door.position.z = (depth / 2) + inchesToScreen(0.375);
			door.position.x = -(width / 4);
			door.position.y = cab_pos;
			Object.add(door);
			
			door = makeDoor(Points, material, type);
			door.position.z = (depth / 2) + inchesToScreen(0.375);
			door.position.x = (width / 4);
			door.position.y = cab_pos;
			Object.add(door);
			
			Points = [];
			Points.push( new THREE.Vector2 ( 0, inchesToScreen(3) ) );
			Points.push( new THREE.Vector2 ( 0, 0 ) );
			Points.push( new THREE.Vector2 ( width - inchesToScreen(1), 0 ) );
			Points.push( new THREE.Vector2 ( width - inchesToScreen(1), inchesToScreen(3) ) );
			var post = makePost(Points, material, type, (depth / 2) - inchesToScreen(0.5));
			post.position.x = 0;
			post.position.z = 0;
			post.position.y = (height / 2) + base_height;
			Object.add(post);
			
			Points = [];
			Points.push( new THREE.Vector2 ( 0, cab_height ) );
			Points.push( new THREE.Vector2 ( 0, 0 ) );
			Points.push( new THREE.Vector2 ( inchesToScreen(3), 0 ) );
			Points.push( new THREE.Vector2 ( inchesToScreen(3), cab_height ) );
			post = makePost(Points, material, type);
			post.position.x = 0;
			post.position.z = (depth / 2) - inchesToScreen(0.375);
			post.position.y = (height / 4) * 3 + base_height;
			Object.add(post);
			
		}
		else {
			/* Wall cabinet - full height doors */
			door_height = height - inchesToScreen(0.25);
			door_pos = (height / 2) + base_height - 0.5;
			if (cab_type !== 'blindleft'){
				var Points = [];
				Points.push( new THREE.Vector2 ( inchesToScreen(0.25), door_height ) );
				Points.push( new THREE.Vector2 ( inchesToScreen(0.25), 0 ) );
				Points.push( new THREE.Vector2 ( (width/2)	- inchesToScreen(0.5), 0 ) );
				Points.push( new THREE.Vector2 ( (width/2)	- inchesToScreen(0.5), door_height ) );
				var door = makeDoor(Points, material, type);
				door.position.x = -(width / 4);
				door.position.z = (depth / 2) + inchesToScreen(0.375);
				door.position.y = door_pos;
				Object.add(door);
			}			
			if (cab_type !== 'blindright'){
				var Points2 = [];
				Points2.push( new THREE.Vector2 ( inchesToScreen(0.25), door_height ) );
				Points2.push( new THREE.Vector2 ( inchesToScreen(0.25), 0 ) );
				Points2.push( new THREE.Vector2 ( (width/2)	- inchesToScreen(0.5), 0 ) );
				Points2.push( new THREE.Vector2 ( (width/2)	- inchesToScreen(0.5), door_height ) );
				var door = makeDoor(Points2, material, type);
				door.position.x = (width / 4);
				door.position.z = (depth / 2) + inchesToScreen(0.375);
				door.position.y = door_pos;
				Object.add(door);
			}
			
			Points = [];
			Points.push( new THREE.Vector2 ( 0, door_height ) );
			Points.push( new THREE.Vector2 ( 0, 0 ) );
			Points.push( new THREE.Vector2 ( inchesToScreen(3), 0 ) );
			Points.push( new THREE.Vector2 ( inchesToScreen(3), door_height ) );
			var post = makePost(Points, material, type);
			post.position.x = 0;
			post.position.z = (depth / 2) - inchesToScreen(0.375);
			post.position.y = (height / 2) + base_height - 0.5;
			
			Object.add(post);
		}
				
	} 
		
	if (numDoors === 2 && numDrawers === 2) {
		/* Double drawers*/
		var door_width = (width/2)	- inchesToScreen(0.5);
		var door_offset = 0;
		if (cab_type === 'blindleft' || cab_type === 'blindright') {
			door_width = (width/2) - inchesToScreen(3.5);
			door_offset = 3;
		}
		if (cab_type !== 'blindleft'){
			var Points = [];
			Points.push( new THREE.Vector2 ( inchesToScreen(0.25), height - inchesToScreen(12) ) );
			Points.push( new THREE.Vector2 ( inchesToScreen(0.25), 0 ) );
			Points.push( new THREE.Vector2 ( door_width, 0 ) );
			Points.push( new THREE.Vector2 ( door_width, height - inchesToScreen(12) ) );
			var door = makeDoor(Points, material, type);
			door.position.x = -(width / 4) - door_offset;
			door.position.z = (depth / 2) + inchesToScreen(0.375);
			door.position.y = (height / 2) + base_height - 3.5;
			Object.add(door);
		}
		
		if (cab_type !== 'blindright'){
			var Points2 = [];
			Points2.push( new THREE.Vector2 ( inchesToScreen(0.25), height - inchesToScreen(12) ) );
			Points2.push( new THREE.Vector2 ( inchesToScreen(0.25), 0 ) );
			Points2.push( new THREE.Vector2 ( door_width, 0 ) );
			Points2.push( new THREE.Vector2 ( door_width, height - inchesToScreen(12) ) );
			var door = makeDoor(Points2, material, type);
			door.position.x = (width / 4) + door_offset;
			door.position.z = (depth / 2) + inchesToScreen(0.375);
			door.position.y = (height / 2) + base_height - 3.5;
			Object.add(door);
		}
		
		if (cab_type != 'blindleft'){
			var dPoints = [];
			dPoints.push( new THREE.Vector2 ( inchesToScreen(0.25), inchesToScreen(6.75) ) );
			dPoints.push( new THREE.Vector2 ( inchesToScreen(0.25), 0 ) );
			dPoints.push( new THREE.Vector2 ( door_width,	0 ) );
			dPoints.push( new THREE.Vector2 ( door_width, inchesToScreen(6.75) ) );
			var drawer = makeDoor(dPoints, material, drawer_type);
			drawer.position.x = -(width / 4) - door_offset;
			drawer.position.z = (depth / 2) + inchesToScreen(0.375);
			drawer.position.y = (height - inchesToScreen(3.75)) + base_height;
			Object.add(drawer);
		}
		
		if (cab_type != 'blindright'){
			var dPoints2 = [];
			dPoints2.push( new THREE.Vector2 ( inchesToScreen(0.25), inchesToScreen(6.75) ) );
			dPoints2.push( new THREE.Vector2 ( inchesToScreen(0.25), 0 ) );
			dPoints2.push( new THREE.Vector2 ( door_width,	0 ) );
			dPoints2.push( new THREE.Vector2 ( door_width, inchesToScreen(6.75) ) );
			var drawer = makeDoor(dPoints2, material, drawer_type);
			drawer.position.x = (width / 4) + door_offset;
			drawer.position.z = (depth / 2) + inchesToScreen(0.375);
			drawer.position.y = (height - inchesToScreen(3.75)) + base_height;
			Object.add(drawer);
		}
	}
	
	if (numDoors === 4 && numDrawers === 2) {
		/* Double drawers */
		var Points = [];
		Points.push( new THREE.Vector2 ( 0, height - inchesToScreen(12) ) );
		Points.push( new THREE.Vector2 ( 0, 0 ) );
		Points.push( new THREE.Vector2 ( (width/4)	- inchesToScreen(0.5), 0 ) );
		Points.push( new THREE.Vector2 ( (width/4)	- inchesToScreen(0.5), height - inchesToScreen(12) ) );
		var door = makeDoor(Points, material, type);
		door.position.x = -((width / 2) - (width / 8));
		door.position.z = (depth / 2) + inchesToScreen(0.375);
		door.position.y = (height / 2) + base_height - 3.5;
		Object.add(door);
		
		var door = makeDoor(Points, material, type);
		door.position.x = (width / 2) - (width / 8);
		door.position.z = (depth / 2) + inchesToScreen(0.375);
		door.position.y = (height / 2) + base_height - 3.5;
		Object.add(door);
		
		var door = makeDoor(Points, material, type);
		door.position.x = (width / 8);
		door.position.z = (depth / 2) + inchesToScreen(0.375);
		door.position.y = (height / 2) + base_height - 3.5;
		Object.add(door);
		
		var door = makeDoor(Points, material, type);
		door.position.x = -(width / 8);
		door.position.z = (depth / 2) + inchesToScreen(0.375);
		door.position.y = (height / 2) + base_height - 3.5;
		Object.add(door);
		
		var dPoints = [];
		dPoints.push( new THREE.Vector2 ( inchesToScreen(0.25), inchesToScreen(6.75) ) );
		dPoints.push( new THREE.Vector2 ( inchesToScreen(0.25), 0 ) );
		dPoints.push( new THREE.Vector2 ( (width/4) - inchesToScreen(0.5),	0 ) );
		dPoints.push( new THREE.Vector2 ( (width/4) - inchesToScreen(0.5), inchesToScreen(6.75) ) );
		var drawer = makeDoor(dPoints, material, drawer_type);
		drawer.position.x = -((width / 2) - (width / 8));
		drawer.position.z = (depth / 2) + inchesToScreen(0.375);
		drawer.position.y = (height - inchesToScreen(3.75)) + base_height;
		Object.add(drawer);
		
		var dPoints2 = [];
		dPoints2.push( new THREE.Vector2 ( inchesToScreen(0.25), inchesToScreen(6.75) ) );
		dPoints2.push( new THREE.Vector2 ( inchesToScreen(0.25), 0 ) );
		dPoints2.push( new THREE.Vector2 ( (width/4) - inchesToScreen(0.5),	0 ) );
		dPoints2.push( new THREE.Vector2 ( (width/4) - inchesToScreen(0.5), inchesToScreen(6.75) ) );
		var drawer = makeDoor(dPoints2, material, drawer_type);
		drawer.position.x = (width / 2) - (width / 8);
		drawer.position.z = (depth / 2) + inchesToScreen(0.375);
		drawer.position.y = (height - inchesToScreen(3.75)) + base_height;
		Object.add(drawer);
		
		var dPoints2 = [];
		dPoints2.push( new THREE.Vector2 ( 0, inchesToScreen(6.75) ) );
		dPoints2.push( new THREE.Vector2 ( 0, 0 ) );
		dPoints2.push( new THREE.Vector2 ( (width/2) - inchesToScreen(0.5),	0 ) );
		dPoints2.push( new THREE.Vector2 ( (width/2) - inchesToScreen(0.5), inchesToScreen(6.75) ) );
		var drawer = makeDoor(dPoints2, material, drawer_type);
		drawer.position.x = 0;
		drawer.position.z = (depth / 2) + inchesToScreen(0.375);
		drawer.position.y = (height - inchesToScreen(3.75)) + base_height;
		Object.add(drawer);
	}
	
	if (numDoors === 2 && numDrawers === 3) {
		/* Double drawers*/
		var door_width = (width/2)	- inchesToScreen(0.5);
		var door_offset = 0;
		
		var Points = [];
		Points.push( new THREE.Vector2 ( inchesToScreen(1), height	/ 5 ) );
		Points.push( new THREE.Vector2 ( inchesToScreen(1), 0 ) );
		Points.push( new THREE.Vector2 ( door_width, 0 ) );
		Points.push( new THREE.Vector2 ( door_width, height / 5 ) );
		var door = makeDoor(Points, material, type);
		door.position.x = -(width / 4) - door_offset;
		door.position.z = (depth / 2) + inchesToScreen(0.375);
		door.position.y = (height * 4.5)/5 + base_height - inchesToScreen(0.5);
		Object.add(door);
		
		door = makeDoor(Points, material, type);
		door.position.x = (width / 4) + door_offset;
		door.position.z = (depth / 2) + inchesToScreen(0.375);
		door.position.y = (height * 4.5)/5 + base_height - inchesToScreen(0.5);
		Object.add(door);
		
		var dPoints = [];
		dPoints.push( new THREE.Vector2 ( inchesToScreen(0.25), inchesToScreen(6.75) ) );
		dPoints.push( new THREE.Vector2 ( inchesToScreen(0.25), 0 ) );
		dPoints.push( new THREE.Vector2 ( width - inchesToScreen(0.25),	0 ) );
		dPoints.push( new THREE.Vector2 ( width - inchesToScreen(0.25), inchesToScreen(6.75) ) );
		var drawer = makeDoor(dPoints, material, drawer_type);
		drawer.position.z = (depth / 2) + inchesToScreen(0.375);
		drawer.position.y = inchesToScreen(31.5) + base_height;
		Object.add(drawer);
		
		var dPoints2 = [];
		dPoints2.push( new THREE.Vector2 ( inchesToScreen(0.25), inchesToScreen(11) ) );
		dPoints2.push( new THREE.Vector2 ( inchesToScreen(0.25), 0 ) );
		dPoints2.push( new THREE.Vector2 ( width - inchesToScreen(0.25),	0 ) );
		dPoints2.push( new THREE.Vector2 ( width - inchesToScreen(0.25), inchesToScreen(11) ) );
		drawer = makeDoor(dPoints2, material, drawer_type);
		drawer.position.z = (depth / 2) + inchesToScreen(0.375);
		drawer.position.y = inchesToScreen(22.25) + base_height;
		Object.add(drawer);
		
		var dPoints3 = [];
		dPoints3.push( new THREE.Vector2 ( inchesToScreen(0.25), inchesToScreen(11) ) );
		dPoints3.push( new THREE.Vector2 ( inchesToScreen(0.25), 0 ) );
		dPoints3.push( new THREE.Vector2 ( width - inchesToScreen(0.25),	0 ) );
		dPoints3.push( new THREE.Vector2 ( width - inchesToScreen(0.25), inchesToScreen(11) ) );
		drawer = makeDoor(dPoints3, material, drawer_type);
		drawer.position.z = (depth / 2) + inchesToScreen(0.375);
		drawer.position.y = inchesToScreen(10.75) + base_height;
		Object.add(drawer);
	}
	
	if (numDoors === 0 && numDrawers === 3) {
		/*3 Drawer Base Cabinet*/
		var dPoints = [];
		dPoints.push( new THREE.Vector2 ( inchesToScreen(0.25), inchesToScreen(6.75) ) );
		dPoints.push( new THREE.Vector2 ( inchesToScreen(0.25), 0 ) );
		dPoints.push( new THREE.Vector2 ( width - inchesToScreen(0.25),	0 ) );
		dPoints.push( new THREE.Vector2 ( width - inchesToScreen(0.25), inchesToScreen(6.75) ) );
		var drawer = makeDoor(dPoints, material, drawer_type);
		drawer.position.z = (depth / 2) + inchesToScreen(0.375);
		drawer.position.y = (height - inchesToScreen(3.75)) + base_height;
		Object.add(drawer);
		
		var dPoints2 = [];
		dPoints2.push( new THREE.Vector2 ( inchesToScreen(0.25), inchesToScreen(11) ) );
		dPoints2.push( new THREE.Vector2 ( inchesToScreen(0.25), 0 ) );
		dPoints2.push( new THREE.Vector2 ( width - inchesToScreen(0.25),	0 ) );
		dPoints2.push( new THREE.Vector2 ( width - inchesToScreen(0.25), inchesToScreen(11) ) );
		drawer = makeDoor(dPoints2, material, drawer_type);
		drawer.position.z = (depth / 2) + inchesToScreen(0.375);
		drawer.position.y = (height - inchesToScreen(13)) + base_height;
		Object.add(drawer);
		
		var dPoints3 = [];
		dPoints3.push( new THREE.Vector2 ( inchesToScreen(0.25), inchesToScreen(11) ) );
		dPoints3.push( new THREE.Vector2 ( inchesToScreen(0.25), 0 ) );
		dPoints3.push( new THREE.Vector2 ( width - inchesToScreen(0.25),	0 ) );
		dPoints3.push( new THREE.Vector2 ( width - inchesToScreen(0.25), inchesToScreen(11) ) );
		drawer = makeDoor(dPoints3, material, drawer_type);
		drawer.position.z = (depth / 2) + inchesToScreen(0.375);
		drawer.position.y = (height - inchesToScreen(24.5)) + base_height;
		Object.add(drawer);
	} 

	return Object;
}

function makeApplianceHandle(length, height, depth, material) {
	/* Default create horizontal handle with length running along x-axis */
	var handle = new THREE.Object3D();
	var radius = inchesToScreen(0.5);
	var Points = [];				
					Points.push( new THREE.Vector2 ( getArcX(0, radius, 0 ), getArcY(0, radius, 0 ) ) );
					Points.push( new THREE.Vector2 ( getArcX(15, radius, 0 ), getArcY(15, radius, 0 ) ) );
					Points.push( new THREE.Vector2 ( getArcX(30, radius, 0 ), getArcY(30, radius, 0 ) ) );
					Points.push( new THREE.Vector2 ( getArcX(45, radius, 0 ), getArcY(45, radius, 0 ) ) );
					Points.push( new THREE.Vector2 ( getArcX(60, radius, 0 ), getArcY(60, radius, 0 ) ) );
					Points.push( new THREE.Vector2 ( getArcX(75, radius, 0 ), getArcY(75, radius, 0 ) ) );
					Points.push( new THREE.Vector2 ( getArcX(90, radius, 0 ), getArcY(90, radius, 0 ) ) );
					Points.push( new THREE.Vector2 ( getArcX(105, radius, 0 ), getArcY(105, radius, 0 ) ) );
					Points.push( new THREE.Vector2 ( getArcX(120, radius, 0 ), getArcY(120, radius, 0 ) ) );
					Points.push( new THREE.Vector2 ( getArcX(135, radius, 0 ), getArcY(135, radius, 0 ) ) );
					Points.push( new THREE.Vector2 ( getArcX(150, radius, 0 ), getArcY(150, radius, 0 ) ) );
					Points.push( new THREE.Vector2 ( getArcX(165, radius, 0 ), getArcY(165, radius, 0 ) ) );
					Points.push( new THREE.Vector2 ( getArcX(180, radius, 0 ), getArcY(180, radius, 0 ) ) );
					Points.push( new THREE.Vector2 ( getArcX(195, radius, 0 ), getArcY(195, radius, 0 ) ) );
					Points.push( new THREE.Vector2 ( getArcX(210, radius, 0 ), getArcY(210, radius, 0 ) ) );
					Points.push( new THREE.Vector2 ( getArcX(225, radius, 0 ), getArcY(225, radius, 0 ) ) );
					Points.push( new THREE.Vector2 ( getArcX(240, radius, 0 ), getArcY(240, radius, 0 ) ) );
					Points.push( new THREE.Vector2 ( getArcX(255, radius, 0 ), getArcY(255, radius, 0 ) ) );
					Points.push( new THREE.Vector2 ( getArcX(270, radius, 0 ), getArcY(270, radius, 0 ) ) );
					Points.push( new THREE.Vector2 ( getArcX(285, radius, 0 ), getArcY(285, radius, 0 ) ) );
					Points.push( new THREE.Vector2 ( getArcX(300, radius, 0 ), getArcY(300, radius, 0 ) ) );
					Points.push( new THREE.Vector2 ( getArcX(315, radius, 0 ), getArcY(315, radius, 0 ) ) );
					Points.push( new THREE.Vector2 ( getArcX(330, radius, 0 ), getArcY(330, radius, 0 ) ) );
					Points.push( new THREE.Vector2 ( getArcX(345, radius, 0 ), getArcY(345, radius, 0 ) ) );
					
		var Shape = new THREE.Shape( Points );
		extrusionSettings = {
			bevelThickness: 1, bevelSize: 2, bevelEnabled: false,
			material: 0, extrudeMaterial: 1,
			amount: length
		};	
		geom = new THREE.ExtrudeGeometry( Shape, extrusionSettings );
		geom.computeFaceNormals();
		geom.center();
		
		mesh = new THREE.Mesh( geom, material );
		mesh.geometry.applyMatrix( new THREE.Matrix4().makeRotationY( degreesToRadians(90) ) );
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		mesh.name = "rail";
		handle.add(mesh);
		
		var Points2 = [];				
					/* Points2.push( new THREE.Vector2 ( getArcX(0, radius, 0 ), getArcY(0, radius, 0 ) ) ); */
					Points2.push(new THREE.Vector2 ( 0, depth / 2));
					Points2.push(new THREE.Vector2 ( 0, 0));
					Points2.push(new THREE.Vector2 ( inchesToScreen(1), 0));
					Points2.push(new THREE.Vector2 ( inchesToScreen(1), depth / 2));
					
		Shape = new THREE.Shape( Points2 );
		extrusionSettings = {
			bevelThickness: 1, bevelSize: 1, bevelEnabled: true,
			material: 0, extrudeMaterial: 1,
			amount: inchesToScreen(1)
		};	
		geom = new THREE.ExtrudeGeometry( Shape, extrusionSettings );
		geom.computeFaceNormals();
		geom.center();
		
		mesh = new THREE.Mesh( geom, material );
		mesh.geometry.applyMatrix( new THREE.Matrix4().makeRotationX( degreesToRadians(90) ) );
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		mesh.position.x = length / 2;
		mesh.position.z = -(depth / 5);
		mesh.name = "holder";
		handle.add(mesh);
		
		mesh = new THREE.Mesh( geom, material );
		/* mesh.geometry.applyMatrix( new THREE.Matrix4().makeRotationX( degreesToRadians(90) ) ); */
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		mesh.position.x = -length / 2;
		mesh.position.z = -(depth / 5);
		mesh.name = "holder";
		handle.add(mesh);
		
		return handle;
}

function makeBaseCab(height, width, depth, base_height, material) {
	var Points = [];				
					Points.push( new THREE.Vector2 ( 0, height) );
					Points.push( new THREE.Vector2 ( 0, 0 ) );
					Points.push( new THREE.Vector2 ( depth - inchesToScreen(3), 0 ) );
					Points.push( new THREE.Vector2 ( depth - inchesToScreen(3), inchesToScreen(4) ) );
					Points.push( new THREE.Vector2 ( depth , inchesToScreen(4) ) );
					Points.push( new THREE.Vector2 ( depth, height ) );
		var Shape = new THREE.Shape( Points );
		extrusionSettings = {
			bevelThickness: 1, bevelSize: 2, bevelEnabled: false,
			material: 0, extrudeMaterial: 1,
			amount: width
		};	
		geom = new THREE.ExtrudeGeometry( Shape, extrusionSettings );
		geom.computeFaceNormals();
		geom.center();
		
		mesh = new THREE.Mesh( geom, material );
		mesh.geometry.applyMatrix( new THREE.Matrix4().makeRotationY( degreesToRadians(90) ) );
		mesh.position.y = (height / 2) + base_height;
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		mesh.name = "cabinet";
		
		/*var cab_bsp = new ThreeBSP( mesh );
		var cutBox;
		cutBox = new THREE.Mesh( geom, material );
		cutBox.scale.set(0.99, 0.8, 1);
		cutBox.position.x = 0;
		cutBox.position.y = height / 2	+ base_height;
		cutBox.position.z = inchesToScreen(0.1);
		var sink_bsp = new ThreeBSP( cutBox );
					
		var subtract_bsp = cab_bsp.subtract( sink_bsp );
		var result = subtract_bsp.toMesh( material );
		result.castShadow = true;
		result.receiveShadow = true; */
		
	return mesh;
}

function makeBaseEndCab(height, width, depth, base_height, material) {
	var cab = new THREE.Object3D();
	var Points = [];				
				Points.push( new THREE.Vector2 ( 0, height) );
				Points.push( new THREE.Vector2 ( 0, inchesToScreen(4) ) );
				Points.push( new THREE.Vector2 ( depth , inchesToScreen(4) ) );
				Points.push( new THREE.Vector2 ( depth, height ) );
	var Shape = new THREE.Shape( Points );
	extrusionSettings = {
		bevelThickness: 1, bevelSize: 2, bevelEnabled: false,
		material: 0, extrudeMaterial: 1,
		amount: width
	};	
	geom = new THREE.ExtrudeGeometry( Shape, extrusionSettings );
	geom.computeFaceNormals();
	geom.center();
	
	var mesh = new THREE.Mesh( geom, material );
	mesh.position.y = (height / 2) + base_height + 4;
	mesh.castShadow = true;
	mesh.receiveShadow = true;
	cab.add(mesh);

	var foot = new THREE.BoxGeometry( width - inchesToScreen(3), inchesToScreen(4), depth - inchesToScreen(3) );
	var base = new THREE.Mesh( foot, material );
	base.position.y = base_height + inchesToScreen(2);
	base.position.x = inchesToScreen(-1.5);
	base.position.z = inchesToScreen(-1.5);
	base.receiveShadow = true;
	cab.add(base);
	
	
	return cab;
}

function makeWallCab(height, width, depth, base_height, material) {
	var Points = [];				
					Points.push( new THREE.Vector2 ( 0, height) );
					Points.push( new THREE.Vector2 ( 0, 0 ) );
					Points.push( new THREE.Vector2 ( depth , 0 ) );
					Points.push( new THREE.Vector2 ( depth, height ) );
	var Shape = new THREE.Shape( Points );
	extrusionSettings = {
		bevelThickness: 1, bevelSize: 2, bevelEnabled: false,
		material: 0, extrudeMaterial: 1,
		amount: width
	};	
	geom = new THREE.ExtrudeGeometry( Shape, extrusionSettings );
	geom.computeFaceNormals();
	geom.center();
	
	extrusionSettings = {
		bevelThickness: 1, bevelSize: 2, bevelEnabled: false,
		material: 0, extrudeMaterial: 1,
		amount: width
	};	
	geom = new THREE.ExtrudeGeometry( Shape, extrusionSettings );
	geom.computeFaceNormals();
	geom.center();
	
	mesh = new THREE.Mesh( geom, material );
	mesh.geometry.applyMatrix( new THREE.Matrix4().makeRotationY( degreesToRadians(90) ) );
	mesh.position.y = (height / 2) + base_height;
	mesh.castShadow = true;
	mesh.receiveShadow = true;
	mesh.name = "cabinet";
	
	
	var cab_bsp = new ThreeBSP( mesh );
	var cutWidth = width - inchesToScreen(2);
	var cutDepth = height - inchesToScreen(4);
	var cutBox;
	Points = [];
		Points.push( new THREE.Vector2 ( 0, cutWidth ) );
		Points.push( new THREE.Vector2 ( 0, 0 ) );
		Points.push( new THREE.Vector2 ( cutDepth, 0 ) );
		Points.push( new THREE.Vector2 ( cutDepth, cutWidth ) );
	Shape = new THREE.Shape( Points );

	extrusionSettings = {
		bevelThickness: 1, bevelSize: 2, bevelEnabled: false,
		material: 0, extrudeMaterial: 1,
		amount: depth
	};	

	geom = new THREE.ExtrudeGeometry( Shape, extrusionSettings );
	geom.center();
		
	cutBox = new THREE.Mesh( geom, material );
	cutBox.position.x = 0;
	cutBox.position.y = height / 2	+ base_height;
	cutBox.position.z = inchesToScreen(2);
	cutBox.rotation.z = degreesToRadians(90);
			
	var sink_bsp = new ThreeBSP( cutBox );
				
	var subtract_bsp = cab_bsp.subtract( sink_bsp );
	var result = subtract_bsp.toMesh( material );
	result.castShadow = true;
	result.receiveShadow = true;
			
	return result;
}

function makeDoor(points, material, type, thickness) {
		var Shape = new THREE.Shape( points );
		var Object = new THREE.Object3D();
		var insetmesh;
		
		if (type !== 'none') {
			if (!thickness) {
				thickness = inchesToScreen(0.75);
			} else {
				thickness = inchesToScreen(thickness);
			}
			var w = getWidth( points );
			var h = getHeight( points );
			if (type !== 'slab') {
				if (type === 'mullion') {
					var hole = new THREE.Path();
						hole.moveTo( inchesToScreen(1.5) , inchesToScreen(1.5) );
						hole.lineTo((w / 2), inchesToScreen(1.5) );
						hole.lineTo((w / 2), (h / 3) );
						hole.lineTo( inchesToScreen(1.5), (h / 3) );
						hole.lineTo( inchesToScreen(1.5), inchesToScreen(1.5) );
					Shape.holes.push( hole );
					
					hole = new THREE.Path();
						hole.moveTo( (w/2) + inchesToScreen(0.5) , inchesToScreen(1.5) );
						hole.lineTo((w) - inchesToScreen(1.5), inchesToScreen(1.5) );
						hole.lineTo((w) - inchesToScreen(1.5), (h / 3) );
						hole.lineTo( (w/2) + inchesToScreen(0.5), (h / 3) );
						hole.lineTo( (w/2) + inchesToScreen(0.5), inchesToScreen(1.5) );
					Shape.holes.push( hole );
					
					hole = new THREE.Path();
						hole.moveTo( inchesToScreen(1.5) , (h / 3) + inchesToScreen(1) );
						hole.lineTo((w / 2), (h / 3) +	inchesToScreen(1) );
						hole.lineTo((w / 2), (h / 3) * 2 );
						hole.lineTo( inchesToScreen(1.5), (h / 3) * 2 );
						hole.lineTo( inchesToScreen(1.5), (h / 3)+ inchesToScreen(1) );
					Shape.holes.push( hole );
					
					hole = new THREE.Path();
						hole.moveTo( (w/2) + inchesToScreen(0.5) , (h / 3) + inchesToScreen(1) );
						hole.lineTo((w) - inchesToScreen(1.5), (h / 3) + inchesToScreen(1) );
						hole.lineTo((w) - inchesToScreen(1.5), (h / 3 * 2) );
						hole.lineTo( (w/2) + inchesToScreen(0.5), (h / 3) * 2 );
						hole.lineTo( (w/2) + inchesToScreen(0.5),	(h / 3) +	inchesToScreen(1) );
					Shape.holes.push( hole );
					
					hole = new THREE.Path();
						hole.moveTo( inchesToScreen(1.5) , (h / 3) * 2 + inchesToScreen(1) );
						hole.lineTo((w / 2), (h / 3) * 2 +	inchesToScreen(1) );
						hole.lineTo((w / 2), h - inchesToScreen(1.5));
						hole.lineTo( inchesToScreen(1.5), h - inchesToScreen(1.5) );
						hole.lineTo( inchesToScreen(1.5), (h / 3) * 2 + inchesToScreen(1) );
					Shape.holes.push( hole );
					
					hole = new THREE.Path();
						hole.moveTo( (w/2) + inchesToScreen(0.5) , (h / 3) * 2 + inchesToScreen(1) );
						hole.lineTo((w) - inchesToScreen(1.5), (h / 3) * 2 + inchesToScreen(1) );
						hole.lineTo((w) - inchesToScreen(1.5), h - inchesToScreen(1.5) );
						hole.lineTo( (w/2) + inchesToScreen(0.5), h - inchesToScreen(1.5) );
						hole.lineTo( (w/2) + inchesToScreen(0.5),	(h / 3) * 2 +	inchesToScreen(1) );
					Shape.holes.push( hole );
									
				} 
				else if (type === 'glass') {
					var hole = new THREE.Path();
						hole.moveTo( inchesToScreen(1.5)	, inchesToScreen(1.5) );
						hole.lineTo( w - inchesToScreen(1.5), inchesToScreen(1.5) );
						hole.lineTo( w - inchesToScreen(1.5), h - inchesToScreen(1.5) );
						hole.lineTo( inchesToScreen(1.5), h - inchesToScreen(1.5) );
						hole.lineTo( inchesToScreen(1.5), inchesToScreen(1.5) );
					Shape.holes.push( hole );
				}
				else {
					var hole = new THREE.Path();
						hole.moveTo( inchesToScreen(2), inchesToScreen(2) );
						hole.lineTo( w - inchesToScreen(2), inchesToScreen(2) );
						hole.lineTo( w - inchesToScreen(2), h - inchesToScreen(2) );
						hole.lineTo( inchesToScreen(2), h - inchesToScreen(2) );
						hole.lineTo( inchesToScreen(2), inchesToScreen(2) );
					Shape.holes.push( hole );
				}			
			}
					
			/* defaulting to 3/4" thickness for the moment.*/
			extrusionSettings = {
				bevelThickness: 1, bevelSize: 2, bevelEnabled: false,
				material: 0, extrudeMaterial: 1,
				amount: thickness
			};	

			geom = new THREE.ExtrudeGeometry( Shape, extrusionSettings );
			geom.computeFaceNormals();
			geom.center();
			
			if (type === 'raised_panel') {
				var insetPath = [];
				insetPath.push( new THREE.Vector2 ( inchesToScreen(2.75), inchesToScreen(3) ) );
				insetPath.push( new THREE.Vector2 ( w - inchesToScreen(3), inchesToScreen(3) ) );
				insetPath.push( new THREE.Vector2 ( w - inchesToScreen(3), h - inchesToScreen(3) ) );
				insetPath.push( new THREE.Vector2 ( inchesToScreen(2.75), h - inchesToScreen(3) ) );
				var Shape2 = new THREE.Shape( insetPath );
				extrusion2Settings = {
					bevelThickness: 0.65, bevelSize: 2, bevelEnabled: true,
					material: 0, extrudeMaterial: 1,
					amount: inchesToScreen(0.1)
					
				};	
				inset = new THREE.ExtrudeGeometry( Shape2, extrusion2Settings );
				inset.computeFaceNormals();
				inset.center();		
				insetmesh = new THREE.Mesh( inset, material );
			} 
			else if (type === 'slab') {
			}
			else if (type === 'mullion' || type === 'glass') {
				
				var insetPath = [];
				insetPath.push( new THREE.Vector2 ( inchesToScreen(1), inchesToScreen(1) ) );
				insetPath.push( new THREE.Vector2 ( w - inchesToScreen(1), inchesToScreen(1) ) );
				insetPath.push( new THREE.Vector2 ( w - inchesToScreen(1), h - inchesToScreen(1) ) );
				insetPath.push( new THREE.Vector2 ( inchesToScreen(1), h - inchesToScreen(1) ) );
				var Shape2 = new THREE.Shape( insetPath );
				var mat = new THREE.MeshPhongMaterial( { side: THREE.DoubleSide, color: 0x333333, transparent: true, opacity: 0.25 } );
				extrusion2Settings = {
					bevelThickness: 0.65, bevelSize: 2, bevelEnabled: false,
					material: mat, extrudeMaterial: mat,
					amount: inchesToScreen(0.1)
				};	
				inset = new THREE.ExtrudeGeometry( Shape2, extrusion2Settings );
				inset.computeFaceNormals();
				inset.center();	
				insetmesh = new THREE.Mesh( inset, mat );
			}
			else { /* Flat Panel */
				
				var insetPath = [];
				insetPath.push( new THREE.Vector2 ( inchesToScreen(1), inchesToScreen(1) ) );
				insetPath.push( new THREE.Vector2 ( w - inchesToScreen(1), inchesToScreen(1) ) );
				insetPath.push( new THREE.Vector2 ( w - inchesToScreen(1), h - inchesToScreen(1) ) );
				insetPath.push( new THREE.Vector2 ( inchesToScreen(1), h - inchesToScreen(1) ) );
							var Shape2 = new THREE.Shape( insetPath );
				extrusion2Settings = {
					bevelThickness: 0.65, bevelSize: 2, bevelEnabled: false,
					material: 0, extrudeMaterial: 1,
					amount: inchesToScreen(0.1)
				};	
				inset = new THREE.ExtrudeGeometry( Shape2, extrusion2Settings );
				inset.computeFaceNormals();
				inset.center();		
				insetmesh = new THREE.Mesh( inset, material );
			}
			
			mesh = new THREE.Mesh( geom, material );
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			Object.add(mesh);
			if (typeof insetmesh !== 'undefined') {
				Object.add(insetmesh);
			}
		}
		return Object;
}

function makePost(points, material, type, thickness) {
		var Shape = new THREE.Shape( points );
		var Object = new THREE.Object3D();
		var insetmesh;		
		if (!thickness) {
			thickness = inchesToScreen(0.75);
		} else {
			thickness = inchesToScreen(thickness);
		}
		var w = getWidth( points );
		var h = getHeight( points );
						
		/* defaulting to 3/4" thickness for the moment.*/
		extrusionSettings = {
			bevelThickness: 1, bevelSize: 2, bevelEnabled: false,
			material: 0, extrudeMaterial: 1,
			amount: thickness
		};	

		geom = new THREE.ExtrudeGeometry( Shape, extrusionSettings );
		geom.computeFaceNormals();
		geom.center();
		
		mesh = new THREE.Mesh( geom, material );
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		Object.add(mesh);
		if (typeof insetmesh !== 'undefined') {
			Object.add(insetmesh);
		}
		
		return Object;
}

/*################################################################
END FUNCTION: buildShape
###############################################################*/



function max( values ) {
	var m = -999999;
	for ( var i = 0; i < values.length; i += 1) {
		if ( m < values[i] ) { m = values[i]; }
	}
	return m;
}

function min( values ) {
	var m = 999999;
	for ( var i = 0; i < values.length; i += 1) {
		if ( m > values[i] ) { m = values[i]; }
	}
	return m;
}

function getWidth(points) {
	"use strict";
	var MaxWidth = 0;
	var i;
	for ( i = 0; i < points.length; i += 1) {
		if (MaxWidth < points[i].x) {
			MaxWidth = points[i].x;
		}
	}
	return MaxWidth;
}

function getWidth2(arr) {
	"use strict";
	var MaxWidth = -9999999;
	var MinWidth = 9999999
	var i;
	for ( i = 0; i < arr.length; i++ ) {
		if (MaxWidth < arr[i][0]) {
			MaxWidth = arr[i][0];
		}
		if (MinWidth > arr[i][0]) {
			MinWidth = arr[i][0];
		}
	}
	return MaxWidth - MinWidth;
}

function getHeight2(arr) {
	"use strict";
	var MaxWidth = -9999999;
	var MinWidth = 9999999
	var i;
	for ( i = 0; i < arr.length; i++ ) {
		if (MaxWidth < arr[i][1]) {
			MaxWidth = arr[i][1];
		}
		if (MinWidth > arr[i][1]) {
			MinWidth = arr[i][1];
		}
	}
	return MaxWidth - MinWidth;
}

function getHeight(points) {
	"use strict";
	var MaxHeight = 0;
	var i;
	for ( i = 0; i < points.length; i += 1) {
		if (MaxHeight < points[i].y) {
			MaxHeight = points[i].y;
		}
	}
	return MaxHeight;
}

function getHeightThree(points) {
	"use strict";
	var MaxHeight = 0;
	var i;
	for ( i = 0; i < points.length; i += 1) {
			if (MaxHeight < points[i].z) {
				MaxHeight = points[i].z;
			}
	}
	return MaxHeight;
}

function base64Texture(dat) {
		"use strict";
		var img = new Image();
		var t = new THREE.Texture(img);
		t.wrapS = THREE.RepeatWrapping;
		img.onload = function() {
			t.needsUpdate = true;
			render();
		};
		img.src = dat;
		return t;
}

function SortablePoint( x, y ) {

	"use strict";

	this.x = x;

	this.y = y;



	this.distance = function(that) {

			var dX = that.x - this.x;

			var dY = that.y - this.y;

			return Math.sqrt((dX*dX) + (dY*dY));

	};



	this.slope = function(that) {

			var dX = that.x - this.x;

			var dY = that.y - this.y;

			return dY / dX;

	};



}

/* A custom sort function that sorts p1 and p2 based on their slope
that is formed from the upper most point from the array of points.*/
function pointSort(p1, p2) {
	"use strict";
	if(p1 === upper) {return -1;}
	if(p2 === upper) {return 1;}
	var m1 = upper.slope(p1);
	var m2 = upper.slope(p2);
	if(m1 === m2) {
			return p1.distance(upper) < p2.distance(upper) ? -1 : 1;
	}
	if(m1 <= 0 && m2 > 0) {return -1;}
	if(m1 > 0 && m2 <= 0) {return 1;}
	return m1 > m2 ? -1 : 1;
}
function upperLeft(points) {
	"use strict";
	var top = points[0];
	var temp, i;
	for(i = 1; i < points.length; i += 1) {
			temp = points[i];
			if(temp.y > top.y || (temp.y === top.y && temp.x < top.x)) {
				top = temp;
			}
	}
	return top;
}

function addObject( obj ) {
	scene.add( obj );
	objects = [];
	for ( var i = 0; i < scene.children.length; i += 1 ) {
		if ( scene.children[i].children.length > 0 ) {
			for ( var j = 0; j < scene.children[i].children.length; j += 1 ) {
				if ( scene.children[i].children[j].children.length > 0 ) {
					for ( var c = 0; c < scene.children[i].children[j].children.length; c += 1 ) {
						objects.push( scene.children[i].children[j].children[c] );
					}
				} else {
					objects.push( scene.children[i].children[j] );
				}
			}
		}
	}
} 


function degreesToRadians(degrees) {
	"use strict";
	return -degrees * Math.PI / 180;
}

function radiansToDegrees(radians) {
	"use strict";
	return ( -radians * 180 ) / Math.PI;
}

function guid() {
	"use strict";
	function p8(s) {
			var p = (Math.random().toString(16)+"000000000").substr(2,8);
			return s ? "-" + p.substr(0,4) + "-" + p.substr(4,4) : p ;
	}
	return p8() + p8(true) + p8(true) + p8();
}

function getIdxById(arr, id) {
	"use strict";
	var i, iLen = arr.length;
	for ( i = 0; i < iLen; i += 1) {
		if (arr[i].id === id) {return i;}
	}
}

/* Default textures - stored as Base64 data */
var woodTex = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/4RFYRXhpZgAASUkqAAgAAAAIABoBBQABAAAAbgAAABsBBQABAAAAdgAAACgBAwABAAAAAgAAADEBAgALAAAAfgAAADIBAgAUAAAAigAAAGmHBAABAAAAthAAABzqBwAMCAAAngAAABzqBwAMCAAAqggAAAAAAABIAAAAAQAAAEgAAAABAAAAR0lNUCAyLjguMgAAMjAxMzoxMDozMCAxNToyNDo1NwAc6gAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABzqAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACQAAkAcABAAAADAyMTADkAIAFAAAACgRAAAEkAIAFAAAADwRAACRkgIAAwAAADAwAOmSkgIAAwAAADAwAOoAoAcABAAAADAxMDABoAMAAQAAAP//6usCoAQAAQAAAAACAAADoAQAAQAAAAACAAAAAAAAMjAwNzowOTowNCAxMjozNjowMQAyMDA3OjA5OjA0IDEyOjM2OjAxAP/hBbNodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvADw/eHBhY2tldCBiZWdpbj0n77u/JyBpZD0nVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkJz8+Cjx4OnhtcG1ldGEgeG1sbnM6eD0nYWRvYmU6bnM6bWV0YS8nPgo8cmRmOlJERiB4bWxuczpyZGY9J2h0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMnPgoKIDxyZGY6RGVzY3JpcHRpb24geG1sbnM6eG1wPSdodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvJz4KICA8eG1wOkNyZWF0b3JUb29sPkFkb2JlIFBob3Rvc2hvcCBDUzIgV2luZG93czwveG1wOkNyZWF0b3JUb29sPgogIDx4bXA6Q3JlYXRlRGF0ZT4yMDA3LTA5LTA0VDEyOjM2OjAxPC94bXA6Q3JlYXRlRGF0ZT4KIDwvcmRmOkRlc2NyaXB0aW9uPgoKIDxyZGY6RGVzY3JpcHRpb24geG1sbnM6ZXhpZj0naHR0cDovL25zLmFkb2JlLmNvbS9leGlmLzEuMC8nPgogIDxleGlmOk9yaWVudGF0aW9uPlRvcC1sZWZ0PC9leGlmOk9yaWVudGF0aW9uPgogIDxleGlmOlhSZXNvbHV0aW9uPjcyPC9leGlmOlhSZXNvbHV0aW9uPgogIDxleGlmOllSZXNvbHV0aW9uPjcyPC9leGlmOllSZXNvbHV0aW9uPgogIDxleGlmOlJlc29sdXRpb25Vbml0PkluY2g8L2V4aWY6UmVzb2x1dGlvblVuaXQ+CiAgPGV4aWY6U29mdHdhcmU+QWRvYmUgUGhvdG9zaG9wIENTMiBXaW5kb3dzPC9leGlmOlNvZnR3YXJlPgogIDxleGlmOkRhdGVUaW1lPjIwMTA6MDc6MTMgMDA6MTU6NTI8L2V4aWY6RGF0ZVRpbWU+CiAgPGV4aWY6UGFkZGluZz4yMDYwIGJ5dGVzIHVuZGVmaW5lZCBkYXRhPC9leGlmOlBhZGRpbmc+CiAgPGV4aWY6RXhpZlZlcnNpb24+RXhpZiBWZXJzaW9uIDIuMTwvZXhpZjpFeGlmVmVyc2lvbj4KICA8ZXhpZjpEYXRlVGltZU9yaWdpbmFsPjIwMDc6MDk6MDQgMTI6MzY6MDE8L2V4aWY6RGF0ZVRpbWVPcmlnaW5hbD4KICA8ZXhpZjpEYXRlVGltZURpZ2l0aXplZD4yMDA3OjA5OjA0IDEyOjM2OjAxPC9leGlmOkRhdGVUaW1lRGlnaXRpemVkPgogIDxleGlmOlN1YlNlY1RpbWVPcmlnaW5hbD4wMDwvZXhpZjpTdWJTZWNUaW1lT3JpZ2luYWw+CiAgPGV4aWY6U3ViU2VjVGltZURpZ2l0aXplZD4wMDwvZXhpZjpTdWJTZWNUaW1lRGlnaXRpemVkPgogIDxleGlmOkZsYXNoUGl4VmVyc2lvbj5GbGFzaFBpeCBWZXJzaW9uIDEuMDwvZXhpZjpGbGFzaFBpeFZlcnNpb24+CiAgPGV4aWY6Q29sb3JTcGFjZT5VbmNhbGlicmF0ZWQ8L2V4aWY6Q29sb3JTcGFjZT4KICA8ZXhpZjpQaXhlbFhEaW1lbnNpb24+MTAwMDwvZXhpZjpQaXhlbFhEaW1lbnNpb24+CiAgPGV4aWY6UGl4ZWxZRGltZW5zaW9uPjEwMDA8L2V4aWY6UGl4ZWxZRGltZW5zaW9uPgogIDxleGlmOlBhZGRpbmc+MjA2MCBieXRlcyB1bmRlZmluZWQgZGF0YTwvZXhpZjpQYWRkaW5nPgogPC9yZGY6RGVzY3JpcHRpb24+Cgo8L3JkZjpSREY+CjwveDp4bXBtZXRhPgo8P3hwYWNrZXQgZW5kPSdyJz8+Cv/iDFhJQ0NfUFJPRklMRQABAQAADEhMaW5vAhAAAG1udHJSR0IgWFlaIAfOAAIACQAGADEAAGFjc3BNU0ZUAAAAAElFQyBzUkdCAAAAAAAAAAAAAAABAAD21gABAAAAANMtSFAgIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEWNwcnQAAAFQAAAAM2Rlc2MAAAGEAAAAbHd0cHQAAAHwAAAAFGJrcHQAAAIEAAAAFHJYWVoAAAIYAAAAFGdYWVoAAAIsAAAAFGJYWVoAAAJAAAAAFGRtbmQAAAJUAAAAcGRtZGQAAALEAAAAiHZ1ZWQAAANMAAAAhnZpZXcAAAPUAAAAJGx1bWkAAAP4AAAAFG1lYXMAAAQMAAAAJHRlY2gAAAQwAAAADHJUUkMAAAQ8AAAIDGdUUkMAAAQ8AAAIDGJUUkMAAAQ8AAAIDHRleHQAAAAAQ29weXJpZ2h0IChjKSAx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";
var grass = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/4QEARXhpZgAASUkqAAgAAAAJAA4BAgAUAAAAegAAABIBAwABAAAAAQAAABoBBQABAAAAjgAAABsBBQABAAAAlgAAACgBAwABAAAAAgAAADEBAgAMAAAAngAAADsBAgANAAAAqgAAAJiCAgAVAAAAuAAAAGmHBAABAAAAzgAAAAAAAABHcmVlbiBHcmFzcyBUZXh0dXJlAEgAAAABAAAASAAAAAEAAABHSU1QIDIuOC4xMABTaW1vbiBNdXJyYXkAAHd3dy5nb29kdGV4dHVyZXMuY29tAAADAACQBwAEAAAAMDIyMQCgBwAEAAAAMDEwMAGgAwABAAAA//8AAAAAAAD/4QjKaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49J++7vycgaWQ9J1c1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCc/Pgo8eDp4bXBtZXRhIHhtbG5zOng9J2Fkb2JlOm5zOm1ldGEvJz4KPHJkZjpSREYgeG1sbnM6cmRmPSdodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjJz4KCiA8cmRmOkRlc2NyaXB0aW9uIHhtbG5zOnhtcE1NPSdodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vJz4KICA8eG1wTU06T3JpZ2luYWxEb2N1bWVudElEPnhtcC5kaWQ6OTAxNjRENkNBMTA2RTAxMUFGQUI5RkM0N0QxQ0E5MkI8L3htcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD4KICA8eG1wTU06SW5zdGFuY2VJRD54bXAuaWlkOjNGQUM4RURGREY4NUUwMTFBNTNDREFGOEUzQzBDODEzPC94bXBNTTpJbnN0YW5jZUlEPgogIDx4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ+eG1wLmRpZDo5MDE2NEQ2Q0ExMDZFMDExQUZBQjlGQzQ3RDFDQTkyQjwveG1wTU06T3JpZ2luYWxEb2N1bWVudElEPgogIDx4bXBNTTpEb2N1bWVudElEIHJkZjpyZXNvdXJjZT0neG1wLmRpZDpFOTFFQjA3RDg1REUxMUUwQTZFQUE2QUYwM0FCQjQwQicgLz4KICA8eG1wTU06SW5zdGFuY2VJRD54bXAuaWlkOjNGQUM4RURGREY4NUUwMTFBNTNDREFGOEUzQzBDODEzPC94bXBNTTpJbnN0YW5jZUlEPgogIDx4bXBNTTpEZXJpdmVkRnJvbSByZGY6cGFyc2VUeXBlPSdSZXNvdXJjZSc+CiAgPC94bXBNTTpEZXJpdmVkRnJvbT4KICA8eG1wTU06SGlzdG9yeT4KICAgPHJkZjpTZXE+CiAgIDwvcmRmOlNlcT4KICA8L3htcE1NOkhpc3Rvcnk+CiA8L3JkZjpEZXNjcmlwdGlvbj4KCiA8cmRmOkRlc2NyaXB0aW9uIHhtbG5zOnhtcD0naHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyc+CiAgPHhtcDpDcmVhdG9yVG9vbD5BZG9iZSBQaG90b3Nob3AgQ1M1IFdpbmRvd3M8L3htcDpDcmVhdG9yVG9vbD4KICA8eG1wOk1ldGFkYXRhRGF0ZT4yMDExLTA1LTI0VDEwOjI4OjU5KzAyOjAwPC94bXA6TWV0YWRhdGFEYXRlPgogPC9yZGY6RGVzY3JpcHRpb24+CgogPHJkZjpEZXNjcmlwdGlvbiB4bWxuczpkYz0naHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8nPgogIDxkYzpmb3JtYXQ+aW1hZ2UvanBlZzwvZGM6Zm9ybWF0PgogIDxkYzpjcmVhdG9yPgogICA8cmRmOlNlcT4KICAgIDxyZGY6bGk+U2ltb24gTXVycmF5PC9yZGY6bGk+CiAgIDwvcmRmOlNlcT4KICA8L2RjOmNyZWF0b3I+CiAgPGRjOmRlc2NyaXB0aW9uPgogICA8cmRmOkFsdD4KICAgIDxyZGY6bGkgeG1sOmxhbmc9J3gtZGVmYXVsdCc+eC1kZWZhdWx0PC9yZGY6bGk+CiAgIDwvcmRmOkFsdD4KICA8L2RjOmRlc2NyaXB0aW9uPgogIDxkYzpzdWJqZWN0PgogICA8cmRmOkJhZz4KICAgIDxyZGY6bGk+Z3Jhc3MgZ3JvdW5kIHBsYW50IG5hdHVyZSBncm91bmQgdGV4dHVyZXMgZnJlZSBpbWFnZXMgY2cgcGhvdG9zIHNlYW1sZXNzPC9yZGY6bGk+CiAgIDwvcmRmOkJhZz4KICA8L2RjOnN1YmplY3Q+CiAgPGRjOnJpZ2h0cz4KICAgPHJkZjpBbHQ+CiAgICA8cmRmOmxpIHhtbDpsYW5nPSd4LWRlZmF1bHQnPngtZGVmYXVsdDwvcmRmOmxpPgogICA8L3JkZjpBbHQ+CiAgPC9kYzpyaWdodHM+CiA8L3JkZjpEZXNjcmlwdGlvbj4KCiA8cmRmOkRlc2NyaXB0aW9uIHhtbG5zOnBob3Rvc2hvcD0naHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyc+CiAgPHBob3Rvc2hvcDpIZWFkbGluZT5HcmFzcyBHcmVlbiBUZXh0dXJlczwvcGhvdG9zaG9wOkhlYWRsaW5lPgogIDxwaG90b3Nob3A6RGF0ZUNyZWF0ZWQ+MjAxMS0wNS0yNFQwMDowMFo8L3Bob3Rvc2hvcDpEYXRlQ3JlYXRlZD4KIDwvcmRmOkRlc2NyaXB0aW9uPgoKIDxyZGY6RGVzY3JpcHRpb24geG1sbnM6eG1wUmlnaHRzPSdodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvcmlnaHRzLyc+CiAgPHhtcFJpZ2h0czpNYXJrZWQ+VHJ1ZTwveG1wUmlnaHRzOk1hcmtlZD4KIDwvcmRmOkRlc2NyaXB0aW9uPgoKIDxyZGY6RGVzY3JpcHRpb24geG1sbnM6SXB0YzR4bXBDb3JlPSdodHRwOi8vaXB0Yy5vcmcvc3RkL0lwdGM0eG1wQ29yZS8xLjAveG1sbnMvJz4KICA8SXB0YzR4bXBDb3JlOkNyZWF0b3JDb250YWN0SW5mbyByZGY6cGFyc2VUeXBlPSdSZXNvdXJjZSc+CiAgPC9JcHRjNHhtcENvcmU6Q3JlYXRvckNvbnRhY3RJbmZvPgogPC9yZGY6RGVzY3JpcHRpb24+Cgo8L3JkZjpSREY+CjwveDp4bXBtZXRhPgo8P3hwYWNrZXQgZW5kPSdyJz8+Cv/bAEMAEAsMDgwKEA4NDhIREBMYKBoYFhYYMSMlHSg6Mz08OTM4N0BIXE5ARFdFNzhQbVFXX2JnaGc+TXF5cGR4XGVnY//bAEMBERISGBUYLxoaL2NCOEJjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY//CABEIAgACAAMBIgACEQEDEQH/xAAYAAADAQEAAAAAAAAAAAAAAAABAgMABP/EABcBAQEBAQAAAAAAAAAAAAAAAAABAgT/2gAMAwEAAhADEAAAAed9TmxFiqOytGhSeq4m1CjJF35bZaDztsZ6RhtWR0GzyTVBUY1jnRxpkosUBWJGhrKyqqF6Q4islA4ySvXx2kWarbSk9C5louhHGVXM2RFdVF+eiMAJXj0QFvA2MWlJUroFYtTybGLEVci2KsZHUxDEegCCtVREoltVVhpO0mnSdpE6Dc+YXVlaaTtCNRKQZhSTDLRJBKk7dSFrC06ihaASyRPUWsTOVwVQK5GTPRWFJFXq5VeiMjKHrZWXMhkwR7cDSJ15+gktEpgl4Q5SmjaFdBS00wFnEShlmcEtM6p6fVUHacpKVEC5CTZIPjaRlkUZ7SAZdiqToj0EoZVeNEaVcvPQVsQlYSsq2ToArlBBxWnFFNpOLTKayJAZKU8wYcOMyOfasjiAXgZkoSY6tZMKlJLRVQpedZJEySunraTDBTLZQ9HPmq2ApOAGw8zO3YlGakMmBSnIRHohJNG2qwZIYxqZbTWV6Ic4vMJSqVC0zIYUtCK4FrhpnCh1Ns4jJVVlXUgpgrPJaZSHxla9YhBQsFQsl5rSVGmwdI0RTCGirRJmFlVdDtVBMvCPSQ6qFdSZHCLVpZrZUS0iB6mktSVJ0Em7W4OsgC1FadUXBpUJepshWphRNNtaZ9EMzSsmjkhIu2XCdhc4kni6hSxhSYHQLQYQpMrNeF6RWWALLStsZ5tEi2oVlWWTNVJK6GaZtcohqlYZZUMy5FrLoIimJErVFoIZVckxS1KADvFpMjirplgC00UrqGuk0wRktNWlSiaiAULOsPzA0WjcXDEmddDSVMkdaCKHkBOtRp3JllGULbTa0nO7SU7ZEfAOxMMCqBhgMs6QemDaRkzCqNbYyMhzQFoSrIdIRsF1AjugxmisKrYpwH02Do2CuUcFQOuhaobAwZY0wVSdTqHkUlC8CpnQjAViWYaBjOMGNIzIDUwuokMpxkYmQ6nSkoadgTqEhsDQGqpUwR2KxslFkaTsOQFdiitOq1kVikkpbz2GpnlWRAGBgtVm2gKz1iZloMsNRCMFIrycy0iUV8iM8DOMuJxtlBYIUhUC0kCunWJ5XpWV1wArUBjAojlMuR3hUqEClRijVkNBcHUBsisFp02hspMdUTK4rz1FwJMhlbdAyI6uTdMbZlWmEMBOmZWh5vMYz1jAkG2lKuqGN9dIluVbMGkyFmZslFxVpXQZDMm1cVs6lnXKbqamVYGpIdcyqKIlJMCiHBBFpm6yPKjk32pIvUm7LJCwcnVCqkMgYoozGtI0Fkr2VVRm2RbCtNiLWwsXYbTeJdUXJh5U9ppCszWIwy0mmp6BTFcrZdI0yttWk6KytCtMl5zceJNOFQvPEJVQmiSTdMorGqFHJIsbVeYA+BOhxM5g5aQmBFdpk7Oih4inppyOjyTVdV2nQpMYGaQ+OEzanVdCrVbazNJJW5a2uu0yRsq6iistFnqBJvsHK6GNFrNhKWmRpWAloqMpYZASVkahishMuhZtgTsrknjSsyXiTLQ0WZRlyCoymNHSeJAl4iuQGHQq5myZDgEKUwwWUAJFKaTjBiZKoYosUR1qkjYAWqxoAisrk2YqoWgErKQrVK14pFlncllNVnprSk6oqkwi1WleeV5WVGKFSsylAtCTmksCxrMs0omxiHAHmYtO1ihQ2iILBCiFiRfGxRNeeXY86s2ZJ50tdFvCq6oU6IRloLS06AYNIiWnaAClotY5nIAxkuqrirlTMtlS0XSXRPGwmXTo5hWFCNpOpRsTfNaCuZKOiq6UmUIdcykRw0JVWpFvzLaQahQBMC0pn0TkUrSjOiRJ42tWqMi5kAaTUvPJaLsQozki6LE61ZVpIpRgusbatN5GE6wpyrjhY7RJkog7pKSqMtIQ6ow1CqpDmXQKjEylRG2tplMhneRQyMI5UzJRQ8WEoHsmrBXRbEXzoZqR8qxeaUGRHtVlam2lDq86NE0VkwAWmUQ4YLhkbJmxVErNlkqgGIVVqtgfTlqisDK1tDz3gZcYYDM00R8Bb89FO3PVOjnrDI0kfGZcKFApNCZsVjRQYztZwxjliohYk6MLRAhohEFtapM4BxRo1AjjWqyGRWCjVQjYIMSQc3TzrSioEOUaRaFGahio2okuEr2TDyt6pvOFIdC8lV2VkADKDMk9dKFEtAnSRSYqPJ5SOFFtGASdp1JPzvbWREjM04ZFe0TcoFBtaiGRLRajnjDJRLXQMjq7RLTcYAhOeIkGjXmoFprVwjygplotJyTbJVMVGRqQJWlUeqNieKoKCiqEJioSiZlIrFCyORdFtq0zI+E4dRa2WvJMQ4rSJhRKOxgOjgabks+NpOVyUiLI9hTZX2Kq8mVC7IELQs7LWC0TKHVX0UrDpUUOg6UnatM8kScMCwqnBUqGVpFU1yby0POdtMraC6iBpNpYJSMFRaPtJPNtFRiZovFIvQWQaq5XWVBpJ7qmTJRaTfE2oqSquHIlK6CljouHGUpRVMHxJlClWWxjsadNLufqWAaQ0YOkjgwKCk6YU0Qo2STgWkgRSbTWmnazMjRsCs2oiB1UDKR0fApJlRwDLRBmVRKZ4k2Fit0c8IWFqi0yyZBy2RJUmtAHQyc0ykSss6k0cW0wrM87hqZCwJnQW0hbI9BcUNJiUrjaSChKDJ41JlJrBQOrhQy4GypRMTBRdUaVBSCgz6RlnqIpIqgvB0KVPbFAZy0QyToVaRGsloNfnDWRGI1MiuFpVGpzNBcgkjLVdHoiL4IHwtxeEWhecYM+io9Yjs1sqzMKxck86Er81rVAaZTX5rbMNJE1WlaZW0rJG2YaLpRKvA5+hbBQCMTMrCjLJ2KIrLTUm0mC0VUoFLbB5aCi6qgZ1KBqRlWKNScV7YFxCCAbA2K0E7ySSkrW2eg8CjTZgYzh0JoqHG02BqKJUUJydVaTpJTI9SsuHUUgTtKyiqstHjQFFkX0iuZGtbn6JIto1saVJxVleIK60SaQhMlDmQ5LIjhBwWAsTa8bpayF4nsULaciVm2q9uOsmfEYYyc3TNlCdAknNp6rDphFY0QD0WlcpCYkDq1KW5o2els2lYOVYxvFHNOeHSsdTKHUmFwO2zUKalFMOwVNmELn1BDO1sANlFjwasIzCWYobH06BlTGnDqKztPLmHTOschaCm2+VDG3MVaBSki6lBUwpSTlLSWuYhmGTZtJOfTMmQdXLWStXnvGyYDFTpkpkxC0VZhZuo+QGFp0s7mgrJGpIjstIaKGqYNFk3PHTz5qyMAl2ICjEloam1FiboLSy4q0tJSYa0iaFVWhbJNLZRCULpI15rp2DZkUqd0Jd8oURlVaIyKzYInQSoQqi1Ju8Q89lMtUquCQrgg1GOVLR1bgLDvJkdwIKO5ErUaOIqs1s0fV0zW2ZGy4SJGqKUmn/8QAJRAAAgICAgMBAQEBAQEBAAAAAAECERIhIjEQMkFCAxMzIyBD/9oACAEBAAEFAvZ1JJLIkt4JxSaPZO2SWv5MtX+bxaqScMhT5PEXF0dJMjsQxvEbtOSTn1WtOT2exoTHoSli6Riylf2LErX5gyVDlAXKS1KbylZArexHZFblF31LpL1xsbLaHWMbTXrCQ/8ApGRaPZlOo9XpmxuyTo032zZxE9/XpK2UyqX/AOjpvbFWUIsceNVJ9UiS09n32HSeIu/qHyVW0TeQvCfBXbVvqK5NOiNqfYh5N7q0z9S6VGrrjfEs+XcnBX/nitMrGLFua9qTl0XtaNZu6KuWsujUXL2k6FJ4rYmOW8jESGtUpKsWlRix7XRNET808bo+9TaTKxEiSqWqx3bHIunKSE7EmNErGRaQ3bXoo2prURbhTFJ4yNXJrFEVUpWi+UnLI6fxjla6cVZJKo8hpC7TG4lDiJCk70NbvbQ20ruBsSyPytFpJ6f7Ze6ok8yvHbfZGTaoUNfXRVJsZWlDUuI5cY9yvFwljZKFkvCbcasd+MchxEtSWj2XFFrxjiSXPLfQkkWsroytURjzn3oYyXTR2Iy3Hc/rErJLE+zxbej6bajKpdNIbtlcnWStpMTVyP52f5yUqpxRupSocUhtyJxVdmrZskj8s2j9ZajVpKZawxHJ1V//ABptunRKzoyK4yZqrt034+Z8flZFCWL/AKSG0LtxR9XevEUSLSb1H7FpuOl9StSTI3JnJJWk3y+40NtlzSfAXKW29l67L4OXE+LS7S9L8RZ8UJJ6SujpZaTOY4o+ssWiViHvwxvXSu4ViN+Lo7P5qnJty9UnUm1fxK2x90L3TSTdjbtq5dFajk128iOm5PJrfZbTe/Fyb+ySZ9rl6n86XjZGoy7b6N40RmPcoxOvGxsaENYnztP1XIjUn+um0xUi7d6SsTqKbNIy3TxExxaIog6HWR7Rx1LtvE2ihDyQvaxaeTLjIUab9pqyvEdx6WyTSWWn2N0RodxUZskxbbevk1bGLuXcWbnHGh96Ni9boatvFRSGllGO5y32WO6pqPYyOx9rTnya8JM7l2R6a0mxdPRjtxidnb9Wex9i6Mt9Fu75YyHQ48XUZfzqUv8A9KWGkt3elSSW9leGrjWR9to9nOmfaaO47ocbfRVKxqhRTbTMqIyWV0uxPEf/AE0fJHRs0WJaPk3Q+QuIkh0l0PtC2JljxxQsSTFVrRJu27X+mKVRLaFsV5ONJtOPai05LksdNW7proj2qqtolI3btlm8fkYpmMbu2h+0WfdOKXFWIlpRqm9uivDer41ipc0nqSo/P1SGrEY2Vv3UqwsUFlJXP7q5PxZLrts+rcboR0J7lso2ytJ34i/F2/n6UEfq8iyxkbTc+GkS0nduCYk0KJNNiZSxdeEvGmWomnGzsXKEfWhJsk0iqcXi3uWxtsTMj6nclHUrYrRHpu/5q5GykK6qyAlcstP2FIvf6WvFWtJi8La2itt6pi2zJY1u8RWhPcti6xR9OvF7XbVqk4srakWWQyJQpx6uoj4tNV9qRdiVKDVKjcRxYtfzh/RRJRtJ7T5Lu+SseiMlcvUW226fZ2lpvS2vEYu2S24GhXklp0vDXKWheyRyXlPbfiqch7Wk4x1e4xSJLjjTu1O6pRG8Y2kONlslLSyRLkoOkvDepOjba7tlXJKhaISI0j+kVcdHtFwrx9fdbjqXxdtj4xbknbcqHqKyNn2/CL3ZFMlFtDJIiuSjufd6O1jpJp/f19okuUsjAjttulHiflC5L8qrdD20zHIdI+2mJ029Royt/pesluLood5NH1pDfElyLkyO0cT9Ghe/qfdFaiIa8NPLd3bvbq11Fb+8pGjizpVQpbaqXyKRLqN21klsq30IoaJJxE9cib5Y2t0+RW1jlJRi0nf8zK3PkoXgnq/G7aPZdeEsZdRjF4vQ1xS0lpeEtOrsj7e0XEo7fSR2R2RVL5seV9GTOktykLShI9o7Xjouxn5iflTcXYo2pOKJMejtWicXB6aVMujJ1XGmfPj6xbi7pOo1ZZoa4rrTS9fzdmeJNbsn1msehVbR2+zsVodkWqtpI7FdvbofIZtNtiosuxtJuhDUa6GbkSdyI9yWTdGr+fmW0Ltp1XDspVlpPwlQo7+P1+RuL2JupaJlM/Wrcoofdqyt5WfbYvWyTLJdHG8z803FuQrbUYoZVpaNElcvZvR85F2ksm2aSO2Y2RQ/C9dDfi9I+dH1ItKTvK1fUsqb2XxXTdNliiJIlE0UstqTVSVZLTs7OONHaavwrNNPT6bRxRKSG2hHt4VtR66b9E7aTyfbKKslHdVLsysXVo/P1rdavl2ZbvxesvFulkzlE/nJDurENGmRdlcsMh0Vkz9XyOnHvR0kdpooq2+0i78OrfJqr/dWat8W2rND6SKSbI9feo9GZeki6T0/io7UGjoTblSySGj9Mcub26E6G0iPEdMhUvDTZ0/qe/b+f5+NkUpRtZPwsVFWJqQ5qLVlcmO6cqWLr7ayyH3lGJsYkLv7/JxJ9q2JYv1l0qHtI0Uh7VKr20iL3Xjtqzo0k+3Ebr+i0cm/y7y/PZMUT0ezQ3JxysqonQmircu3FON+FtbK25OMY6Irk3Q2RVk47TpuWTZ9vVC9mjKkrUhlb/T049kWmt0LZORopOKdlm2fp1X678VGuyqbZaSi6j2Ni0mPbGqMyCJHajIfvGRJcb22StumiSRGScmuOqSOiUsx6FodPxG7ojtuMZnacrNKLhf811pDYmsX1WpxifOjTIrF3KoM/p40fItEYs0Rqm6X5b5PZuRoyP1tSQ9LeFGzt9kVpPjQvfd0jiXy7daKvxeSdIu34qNQ0VJvi1fK9IdiWK1SaNX7Td1B7pYI7SWI+1tt0Jsovj9vl23otMpsnR7HQk2Jq5PVLHjFO0tuV+HVUdIirVHEXT0SdtdbunEycRu0uxl0RGq/mu8ZEHSUBtEkoiqmKxZEh6cospxX84uRLO1LIiTdxrSL22JGrirMdN0R34yHSkkVy7iisiJs5XvLNNPTUhaTlZ8vmdDdnsoaX2Lxj/SeXh3ci1F/ZDXHahylF6VyIPS9Jqh6L0Rxb8XRQpOJuRJNwjx/nkio5STx3/8AGODqySpdJOSFeL7/AKVKL71FfnGlbLHSW0qPsjd/EllDqWJSQ0mUojViHWWKcIypkr/0rIu5YEUk/aSG6NEVp9urve0lsjm0nJN6GrXTXHxSwpx8UXvE+2mrLKseRt+G6Ue8na2dkuyUSqT4NnSofjtVcoJopsaQu8mz9STp0StGNnRWZFcodI9y+Xx+n8yKpxVFVKiCo+vkfHybZorUaylHKSvCbSV6fdjFrxpyNJp0Kq+2N8RIbybRJWoScTYmN70i5NVyxdxobMaJG2R7MjHKNUZU/nxWR07pN2SQlR+o7kyb5OH+j/nqKjH+aXqoxJUUJ2flqR8dl7+UvGJRO/DMbKsyxPzbOldpN1tqtPR3JKpDi2VTrfR9WlL1USVirJupN4iobIU5PT2XZHZ049zjzlF3E/UlyaSE+U22KiLVvuTtXY9LG4xipTraGJSEOLRZrFI7cUm2qPsdq3IoyZpl5eG9dEtLbVHatobTJcUnpd/nR1KVqCP32N7lUnLvVOnKScopo6PyalPKhR4+plYlk9zKMbOlprqNUv1978PRTa9VF8JLx9XedLdeygm5RWuKKeP6XfavfZWJ0IVMy22kaLuSauQqya4/pyEuLRWkyaK190R4uU6cnQ+mz4tvTVM/LlRuBL/pdLwvVtU0fpxyIqllxXKd0u3KyPGKbFVfC6Ev/b+ncE8XxXhFbW0kWaT2OsUkxomfa30x3Ir/AM4qyxO244zxlf8AV+PkNf1bylk5RRjpLdaVVKmQ0JUfY3IuMyttPBKjqN8m34VCeQ47vSSLdbiak756I9/IvbNYuotrxFn5WzLYkIRbyqozQlz/AHvKhCev5+s0rTqMTNt00fctJW4kikhNl6g8ZTZulpRu5Iu/5QH2qLd+ybvxDqRgmK2JGkbHsRDQ+/2pbXSqpdS9mU/KyydGxZIrVilkO03J4bY48dNLp2y9JM+24uskqlLf9FG1NyH3Tibb6L55UY0fFok6E41kZRaV1eu1+o+qeq1eMteIUlRo6l+3RaG6JxTa9ctSlqHb95Oh+fUez69C72PR7CWm0itqhJHSbi2Wq0QRqJZyEkz9OnDtJDiV/wCY1TtyMbSi0nSS2t0lEpyK43aXULi/zlioLlQtDPr6yt9v9ZDYtxyxUZbx5Iu4rbdRXb1TdOTK4XxW3TMx1k2sa3fLNMauKtDTH1tRUtrojNXKBi1/OV2uu3uIj4kO0ytKkNty45J8smS7k8yLTS6WzSlpr9SdT6m+5xUiLVxeMnWMqRXGsTF/0cdOUcBvZdnsbNOT14ao6XUNYmkRFt/0VTXGVkvbcnDbqWUGr+0Xr/RskPR82xPUCmxZspqWk/26fh3bVtxRJIhUUrOMRpJ9GSLZ346KjGcVyxxlKEqi+OaYvTIeRLtbHtJOobGbG8Gx7fY9RUkj08bPaLQ7FdueJKl/P3K3H2KNIQ3um1ZA/oyql9SsxHJY7by01RdxtMWUVsrco7pVZSvtsirMhQsTpRk8pSbkxcU9pPUnRTNxE9t0LuW13GVNdDPzPtdvYu5rdYj6m7V0QORF3C7MtvZISy8Xuxqh6hXGLNJ7Tk1aGSSimqfEQuLq2srUd+PlclsTE3eVM7kpRksbX5V18rnN3K+KbJaEWh2zsZe3IltRQtDhSckyUi9Vxabe8Pq1LotKIny7E9J1HoRJa9XW8WPQykk+Itq5p3y/OjY+Ki2hj22tLUXxitjvOaY6jF0SiIy3G0pOzMWLKVUOTcYqiOyMCttoftIkqTY0aQ4UONkkSFHGO5GJ6j4ptmTS6f6Wxlj1Il0tqOpzTr4VZGUYp8hJxlbZURCVLo0jdJtp2zsUcVTvcFfJ+stxuzs/LYsGJFRH4Yv+dt+Ox0iiTs1JRdNTxLbjs0248rHGi8o9n89GaR6ijkNWR5J7WNRgeo3ZkfqlIWiFGVy7MURtjly9hJMWl/SSzjUZNJyk0NIWxNoT1HT452oSkit42PQmkfzjvSGshqv5rquMWoknc3Gn2RVNxNIriuUnT/p7DSkKI7SpMjJ1HGZfL+j4RXGelF4vFKcJCaTuMjDTSQ3ZsS45Ubw3lVjptFcdGQ7yhyfPLG1WJTFRHt0VQmJYeFFKPZHr+krRnpS3YmsXKlQ9OXVVBM34bbf31k9OV4y9YZV08YmO6Y2SywokkiKqXIccYOHBKi2csHtLpRJd2djaw9ZKrl6xg2j80zsSJptP0MlVcrEtPTt5TWSjdpWN3KtJolQkxPTia/0luWxxKfjaUU6S8M5GMm0mlFDqKfTuZGTyckYsjucu7kUIl/0ejtdD2O2RF3Y9NMo2NkZazoux6PyNZTWhbl7NKoo7cY0KTFC29TTyPlYqy3eVnLJ05Tksao+0IUi6SdpQP3G0drErEm1l2bp4l0q1F2pRk1TRFtHGjXjVIlsQmpF71hHUe335dRPzcVKqFIntEXqRWQ4xj4jt3jGOcVtkrTjwjNSy7fa3cWlGTsjwFVTZ+pJ1WJukih6cS+MeI5W0kfO4/LoeknRJ0WR9YstNaSaNC0/VY5RktJ6qKTqv6QRpJ9W3FGkslJxaPrW9ttMxxUdm8UxqR28t5nrKkXKkh7KHQikyrJLlWQlQ42VY9OZ6iiJUesqqTeIyCwUWy1S2aNCXK9lclRPcZdR22yG/HI5FU+VOpS6NyQrcKtaJLIfa0/xLkJixO1NFnxab/puHJt8HUlqvy2RQ2hF5PdyyFuGSFtNc5DXH+asl3s0OeIqRFk0m33elEnqXql67R+P59tGoqGz5knFl34jX8ySv+tpF4KWxadbXbni71WK2NOLWmtPJokyUt41NbNZfqXrWmW0NEdD3BXUdC0Il0iJe/uVqKpKMB+uKlF1ipOUm9XSl3VL4WXu1jKMatDcZFIgqclnH84XHSOzO0k3FotZJb7TkVyY9D2vV7jJrnFUl1W1sxsrETHxF1K0Yqjbf9O46bjQnkmqO27M7I7j6r7tJrSkNaXuxwdv0TtLUb18qjEtNYlauEBJYidOykflrI+pqo2oi0k9/jHUUQ73WyrL8eh2dG6G7LNCxQmyNKV8RUvD7TEzHbRJZGO/VyOytQVvIkSsu43cIpuEtvYkspRbOzE/mtKzD/wA1F5OG6stSWLSn69RT2yXSPnsnVfNp3S7/AJJtkuB0k9Uyhqndv8p6XJvp3ktEmzcRoVnQmrfvJUmsh2h8TkhnQrKpQ0NlWU21IjA+vTE+P+jqI+/0vV9O5G5E9QS4rTs1bg0SR1F0xS/9Idy4nyNUlvSLo/m21m05Uy6adEXa3/oONyj2ltxZduVkXZKcojm2O2l6qTIvJKRk6noVD3GrSZVGzdPUY3GS9FanJpGNz+oaYkN2TG9KeUWhvnLJy6TMeLkiUT+riox2JUmvDTzVyfG2Sq+oxMFMdQTipi79i+TxY2kl2lypREtYmKaisCnfQ4DHoUUXY2sds+rKseXsOkk0m1Q0Q7ktPHBRtJD27sToxs45z/5yjItp6behaJeqlrpW8eTX8rtoftaO1DUf16nyxLxJ1JRNOEYcpS46xglI7OiiV5XLxlwhqJlRrGXuliSdn5pVTNRUZEqSghJC5EdiqI8pLCLMkP1RkksYyFwG03W/h2S7Re7LTeWlnSiTHd1YqSk8Rqj7PFNKnBie3GU5WqUFFQpmxO0/R0TlcFOV8WT6ZaOhx1Eox3iVTlx8cvCdidn3dQ6WpTaIdfpIcULQ4pupY/Pw2P1fiqRVEaLGYMy3JUoXjsSRagYu20nK2QWblVqCP1tLPcNDbI6VZFj1GGnGj/PTbR7JS45a3eOrL5NcpdR94e20YKQupWWS9fi3GLWb73coCtEZsdIabE6JkWTsuhvVknkPtqxRPU1KPslWNWdTtHUNNyVD2lWVrJJU/ZxOoK2+5JHZ3JxWUUeop2bXiNll29nRoys6j+q5PRLao7TVioxacbi9ZN5Sn6fzpDZk62aqWxK23bSbJaJLaKTF1u8aOhabq0x7FQpOco044VFOM/Dkoztmxf0bWNiW2qOvLSkNUVz68LipPeWqqF8aKkewiBlu+M+ukjol3jZVklLDt9nyXaXiPWqUkhvV0JUsVaQ3HF7WLtyQ6pt3+epPungoI7dtPbS1FSud3Fu3dK97yfKUqx3SIsSUB8h+I7fsfzgsXo7FaMj4yPXxKTGqQsajRVylNQlGVGVj4/01f1rEuiWhM+WmlYt+I6P514+9k0JGmaIuoVZJpJIrEtKN058lW+x8RNCRFnZHY45D1JOnUczoukKnLcDTUZNF+KbF12//xAAgEQABAwMFAQAAAAAAAAAAAAABESBAEDBQAAIhMWBB/9oACAEDAQE/AfRdVXEJA+QTPDkw5rxOXwg8mZJxe0Ri4M29ykd1HHNo2EvrolpYY/Hy8LZcc8HJlUZ3LDDUtEhbKeKEpba6FV0ZP//EACARAAICAwACAwEAAAAAAAAAAAERIDAAEEAhMUFQYGH/2gAIAQIBAT8BextYKngiRWan4n5rcQMWDhFjqUXsRWHS4HePoBgvNRqdh/AClQ86HetHvNTz1o8Z5/nDefpzAVDqPF83KwzeGarOGhdHqY4vWCBuNZsclU4PBgw1fygQBtOnJ9DpMn4oUByBR8Z6w9JG/PMtCLkqmbHoVrPUTp6VxpclFyXKMVQ1/8QALxAAAgIBAwMDBAICAgMBAAAAAAERITEQQVECYXESIoGRobHBMtEgQmLwUuHxov/aAAgBAQAGPwIUPXuTPxpUF9N6YJvRmRLkaeNPzpmh7PVQq5MUzdHuyhF2eNiFp30zMiRkrOt0caQck6Uo0vfRzpRLlI9XSzpe0H9FlO0d9JW60gcn8iWJO64I6X6Rzsd+2mY0XYyKDuydGb/4WfxIf/wtaYiGVkaM6ZSZZOkHyRp/KdbMrSEcGDwMv6krkaI6ZGso/AmXuyiyn4I5Mv8AwnOuDyT6vB35JYlyPsN7dx5FX0MlCrc/j0iZnSyZ2MmB9jMH7Ixol9y7rSmdPpJmTqZBgp6KyUlpn6mSDuIekk0RVlT9DNHPBbOHpZMEnItzsWcEmDNzrHGlJ1pBJk/gWUTsSTyQ8cm9GSNyaJgbzwSy1evp6dHGi54KN/ghUd/wR05IPVlCf0P2erJ2/wAOw5PA6/w9J+KP0dvyTgr7HBZC5OlI9LocO/8AC9hNsaXUvJmzyizJ6TMFs5IXVKkkT20paIsXB1GTud9JvTJRKwdtGYK2KJZPSRM/BOkQdkYJvTf6ngqIO2nbSNmRsNKxTpVEi4yPTCPwf9spZP5InsLRnfkc7YJdohZkgm+TsQJUYR2PBWx3LyWhIT6V5LyZ1j0krJ7mlRXwIpWSyRNaRo8yW5OCH9f8PcOFlSY8aWLqTJLJ2aOnyeLIkSU8CTONNhZksfJZgqyxr5Lr9Ci29y2qH0uuDGlkxpmyMo4Ra3LelKhvsQXOi5ZbOlKiyIM6RnS3fbSkU9PUrLihdTWB6ZOdcGVeUY0vRozhGLMyerp6fkt6WWQ8Euh6dX9CY08HbsRuN5O5diuewllEIsdXpOkGxGktmw520ZnyUWob0a030TaHb9RSKwMVTJLcGR9ilWlbFYMQJPcsbk8lfYs86J/6/gpWNzpn4FLwKdI0XkTaIxBLJTMmCtPbpl52I5P+RkjScjIrTJjSiCHVCIRijPwbQRsYyer6k7rBODJBZCMpisrR9hnk92BruRONF24PUemWMoycjTO7IGvtpwiFg+ShdjsY+5gWkv7Ek6fsR5IUGdPtpmGWfgtsmycjKuR7kye07nL5H3ZZjck8GHrM6fxOCHouBNGTyR047l4MHY6SdNyepbYKyROiS2KF9CtzzpLL0Z/xMEcGRRp3I30SHwSy1pWChNuzkl6dvBwNqxjot32J6c6KWe1l/OiiS3Rk5MSXAkTPwULk7kOtMnqUHciI5LIJMaZK0emDsVlnvycnYewsSZRO5E0fgk9Wkj/WvgjZacHuZCENxBByc6RBhi8HcvSENvB7UL2kRgl8nk7in8GLJFKsaWd3o0uD8PSiRe1PTmBkSRQxPB3IaE/oQZ0+SCrZ/wARxBboodkl6tu3ud9ef8YitHvJ2LOrgXg3JbIJLwYOpbdiXXJ1dJkxvpJ6kdyMTpMXpQ1pTnwWoGenp5NiIKGpIh/B7aLyQsH2I27HjfT2ojf/ABmDg8WJLI4sU0fsvYa4xBRgrWNxC0s2Jkx2L/BB5M0SKdHZZ2IlE4JPcfAl0lnYrTf6mS9yoszGi3KIF7sONIHU6USy9ib0yLaBH6LZ3eq5ejsfk9v1OSZvg9W22j7ndjRGkFOzIj1bHYfcaaILZ1I2LkrBWTtIlZDaZK4J6iMIu+D1SeozgsujmSJPBdaQ8FuERszKP49JSLRKdGzHNoZKZGwmv8fwJDuSIIudMtvTtBH/AFlDXT1fUsty2SjH+DsRKHuT6TaDZHcZ5O3+DeC2yMIyRtpyxzpt9TseSvae543JR37F5I0gfczEaVsQQzDKLFZZwMXAzMzg9Rm9EyTHg2OwowtPCMrS1SIL06tP6NtONM5JqCh8vk2Ie4lgSeXX+ESQbln4MlqRQdJ3N0L0i23Nu4yz150nSi/vr6oLkfpVjIWD0mEVk8ijYp1p3FNEo7mfuQyvsd9JROk4JjGkjs7kNmKwJ12J0jgsk6Svuf2ZgrTwJ9QxLWxc76SJfcWy0/BXV+9KLuyYjSo0akgwSdV7mCMad9Pcx1pCXyUIewtyrIJ40lFOysnEEH9FLOjUY2Z5JsWxEkFE/wDUNxEckwM92incyQh9jjSTfV5T5KlSenL4PAz3I3RkaidMR4HFm5A6werYT2M6enEEL4G7MyeDOxPVfwewjlFMgc0SsFFcHAi4JkspH7EbFkfYp5Nq0a6vjRrSzvOs3CPSJ8lI5vJOj9Rg9sfQVjW4oGSJcFwR1UdnpnJJDs9PQ4FGxwWV1Jnc7EP+PJ6vsTRj6n9HBgpj2MkvGBdXTKKM2S9I+5f3ERH0Igwenp2FI4LL+hlo/lrH+F6qMf4/BCHO49EjyQdh8kPL4EocmZRdnZmBfeiXuhKTNlF34FExpcQU/qc6OtY+xXTHJVl+dKyS1p2GxX3I4IRLPGjY+CFTHGnScjomRrc+D3fQpisjccng+xliv5PVZLKx3Jgg6ep5No0+NLIJWmxyiWp7k4IVdKJahlsdG2kcay6WkRJOCU707vSzJ3IJsnsUjOlC0uxwx7uR2KakzC/J7S15HPOkm+DBDg6ux7pIiEWKiLIJlkMsnJRMkdROwzKIgiSVvomqR6kkYPOrkySzuZRTheCJP5Eu+x2MwyXLo4J2KdDO5JekNG0IxAm9sjStn/IS3yzA1uNQWjNnHgpvpIK4oY2SiYs/AtKdCdZsssqyHklkMVXoh86VcjjRpEI7av8AGk5IIaMeRfsaY9HPwKZooUmPuUNYRK3I5502I6djpfTv2LPJCZTN5Y3/AKknqMj4PTtseB+CJPJAomEW8YIP2SQT9i65Z2IR6umzGnp0vJzwKfgo8ck6StPB4FuQepzwQ8C21oVQV9kR67FGSU6P5VyJDkXciyi9icJk4ZyS/Uz9G5ZToWSTNlnq2HjSSnA4xiBGPuOoIOwnFyZ0x8lD7lnyR9z+JJyWiLXgnBedY02s4Kdkz9h9hfodX3HO45OIHAiHnTkUEbnpVwW/gQnI31PSPsdi8GSOhlXp6dKycG3kzaFAn0nbXeDsT3MlomzfTIk3p7mQnKMGxkzb3Hyy899Kyh76KyYP5fAzJg7nuOT4GjFaUSjqT3Jl99GsHpmEf0jlFfxMWZ2IwX5IiFGS3k6lxpCE4yJRMmPA214JiBMefgs5LKIPc/J7Z0UM/kzvpZekUdiUm+w06UmzOSkLTYkjaRSyHzJ3K2yUo0vYpSjstMC4HDF7XJxB2V6O4IKfweknDKgamRx4GS0Xg7ExI+BWqyQdzLMwXBb0uq+pO5ZZEnpxAkvuW8HYssvCHBKO5mxucaT/AKj6cClY0wMgV92Uys5PUhV8GME/g7DJ0z4OuVWkZ0oRXV8EvOGMmf8A0NQSya50zpGmclIrSX7WtM6Kdzhncp2WcUJYJ7DPJ3LPG2sEkc4Yjngl6UzPgU4FzpRI/aTJhlZOC/5LA1hli6tzOfxpQ/VTKdFMznsQlJCO8Htf1IMlVr9yXjSdHFiu9yzOko5JnJHYl2Q1BN/Jk4bP+0WWymvk/RFeCqNi8cQXPkvfcSmdIZeCyDfH+HEHwJi6tzkbeYOJPk3SHwfMGWpFOxeCx4jSVBj0ihmDBGkYMELGnkbVMzuO/BavR9EEQxZ8Cl9tNxnyeTq076KyLL0mMmfnSt9KFYpRDQ2nNVp21bexUwQRpcRsKVZGj4PGk9zuV0kRn7nV1enc7xTMkcnpEySUdxPcTHI4+pb+hjB7ivkTiSvFG4uCEQ/qelH3M/AxuRrBkxuSz1KjOlEL7sog9USOEdxOfqPuekaSyxxk7ELY7lndnoiSa+Sdu+k8ibLyQxorJ5J4LSPSWzhlKjtr2P5IW6KMR4LlNkaVjkljWx+jpb5O4oF9Cdtx0TBCNyfwNbsvJR7rIu9OHplHaNKGUercr+QpPTQ7J6cHd6J4Z/RKd8FELyOz9kPcsnKPVsUqJjCJ6jwXkvkmKO+xc/s9MsXga4wd+41MvfS99MHkex6vqdT2LKrW41r/AB7Ii/J7juRuWJrkYuXR2OrgjTJuPX2wYuCMdieGITbmhCayNbyY0ySyMSR1DQ0TLOw4skoncjEk6Jrcxo9hcC5ODuYyeBnu+2ilkDa0jCFxjTkxQ9eqdImSR9KwbHqRR4OD2ui3RKV9zNI6Xk9u2llI6YTsUsZY+OxBtGmb7Ep4PBLPyOallbFD7j44ZhEHB3OmMaV8ihzsdyKIexMQOC9X3217kZZQpyJ941gTmJ3MdOilsza3LonT2GCicblr5KsWzFSJvwfgwPge8HfT8l2VsR9itii7IWMjhjfY9pW537HK07H9maKElkc6ZfwU7Y/UP15JfV8GaJPg8D2Ig/WlUc6f2MWNJbPaxe32s6nwjuR8knpdDI0h/BAuOS2S7JyzaD+ih9Q56WJtaKMb2QzjuduwuUck/wCsE8l54LZ209RJ6Wtj+xUUPqQulWtz9aNM88EKmOVWRay9tJzGi+5+Ndj9nKO7IlI272diqKejfcXUyZmeCi/hjzwNMXqjTix1XBKTOU8CzyWjM+S4FVyWc6VbI3R+CWZKKZ3wc9h9Kong60QpgmYIR7isaclOtPGjZXyf3pRfVXY2cjJ0R/KEjGwj0iVwv8IfwdMGSc0UqJS8oUs6mKYagj0vBhlDe5GSbMk2elowWjuiBqHz5PVyhT1URZ1QxojqdDyepfbRy6yUOj314Nxcls9pAmXPSeRpYSJ086T3ggReiGZKxvpAup0SVazOn/IUjshUSzsOo6vJeSXBOWT1VJEEPc9RKwN5FG4mt7JZCL5O56sM7E5KNifqbJ6Xguxvk/RU29y7FUHq3VCeStO2wpQxvWrJemSP9dF9zsyyF9DBNk8nZHtelm3qRPCJ2F+DBSlk7saex7lXJ6mnjJyoKQuxcSfyvuTwRtuQvgtkcqDJPIrMX2J4OpolfDHuU58F6Sv/AIQ+Bcjh0KC0KLEpK0U7kFsfTsQYlGdZc0c6cp6oi2W9F9Tseos9uUiU4a2Op7jTR2Gjzp6efsehsg/pDbvwYIhT4HlF5KGLYyWyckqTBEEO/wBG+CD1M9PPGkP4KdF2Lge+tkbi2PdL4ZY7MkTetmxJgquk85I5FUNEH5MQZocnJ6krJJGuSiaF3EoG2OqG4wL2kSLYTeSienJmz3YPb5FyQZs7j/GnaCHwNR3k2PJf4JOljwpP0QOLPTEouiieDBvGkGCvV86IwYLMqDhHPJ6iOTwT2MH6JaqDNH/oe/gojfkVkt1wz8IyKcFkzgS5R2RdMc+CqMKtzIpK/wDpf8id4E4s/J/Rto+qxuaJkbnbYTtEsUnuk2PIl0ujsWnCL3IeBwTIp0xRD6bES+rwhS3JybwOOm/uTh6Q8ck7DfIqlFmGPpIZ27CE0NPJBLtHZCOxfuKM5M0NErJZnBH3MmDuT03ZK/8AhDW0GSR7d0X1WXjwQvgrO+nu+Sogy0OhN7aP8jqhi8EtEqyGYKR+2c0KpPa7Pd9DHyTsfA0URyeD0wMglNGzaPasjMTZ6iWcoS6cLRtJ2R1dP1P4/A8t+SieBR8H9DjCKH/R4JXEiz3Pb1Im0btFkOzPS+xuYf1Nkz2P4GnlWQSkTu7G7+BRyZMwVaeTij0lX1HqR6VpjBL6b5KwcnyJ0W25EkPbuZ+SC1KOYNyvyWOrE3sTyU8kdjBMW8kckK2xTBWxbmdiH9j8C5KQ03pmGL3eSyfnRQo7kYRWdMHqf2HUEOiG709Ss8kSKj09xLfMCkmDOCILTfclfQd/UjBHTgTbh8FW+5g/7YuD0dVmGS8EPBn76IamTIpXkh4GiDJ/I9X2Lf0GYcspi76XknBORNO0ZwiW50mTb6ks7mTJ+iUe2yy4lF+NF30jZntwVnpPvIpZRwXXwfynyclDjJLh2ZfgXpadWdhbJ4ejUY7lUxOJeiUGbI34Iwd0Siuof/Ilx20tibwVueRpbbnT0ik3knJS7krTB2ixbNkxjT28iFaXxOjmx+olYLajeSiS89KOzPbNj6WQhPdnJPSYgjYS5Z2GTOkjg/lMbHn7GxR6VPYZDb+CNkVU7jv5J4yiFSZDWDHyUUOvJKmTcjJYk+mSyfkjcrLPTwKLOTp6i9xTc5MqO57bXY8F6dy7Z2JSOxm9MkTKZB1LjSi7PTyeBR8E8EyThGa5OqS1gmf5aRGRVkc2W65H0yUiiVg/R/2j3Gfsbyt4olL4JOJ7ERI+5tE8Ht/iKBerMEHuE5PgR3QqM2KYnSGykOT2/cfpyY86f0tJR2KxwWdyUsjklydTUWcjnRtrwcaUOSKLY4zgshnuKSZuxxM6bopE4elZ3Im+x6bmT06dz9n4Pbk+5+iV/wDknccFRwTKgzk7mbXJDR6sIjnTJLZMjf8AIwpOCDwenqbrcUe5EaQYPJGiaogaVES6HSneC+RY+RU4zJV9jEMuzMWSfoZY2YsV5HIot9hTuTrf3Jc8EnjBZJX108m5Q265PaVdjl3FHgfpojJmy8De7KONOxUwIw4IyezT0nkzsZ+Czwe1QY7GMbmG+4v/ACZ6RrfYzudj+RHUydWmOD1HnR2T1Y7aV1HL2MCciLyT1fUhUPSYJdD6Vk7l0edPailZDKRBifJLG68HZlLJkkg6mqi5MQPp6lO86SiuCmLcpJNHS+ckRLGnlE7Cwidj4J+hRQkxmxiCFkn/AGH/AORHBOxE+CDphr5LvuO6gconZHB7T9nuslKiSPqer03wRUEkk/cmJ8HTUdkZHJx0ijqoxYtPI3Y+xJk57FYF0shRAiOn+LsUZIdGTwbQeqFJLQ8SWWyOCOdPTkYpjGxCiSBaWS3kk+aEoo2+SaEl0ofI05g7GO5Lrct2cnbkkTSvSWOILR3IJmxznY6nQ53JYmtiN0THwRtkiJWwlaggjgnSDAhlk7lkkT8n+09zgfS0NC6SrNjFnzZ54L+ghJHbTO5eSCfUe376VjghULZjoXShPpwRLtlbCzW42ogvWCMDgqe5eZMUQi6h7nJ21vjSvsLqagn/AGJbzpHpzuUWrR4ENZ1vBUn/AIksk7nrw9FskTgn1QitzDJ+rHHGkuiiYEjb6F/gkfY7GYYkT9D+xwZPkh8HuMDenYozuKckFjG1RSOSCYwNvIvUeyy8nY6exRnxp6iTtpaFyYt7CRDoXBkss77DTPSdxKjq4kc6/o7shPVkJC9piFsYscItUjyeSCj9jgTZ0vkcnJiiyynpv3J2OCBzRKwQfyQ/SWth9OI+wk+q5HXyelbaZIJ+2nyI76dyKPdg/jBQ7+h79KmRd9OpcjWGdO65M6NNfI3FIl3RZOS6PVsT1H7I2FGUQkRpRa+pWyFUsrJeRPXHj/BFMe2iklUR0n7PVkemNZwSSLufGldMl7CMkHpMEaUe0sUSn5MWiqMrTA0QtFr6erTpW4ttJZSLPUy/qTnVrsQ9PbMFZEUUOj+iDMcFdMIUslf6nl6KGOTByeB7mPsKTchE8D9SspvIlWmIJZ7qe3+ECTJ2L3FsKMa2yNjsbRyVjWieoo/9apLJ+ijhjrcXU9yYIMyRuf/EACUQAQACAgICAgIDAQEAAAAAAAEAESExQVFhcYGhkbHB0fDh8f/aAAgBAQABPyEHw6OpXho+/EuUDjriYg2MQCu19zOPa2poxY5qYoP0/cTMqckG673jmcJWtN/xKEZeMMxKN5jSwnOJsWrcQzDAiwGW5ocDGpdc35SzYGeZa3gmyZFlJmeLuEDO/wBTRmXlKSvIlIyeMyuPawzBHGY9svJWYyiW7MW8AmwGMYGCl1m1Fa6WiMVPgxERPFVLm23XfqJ7Bdx2BrFVC/GMwKH2rbUAaHhC1TTCOXeCAoT8pg0pfoj4qHNsUfAV8ymcb4cQAlBtHPXOfMqywde49mL4mlbDVQzEW7+YDIgZGKIPM5uWAG8OW4A73MKzDslnZrGgiUZSGgcQzCa17jvgvuUVSRNuBrxETViqjVlWzW3zOqGynmU3bidq7ODtNVuOMZi2lF+bJcONXiIB6txLgNCNQubC9xAvBe4uoXog4za9QA5bq42xlesTIGrD6lFS+f8AfqXxWtYJSvDOKzNmzy6hRe85P89wavcG8a1AIxrdwoytoricJVrLY3An8ERvouTl+YXO7lathUROaYxuUY6qIKYcbgpYU2Gtwvijy7l4ssdDVZxie87jrl3VTIe/ErgUGnxF1AlZaxEGaHOb1KIB63FRQoPuAOycwKuGm2Zhy7MwBzseFTIWY4Rau92ygN5HcVB7PEHS35Q5WwXkngXA6IuinOSArFn8Sr4f+cxgOOnia2zjicAterlihmyCNH4iOhS+YY+WZy409y9lrqrgheLYajyBuo03jhrCyWHHqM5tnEvgdpkBwLwxMEAPfDKKLY6RHfnWqhydXvuWOA8NENDk7uG8hxqbNAM1eYmTV5c6l8i3m+polpmvFTxHGTmUayeMwFZb24JTTBM7R60WNkbOKjhjFl3FIuUH4TCFrfyl1BtBohxppxMQseWXKYv3LTseZcMtfmBzXiBYiT0db3BcgaGxNxxyztlxyj1ohbThxFlVt7ilr8Vu4Kj1lCcluBmQImu5lhhvUE3WBzNAVRvUspFoeCGrIX4COCg8kp4lyUMpRo5pRnR0y+LGSpjGkShS8xXoLuYoWHuKUMa5g4Q5guu44lNalLbal8lLKvU3CYjEXvZLZpdIBUXXHcCZFslQIDMaML7/AIhVWR+I4cey2ZsGDi5RLO261CF48MPhNrcDEZdjM62urmJHDpKmHZk8xYYPfcC3DtBNLjqpeqYG6bqJa6VaZMqaDt6n8lINsDzzuZAgxyfkvUQpFdw4ON3B23b+KjVB9tCapgm5hW4QfDXjmVW7rx9vqOyDj/kwUfPib6i6iKQMO3PcWIN3kEC+R73LTY0iAwI+WUpqviOEcgmuJxNq5jm2acyklZa7lqoLcX1GyKztTcXudUOYKUZVqr1K2LA8QKvZ8kpTnHMhBehQQz3OoFZOswiE8LZo1WUFKftLg50wpxPca1AZxMXH3Lq61WSZR3+IoOhTMFqQ8sAMg8L/ADKC6X/DFtEKDZqA4BT6grLWeJmrI3fxDQ+J7gDX2xFzgOGceOuojfS4qKfNRGvLoniPELrH7uU5Epz1BeF+oj8C3AomzzAxPy97ipYw1XMDlm27iQoqsZgzjlonhc6Qgnkv1L4NZWFyfksEhDB3N7xKDtuHoev+Smu3AJUqw9QbNFADKfouf4C4W4jrqCVxu4WE72YiULoEhv2HjNxrVQ4/qZjx7lWjaxWKVDY1l+ZmaHjH/YGFlvMJNn44lqUHLuacLv1MDXirqNA0+51gxNpbce5bReDd9xEiAzM24kKW2Vag20mqg9duH+JixGG8rivKodMXnJmHKP6EUvVnFktVHXJlgMd7jyvCfhijE3/v+S0KdoIqKGjplo9d5lzgFgYQNPNnM5zkWLuALlsHzBW0WLxHCXDaahufFt+4SBqfco3shAoKDjawT4+Zy4PqUEF8bZQ5M8xRnp2l7hWVELBs9xsM0WhviZaNY3WLhbn3W6uLVTTBUUBB2D+oC7tuNAellzQIdwC8G8ViY6PV3coUAQx0S7LVZomxV1Gy2F7g0WtwxqNvQ5j7rlfcaiRYy6dlYmUVzmuO44t4rM0NlolAvQFqpvP7IAFq/EoQ5OfMUVRrqDlccY1HYq78RKoMj5iOHSl8ahtdCLHo4nIhkQCq345i0m/eWLncPMsKtEv5i3purlFMh3rEFg0ec2QaP4Jn8Q3Vi42mx9YWlZ8SrHnRhcmVg2ABhcRHLiLqszjHZ1Fy0xCAYO5TuHC/xDdHx1LBeXLi4jjtuioOT5aJktlWQHcsKvl3NFwnH8yhZfeetTSsj8xWAaMPNwYBfzLXyeZbbBwe5VWo5Y210tYlVRZr4gcDRrEagBb7gbB7UY9Qh+OMQw5afiCScGNkqrRbVovYfh9zKlxqsVAv2vU0G61UaAt7jWWZbrUbY7hlNLrisRUMPZmCwaOTMSHGV3iWtb8y8mQrTmCwwIioHa/24oeBruZVot0wo6yiwa21MBXD+ojAX5JXtvaW8zk7lUoONpyAsya1+Jbgs34mCud3NBPBObiGQXPwOKJlhZjJUpFmkqqjRG1/EUAYrMQ1bWliXueGfMVqLDMdsNy6Q/FzGqKGMDUpkDgZuqyc9SlgLOLzFVU2xxGwawdyhG1UaZXhRjWWZMs/mbKyvqVFm/htjZWa318weljQxbFbfxKaYHNEKDaDx+oF4lh0US7IkrqS4ZpJlxqqgrbLiAwvyEuDhXMCjotNXLNBfN3HCo27uKNY1mOEdMnLLMqiCMTzCqHUjKFkS2BRvlcV/wAx13OQw8R2Do3uUTTy/uVcOwYOZvpxM1vI4zhg2rDepmNWdI8mnEO/5yULr6ZlD5XSsx25aohdkym1RbriVc8dBLGy3pxDdByDdcczNMmZsfy9MVNj9y0Mqq5lskz1GGyyvcKOx4lh3HmXFUzVw2XaFOB6g3YaCmLeA1dVL69YzMuAdNoveG1lbpdOdRXv53uLcufUxSUVyu5S4Ug4IrgTmZrFn7hoYu+YuV4QMDDt6mgbzMnDz3GY8cEuCejxFVuc8yxQgGeQtXqDi0r8IUC2jNSyVTPOJckRoK8dwxKz8INEbPYlFEtuiUSfvLuKwYyxOd1A62ubrcqVyM1uViih7a1uoX0FTjUvLDBd+7EWY3FL9QGEi4vmBoL0e5ajyG+/MtrbZ8SgWzh/CVQagYO4NtjHzDJDn5i4cMuO43gU59S7AApSOZ7zLUbvZBvk+n+oWjPe8an7rqCOa7X+pkBRcksFlrpdf7mckc6mLVRtmLAVxo5jh1z3HuCK67/EL4erHUQbG+Rr/ZmhTd3LSBBjlq74l241xGQYwQOdJkFzlyqo5lqjA7l0Vk5lYznSJoOQ7/3+YAaVH5lGFTzx3GvGzOEHNIeIiBXoH9MPYHrRKWcW8JDRstJZVY77lDl7E1GJgc2ThD0haVBRh4P6iZcq0S0G+TF7K11Koh6VBreHGpZOa1cV0CiNLCyYJdFfkm2cvuW6WXOYl4keOoDg16uYagXPcDs72x2LpfjMY240agFQ2o4Sl38hqYNsvub3l6XAUGLdRmwV3RHdO5YNU5hqkDg4TA18J7TuMDvcFqGF3BFxOXtlhAsy4gKDbgsQFHukW0OLiepq2alnj4m0qYoP6ZaC4fNzxE4uU6P5EQU3ucaFYZYeR7lK2VbUu00XzBldYamQfKamFmkCImagHmdw8DFi9lkKpZxjncoUSmLzKrAIYU4rohsWtYj1aXgoTOkMTOYRDETLpjG5TQCjlxGrhWPaX+iW9QVwHogDaUuonOiPEwTa8rg0M+zUvNKs3moGq8Co6Qp5iDKsY1V/iWw5dbi+w0dTJAw34+JTweUZlAXnnO84YLit1nhfaob4upwueb3CG8uXuWAqNJ0yxSkGSotFK+zEBZL6iNBDzNucM0HjVQupWuOo5Hb1LdMVqBXT4/8AZUcab63DWAl1zKyXH+IKKUw+IY5NHqf62INJVH6Jn8uTuN3fCv3AWTlxAU3dXcLKMQiNHl3Eb8ZpBWO5VlHDjc4DJxCi3kYO55zFUHbzUNzR1zH99LlWsi5lwU4NYgcm2ziFNxZHXkmo2F8eJcEWwDNAK5slbgAuZYEsHEB+1ZvC13MAl25jbg/kz1aZhgBOkdwURfnqWNfBe4i076mQWTVZLLuS4OF2OeZYVbQV6eJn3vcFJGdMJtYp7lG8NQRjD2RwJcMIdEP2BmZuLH4CLSuJrzRjBGrk1pjSzkYzVSxQb8R9/IXzNcWPESUoPE2KuqTEHU11NoIxmJ2sDjuZUs9zBmOkV1GjJ4luatJNQLK2ywtGtupdNKs2uo26GiWJS3hv/bmotOpQGUOqYt0E5OBX8xzxOTMLWNGrgWMrxA5co7ZpkWp1DOHPbNQomK6GZasu+XEErB0iUxd88EU5xdJ1MTO8V+5dmWiP4mXuApkzsmXC2meJRc1TBHq5N4xkhQrtFFQ1kOBTmLNoFXPcFqMNevMavW52POYVWVc5RLZA3EmiGop+AQ7EvPphtHBcEL50OUtVrTq4GrmeogFGtX0yi+VdNxhAclTThut3qZNlimbC3BfxPb93RLgMnxmNW4rFsxFDG+UwrhYx/qlZOTFdQpBKy8ywrTqtyioN6JWTLkgHbVkqIHlEMQFc3CsIruWirg41EmC1sRSdrXhFRUat5TJl1zDVwpu4F8yFWbvW4aDLfzAUN9TqzNYUT6+JSLT2gO3L/PxLbDzfUyU3fqBZRbeIClA+ENm48JkXLoqaJgaxwRMuB9xavGCdH0Rg/wAl2xur4TR5j20lS/o29QmRamczFQ2a7lLTYdhxEu9HmAuxX5RGlhf8IN4OfMQRq7wfEs4nOIpweCAt8cnbLFiDYOrvOxljcjud5nAz2dkyLAW89RYirddEFOpXECqUZRPsHMCls8VNkqmb/iHAxcTDdXLBdnj+UtkQnxEHiIm0FNop0tpmEvHOo7oULx9TIrnnzMsSUUNS+1g4HMUN5FxBtSmoTEBebma6aTTG4Vzn6lJYHniCtBrkQpbIumWMCjz2x/SioVfp0l7G76l2l70sy21soziXWfRFetlwHB16mQDwXOhcDuHJHkJVOXhzBQcYV6yjmNqxcoG0gxvtMk0WF2S8Kq7BmCndQqos8xePygLbvE5ifcp2mRfjEu9N65mxVOM8x2ra8P8AvUQFUc3EAMnpe4GsHXbKrF1omfyCS9zxUQCL7lomhfjEcgN7MMghxK5FqWG0bu4jrHM0E/y5TjDg5YxLIYDiOWhcGZ2VcC8GXmpjimWMczAyBavmFYDOU54CYOzUtQPwlXKnLzKOznf9wW1P8pTjodnML9r5HiaVGs3eWJTogPmzTzDFKv8AZlqFcHNVKCbR7D+I9i4CpQxxG+UnOOIaqcc9xnJt37hTesa6lbK0bqVKlfcXRzi4cOjEKU0SmBy9krCAh1Czb5OZkwKTUp5A+4Fg5r/ky00e5lJVp44SsMqqvU6hxQjfQ1pJUyGgSxX4pTe2It3V41GY4Iab/iPALzqaDxNk45iMlhyzRWHGDmAj+CWA0mfmBgIj0kwcV2f1KLi73ppqAbRhlYjXIuZeNlPcsTfFYqUwLHMK3F6OalGREsxpjkmYa1coUHtLWHB3LotUzXJd8y+xrmuo7WanDSMD2vE5rpzDS22cQHEAWQiwfN8ysrUBh+/BFY3HOZrUqkqvKnPuEaivyisu9mbzCqhgwxlwb4eJUlhuyI6F8RoX8HMUzx8cTbgdeZmwYZdDYrbGuf6VDNMN7v8AuVZcn/EQBoNN7zE3bMl1Ah5UfmBw45e5QLHxGuYOb6hXBw5lu++0F7OaziCoHTiJUB0YJ76rvc4j3DUpA5qaha0d8MbTsBl0jZqmJvAzpjVG69xYHfES4TU3uNOluBQoFzbAo0R0rLqYC8r5am32lsehyTNWideZUjfwJlRp1j9zble0w/pRQhV2wDRUsh3XUugpV7lGsjzB5Uc8xDNMu88xVscE8ChaHmIJbqjmJFdoAJFL1mLAG/8Af1Gx7cQpNg86gAgs/ExFOe3c8xXSfChki86hReyz9wShPK9xfbo8x5BfCwOSodg1NwBfSaNlhmszM0fwStbVvTzKHZrEsCpBhu+YG6rbJbcv+YlAl8zPSK+Y4Tl2iBa6Q4DtDyo6SwUgtXAh2oz/AL/blIZGFZVXqcELcDuMohutUtlIanzDnTzaBVMA4nmuecE6rPiADwnMtk3WCMcmM1oeQx2Yx31AprwXHFoTjmAC5K0AzHJ6pJlVAixXZ5iFq3EAmqrmLy/LzME83UK8oci6zxkgOLq0rLPmouU5inO2Y8S75YmCOxN8JsF3rxAA+yYdh/2XoxVFRCq95g3kLHBNtoVDrZnOep8CciPMZIZSmVsNcY3+Zg5SHNevlhgbcXmFoYZ86IWNNm+//JZqd45ZyxdcV5idC4o1cpcdBgIuQv3Ct8NWkEDvxglsxruBwz4Ex8PDLvTpiYhTF11AfF+o3O96fEMxKDUpwwLxcN79ygKDWxObS3v+I8z/ALDkaJ4qXoF9mIVajEoXqtVomkBXyjYF0XxKpBYmuRWHiZyNe3MKoSh3LhUTxPYj6EyFD5QF0XbwyiCIAb+FXFWCMYx9SxVTxELCxuuZnz56xUwWxc/LLQJ4RvMbMpwx+YhgiMMqyMLrmKAXWfcKR5DwQTnK9ncuguNzKUQ2rmYVjtllZHreZgi23X5gYOxCAKzr1MZK47hc9iwMQZKd5i9g414K6qChKInc2AfHMsD5JRwPEKI7YSODijATEvZvJnOIHgn+G4wqV3uWzKFvY+cy+ApbX9RlHR4mCc8ksz4MrG2cUqydxRFuvLPIObMEsa4b3M2tNJehPhmTg957lVwxkLusykhvDe40oaXVQwPZK6OXGoYdhCC3DlzAKWPV1tgvO8WkL2xWSUmz9wDQWaqoDagdwTTSbStEaTd5nokceJkMnJ+ZgxkOUGRoYhkxRXRsiKN88wPZophxTeWWPg63MLrWr8zkaaIYCn+jcCtmA2S3NX1Bb+gjpKZziYiO1XB2rc1K5tGwJ/43KL98QpUrlDczQj1fHbLRtIsAjGpVULBlNQRaqaxfExYxW63ELhlzUSqcv2mHircsL03gjjMK8xqjhuZFbHXUvpWtVLI4BiZMBydRvFkGD+ZSc2M1rESBUXl4jVQ2SzK27IDltn5ioUVtFjqRIfIPCxabp4tuAfDG+lf8RaXYF4NRP/AjDSndQHDt9z1B1h/AEqFz0uY7pwUlxLvtLdaJbXPzcHLwuGi5cXlfEtRrHPJDlUThRxwXXrmFyIrVuiZWBRnEFeocssjvqW1g+6jRNl1Hdi0Zm7BfuZDFXqVvlsgVWb3ScRcFhdNh6YNMbPliEMn+I0bnGDN3Ki6t7jkl+XEQ7fMatZrHU7T4qXkWzRnDPcYEzfYyoAOGpfq1XqIYKrmoDY0cE1tbGdWwYvmOHIAr3MC30OoAfZW1COQYlqqqq4HPE89RooWH/JcxRcGdQDgHZ6RC4DAGcRGhe5Th7LmaG07iVO5xFDQO7UxTscFTJs8ohwVClcitd+YFL0njUKypkutRJ4s4bhq06mB4fhAgg0Fmux5MKdqbHEWLpfEpoqHBWpyUhRNL44/1xaxztVZmA7TUbX5OmKgcxhaiyyn3iZXRvBFdnMWmct8TFGG+ZkN+N/xKtGXqYJS9Qg3qtE3LX3MVXpk3EKAvTL25MMotdKzDTVtWIbi99Jk2Xx+pXnL0xShMNd5hh6HU6xaz3/2E2WnpA1nx6l22FCZT6LGr8xIRcODgmRdk5XlLBVe7e4tFtYrqVUApEqscYHVHvmDkZvaL0B1GaWpYLi41fMR2M8EywIDef3Ljx8ywVOlNweJ7FwysqX7ljPYlNQckKFq/m5d2p33Bye1MoBk4KNf657jBriHAbGCSm933LJYhitSxzvHGyVzYcXUR2KRwzpF6sgIvxfUpfOBrmCpbPmMjrq9wXA74ZR6845hqcmJWJr2uE2r909lsPJbNcDLmVaC6+5xXl2av1MEJwzxOElQKE/0Yrs5ruFLCOHcDBwfMDNU88zEtXMIAk00VzpnLMZzMX8mszF2WdDcqOnNtEC7AuWtnzBVzMXCsWhhBao/HEMAeL+JY2wXFzVFXuZC4puFuc6OI4ODMTNK2vxAmQvxqG5YSi2F/NyQCh3o69zIhs77jYivE9S1SVFWnWpsh+JbJX4fzLhrBmeRouz+ZUVL3m4h4ar3LLyppOd68S/8A0lVEnxE34mvERNXiMhKu4rM0YKczJXrdJ3RiXuXlTUpcTMLSqHLM0pRnxENBTC8XPRZv1OJPOovWRWoGNS1m/Bf5lkBnkmm2fnUOi0jtqUnuEsyyfZEDJniYcbuRuUKSW1UtVbcGbYtYWgqY2Kqppc0xXiBeQafEDynHcvSx8RGZ8+3f/VF1UOarDBDk+pm9Mcndx3qs5q6giZEr3BHt1MnYlRCzwJtd5HNcRUb34zMFhdThvqXB4CxqApd9DGq5W5rn4haV4jFoL2qJhsc4YHuGFmXgC7xFRHHb1BwGOvEEUrffiOP0mx0G4RpZHGJjcB4jbFXT7l3QViZONOSOTk7YWw48cTIja7Woho/EtoUWszjHEc1IvZMmTkoFxywcY7QXQahz0NV3z/ENdg39yxottQ2ioy9wEuiVq5YvbqEG8NZVxSUf5lA8BnO+JdZH4f8AYIFkWYwrdWS7yMW1zOA5bnlYz2lSlnMLRRdoQ8wqvMsF70tSzRsmwyStgycvMsZNOL4l7DRzKPuSK2bQuWUZXh3BZW7Zi0nNEo3EOh8u5jUi9pfbMR3CSpgRZdw2HBxMRbnwlNErffMVxvZE3NmyYY8hLc0aOoUm7Wtw/DG4MqjVAZqbWXHuaJe9Sty7q5UUb86gBtXgSiiI0JdAy5FzMdpubrja4VuzfmGs2jz1GDk5wZlqaHPJqY8vlNCueQTDCw9xoA443BJuHDMNALTvqLmpv7lmiZ1uXpf5lDIOZd0DJcMIWhw5+ZlnlJhseXU7RbmrqUAvsrBug807jqgx/v5ioOWepZwZZwami/O5gs3p9ZgZIcJ4lqtM4uXitlv1KM6d0xWZET8IEOBX3FS1iWc6GackO0vmIxXR6hUfNHngfcIsa1p5nCANrzKbM+bxEsN46lkFWpeu1BxEvHGoS00b/wAxHsaitxpkz4id0fkih2SDs5LyTOZ9QRbMILO/a3kjwAvSNRyS/mdBrtOinDBvWFY9SgRSrqChKw6j49mCqqCKHQX+0KDiLWXBQWsTYW3p6mDLYYvUuvQuiIur4jpQHZ7lbBdiq7hhwe3EulvwipR0/MvLzW2FV3V4MOC3TI4YYTuX7qi7wwtQNRPZT9wVVijeoHUUYumoieTGZnpOPU3mHVepkZzyTAvA1BQVRV45gTQBvHXiZOi9mGYYd5s4hAyeoBnWXmZ28mpWaw3iaIC23OOI4nnV6jgDRMhVL/UueLi8MaFX8tMoZbLcMvQBxCqjAYvn3HCFB8kWEoO5pZzmohxi+ZmwEBydxwjl/SYJ2KVd2WxvUuqt1n/ZhXDjoMQTGNcxoNK8jFawfcspHJcOBWJsAXvmo0ovJ3LY7wItLu71AVevL3BRMjaBaF6jcGl0s66RpzPGe4b1KKzMLa8PmUGQfLuXhpnvHuUwkXrMAR9LEXVOaExUaXZMVDUfqWLL8Jlbg3i3/czIUSmK5lNfgPcDGF7rMMtvwMGQ65dQswB5Ult2GIFyC1xysAAeIitCX53H5Wo1GfRMN2HDsh3yPOmFMQ0VZuiUAYHhi8wEU8OYeDKekBrLUIeRQVMVPlfMU2rdGI/MbuLij/Kl5zCcS5Xc4Sj1FJTXQ53LUuAchzBNIr2COlm6ovE1hVM+oVbL5uWpB93iWFNWYPDBbt8uv9UV6S96PiUKgboI3SXHFQaWyrpljF8ZarWuIgZFzBodnqBFRZC6U7cn1Mw8Nh1KgAW0Zfco6tsNw3TYNAscongXREYoDdSpp6zMDY/iXZ4T1Rx4mz0cMdyzUEbSoUZByryqbNThYhj7BiZBwWeolSsKqPqUz2Fy3h9kK3bCYhMHLbKqxtiuCD2FVKWlOXUvZPJ4hbboepnADu+ZoZPeyVRaK6MQEPIW1Lg2+qlXBgqrzPoc8TkFgblDxNviJscHAyjrC7vmPFha3yxGzJbf8SsMyuonFtxKistlzGwtGziBbZGOfcoRgqC02WkLW9kxjUM/gqaVguj4lE4eyEb4cpeMpMe5dLjZjLOl5jG3IX3DldQF8Sl3AKJbZgdzz0xyeHxCzb5Na/qahw1DTLfURwdsQ3RezxGhsq+q8Q9q05z3HakaRTC/hUxgNNzo3BKZMsECnepkzq8dxGSCy2urq5f7B9zsL3UsWqw55TCxw7ERuVrKWdGU8upgTKn5hWLnjUy0859SuxWe3X/kFzIz/vuaQfncyAXYoFA5yTAwaMeJS6EcsIznrZqUszcCLTeOaxE2QwxDTF94lkL7fMLawtglFWXWcw0yk9zPKZnJmIUfn7hFDxQvDkpuWH9oYHrcdh8qV8YddTIo2cS1iF/VsQFHhRuDh5L1+IZzvtdsdFBFgmTVVLq8cmJQINnOYY2Bo8VHB1cSof8APU6R68ywRkLuUCgpaEUZIcwtEyd9RrIw9ecwUXd0ssOzs5jOF0N3qZGfJ/cMN3rqaGt5dYm8JZytsKULBTuBTz/KLpYmU4l3T/JCQbg2GiXUVBrxUvzQnMZDkxHhU4SkVT7EMJaa+Jg7c1OoOsBWhlavMFatsLTm2f7/AG4lpSNBtLJXUZ4CfiGhvTfCbkQ5HiWimsB/EYHeS3T+Jmrx4hgLe/EQKi2Kql6mCttcjBXalyQsjirpetS6vRrW46ClHdxpjTm/4gzsaOZiQZIqs9a7jg06iKUniLQuAoiHQN5mdg6QPzG6mAuGquWsF4InNMMcoXJ8MVL56HUBkZLCq6TCqscAwscbB2KeEKiD1F22XhGtbL4lFgPOeYKwp8NfmHBSmP8AuBK4+aIWir4iGv8AEeFXd4uDZF/7mzIw8zGcX/cV4NFePEKA8nniOjedkWju3OJq/LBWXMFPsR/nKKsNMj36jgPDnuO1+C5Xvv3hlil9BjbI3p3tiKKNoUbJZtWY3RQt1iGFwDmUaC3FTBXA0sS9Yr0znEuHBC2qw6yvqIBs7I6TDVsEpomyXRF1llCr51cw0gh1WqlmbNO5u/4osVYmcTeOe0oyJtGX69CSrRbKNo0Ft6SuWDvEE9/zL1g6OpsFqcQxd9KiHPeI58WrjiX2c1Ve9y3Zx9mWLYXLDDLOU/mYMMIcEwrPpmGqr+Jb/MZQ2A9xvlxbXEKLrqsn+qNDSZY4iYIK+XxAaLfwR2TyR1CI6zi40BdcTAH4czN1jAKGryRLWHzS+xK66lM/wly4rOJlwUH49RuhQqPMSjRXhg7X9wK2K4hVt5OpUoixDoLEcTSM7sgV39TCVVLz3K/8Rg3mYxCP2ga5ZiuJyIOMDV5ic+pRjQAClFuMrAxus8eCbU2LFQlF4M+4qhby3+pksNEyEy7FnFuxRMk4W0lymJ2EoBlfKUF5FioWsrzGFhXZYYmwiFLASGyXpC3twmqsDD1Gxct94iMR3luo69QvKJwdGFZpTlwlUuhwJagNkuI4XG0mfJzEpb+7xE8nHIJadiQOCPU4tHeePxAFfmnUvc8VA6M+CY0ZPqN3ay4iKVdZzK25dXOQeE3FLvENRwD4f9UVthrPi4yBf+P3EOMslMMp2eWIIFm0Kzs2yQMNkfzEgL2U/UuRZLugDFdJZKGRy15l0IVebuON54wFxs4uWAWkogcbahANVmJTDDBcvnwIV5cPUvp4jf8AHuXNBuvUwFiOElxHTXqJU06+bhViaYAl2/jUVBq75qXHHhKN085qKJdFxoTB3jJAVXc2x/yDt2DEqi9uxOoofxniC8vDtMLJrfVR1cfaWXC8t0LlDlplGU+V5mCIW6sYWLPCruY7Iwp8l6gVVXqoXovcF8Zms7lEIsvlGmzAXDLtfjmV2M+4Uu1L1fMzqjyJdxz4iJhs29+JX8I5CBy3GlXKweppjLZ4Z59ObNyryzkZbudCb9RUd2DxLguBWYODLNRuLdZcxsrCO8wwN1kyRVaKOCojI0dlYirJV3mKmFoRTccbsol1X2FF5ImdoNy2sGcgNysCYbJmFM8ESsQHTAQGaWn/ACFzF+8bYfR5hy2JW4trvve5cr2ErGSCNwpSdzSM4Pcpu3sJb/MFtfJU0ZgVDviWBZ6dTAIdjtiK4EUiHA+Jh+LMqrob1cFc0PGZty1hmUXt2c1uJ6SrTYZ8obKHm/qAMCtAQGXvEV5TJ53KKtRnVNszQBneYLKVLM7vmDvxKFXnYEzGXzc8BhrUVFijzuIsFrfiNlW+XUoyBn8S/CDErUo3olfCntWLmikocwOeEtHi400Gi5VoGMVHo3o7loqnbTuPIWdcRXjF89S5rFGziBLPLedwxX2nEL61z5E0siwyoaGC+KBuACt+GArCF94ZmRVUv/f7MFZzqniENaq52wrLACp9EN9nJ7ZhgNd8RcA34OZa2GnQ/UxyDr3Gyw8wmVkC/iaEXH51C9uzlov3iC1Qpcx0nkhTsddTG87zUOk7WzxXgZYC1Y5CIFHA4yTMXlbTudhS8OIl8HDKnYahLcK8GPcqgz7RGDF3MCg51Co98fMLugrwSxBi4ywo8EoJpqnOYF37L9wWVisCorQtZrUfIw6qWNgIdDi65nAs6vNxgGjO7iMAaDEuaL6rcAvwDEHmGdOMzdk5jdm3p1AhsMdyyiBhC1yzX+9zdrLPrMCVh5jNk3MQrw3huciiFfPcdkaKRwcqbvMssG/EW7VVp/3zPQZ/PMb2wqfE5IXc0K7wnf8A5GgrJ/rhprStIS/b8zvI5PE2A0Vy4gUq/bSWPLBHYiK1EqDnH/kOBodHgqEkYHnuVdqu/wDz9QpBWsjNu4tDjfEIukZ5vESLZM9wPK265gS9Lo9zpG2O4lFXN3FnAItf4xGsonIpaqILCVwhPSYvcw7GK4mV5HklLsglkGXCHHqWrCG4cmzwQ5qR7INge3iUUBS24K+NhiuZk2XliY1f4PmA1gbbsJoK4v1CTexy3iMZfuMzZWDIjUHlwigxSAdSgK8FoMuWt1ZMDhyXcpgKV8RQqo1nmYBmavn8zNO5VCfUqhFpyevE7v7MbJ8WmN5sEXxM1YH+xGWJR4HMsDXVOIChydyik40EocGDD14lViNMOcRWK3lfMbDqyoDgA83Bk14S4NN0oArbtmuYLk57jZhg1V7HcGCYVaoeLou3ubETyIxt0kyGCq12e5ewei7h+k8wGpsTmUmb4TOyk3eHIRl/rmQ2LvMRt3JAGm+oi3Yv5ivVLim0UV4zApC3o1BjYHX6ll4OLXC5sqqPTVDTKy1vCUTlTpzC6G7FHiNSyKySkZAMftMyJnqXY+Fxn4lZcLmUeIy+4cDVHwiUESVWNqzXbBpxZ9E1xB6jQypkqB4geKjoD+RlMIMIAt7NztBeOpX4L4ifB2eZuH1Ucu7pw/iYpityO4Ps5FdVFuyyLCGsw9y1VR4neCF1bCrNhCKVT5Sl5btzuYgFuoAsL/qbFPuXk2F/4jwTshZB3orPmXyHTkzFeL7TZD6PmIoU5V1CUXDSYyfKWt2AmXUsEA4o3LWGYp/2H1LuYQEc5aaPnEURScqZaFIUteUps7/iLG1tjAXLxV7lsbDLyyxWsflABb67mHH5ha5q24UBjN3zFsL7M0HnqaqPzMw6lAlMZF09wpkWyGtwN0trlqVChxQHiUtXOIphdOpdkDjvcpwPjmXhkDQLlFECjdxwUi+SYlkmm6jsSzwsSuhy5RYrbMajV7G78RBhaXB1EMwt7Im+tMwGwNCOtdlJdxbrg+y52aOAy8wgt4RdczMMXsO5us8sxNUvb2lESexLqZRSxy1L7AqniZ8j6mFQpwvcdszz77hEwwfv+5fBUb6hdXarfMBctYa4gcnwEU7PTLCyryX7idbhHEq3wWNtOOZ5lvcAmMDLzCpT0hbVhzXMGDBek7rV4he8w5bz+pvlhWTM2Vd6gBWrdxjcpVss3RYmoEcekwTC/wBmcisfNdzORwsixVw14Z0F8Ep4s8OZZdqwN7WWFtfITlwvtED5EcBrtYQy52wsyXN8fxAIYzVkAUOQ5lVi2zHahhsf4i5DeliMzIzOVzVVAMLaaxzBAGrMJ1HdsWNjxPxG2/MsFyDRBi1ByXIMsXd4f+S3aSyR7PEbRvqZFYBk3riUHubcV1LN3U83Cz5OjMWwKfzGhW37hLxGGpl0tcNfELDKXZmVljjeLisyHX5i6EW7IwbtONSgS++L8/7iYNRTa4AnDk6lxO/aZA+BzmVoNLX++pYjAc1MqAvjHzKEHDDmpTcAK1BUW3fM0OBTpl5yLz5lltd9RGZZ9pziz2dTPKFwTi4Jo5Z5ihgzpWZlx+ZTkUcbJRVXlX3FVVAGqi6vf6jveK/hDp4gI2zyQZCPbxKoBquHqJcYVnPMKC6p8wNuplh9RqtVu5yOg3bmNabNlSsZdcspLAqmBOQYABfQ6TWC11eu482exuYVVNXiXRgVUxTkOn8ypUxtMSgoDLZUuqGhdiGjdOerrupceFb0epcU6vMEAwszqX5C9OxglzfHEpJNLVjHK4ZYCIWB07ZuYUz7hHK4qjQDWkOo1FDWS+SGtNbGNs/ohuUqwTphuPpjUtORGQtjPBxEq5i4IQ30VaLGwb8zQvO2u5jp87dTkgaxzKRCEA/hiUI+qfmCqgs4iCyK4i6P6UuaPAiMHB9S39GNQ6aXqU7FXmFG1HUQAWvcuG+ogvZxuAQ+tSg3DwHMuwG7ZYKIDvqV4KeIba1WthDqsHK8T2uYGCzf+/MY5DpEvFVDipg6s3MUmMiv9iLzXkY9VhMUQ1YY4CcJP4lJWH2QqGtmInMnA5lNAa3gab5dfzBhzH5hrCtcvNiZ5jRshg9ABqcFeccbqISxNIOpaGecDxM0oa3Uqunb/iXFOa3U4VTKeIC7lHLiVRgN7bgM1EgTgsytmsNajkhPWogq2XyljhjYlgTgKBYvYeycA2c9TE0peWLmCztcRiebz+IisrywNeHa5YKsdF4l1B4REGXczoDC2YC7i4CdcQ7F+TcQW3B1CsG7OZZWF3qWHqxNS2s4MEsBKHR3KF4cN8wrnDisQafDi48rHsO4AEHKpzhUX9x7lYqGj/mlKM1TzxAxATdPMviHQdSgSp5miTMEvemeS8acxwGxNUGmICwtBiOHITTuVBDiC8z2kIaQlVtvipstHJebJcBNfkZYqPN9zBS72zUNXzwjuADO/LSI7M6+pmdXCm41tSk3ySnGCLzdHRLntTS5Q4rMY5f8RdaceP8AbjMk+mLBWsdx5DhXUaJSwVSczAVfqacBc0yxhb1LQ5C7SLUw6uVtQRQZV6S0xMbJagoxGhZ6MVC7b1GKjP5QJpOEpz2C95xEaRzuGJjncam3GrlzvecQRko7YKwrHF/qBsRpFKNBfRKMHkipjziglayjCuN4LDWn9SqDUQVF+sToRunuEZavfEVF0K/U52mEvmNlMH5ImMeGYtu2O9TzI+JaNZ+0EqCwvq5eo6YsNkx23eRj19t3ChkPvxKGxjDcZOT6hcmQfiMOyZqziJmLrvuVCHhUHMsYzzKRU1o8GYNU275nloCLmNgV4G7mQVxc5lwvD9f4iGpXWeJRbXF5JZg+vGeoZMq9TJW8rdyle28pkVmHDxLi13b7gttTlRKGCm1nMuyXNVhNKvbLKhm9bgxWHJgWV0uAtPptiVgUpf4mJaL3kz6eCqjrYNL1LQeRDRVY+UsHZeISdk13iBksQ5lxwHPMW13OuiDG7emNTInSzxL0luNwQr2/UR0DuocL44ihgB/zUwNidVFKflz/ALxPmO422DWpTc9RsYvRuXbpNy0dvZxAKrRWID4hV8k5lzh8RVMH7RrYBq+ZeuPwuLg21QBXgxXMDoRpzF/SoIq2F90zkjfFOZ8gykK0UeEOIQIfyRTwhTJfpLDS+Q8k6VhjxDKdmviWXXBgNS1Znh/UQqwfSJqejzHbWrtmWaaeZjRZ5xqVk1DPO0wd7VVYqZTcadEDw3AvmVbXnp+5dMVVNpQBT6XeJoXmun8xexpvBqDVQI24i3ZFNXdxhJws0nIZMXLre1r3K6J4OLjsoza3ElILZXE5BTrmFIOLU1Bsb4nqAsRVkBeIH2iQcR1fc5PDuZQUGlIBd2i1mJRLcu4AB5YSWtFaw+ItKA0EqDqKJVAbQ7D/AHc0hpx4hYPAh1hgrMtSPOWYBsN26zcyNrpzOoLyb9zO2Qc8TN2fDG9KqyEoVxs/3uBdlm8xJfzUSh+GOxYMIxOAty48sqbYcFSvK0cR+g+IwIeEGAazbZmNDBs8TTpWnFTCyawrcW9DlV7lZwXYnMdLcclxgEV2XdTUcMi54L58mCnlTxOtl5JS1cDqAIFmyxo0rfmMSoZAgFrqVXUTMZ8wvtaIUGarZuat3qoEeE/hMCo6iPzNV6GVGC24OobkB4uuJruxgzCBi1Q3EozIzUbfFWYX6lmh79JUpbgwkWvHqVRda13XMVUKNvUsf/bnYG+YbqNrUU/jfzBgtutBAtOWU3h5HUqdRx/2WFI/hPBJ25l/CuL/AHFbqqoPUV0NlSmGylYFqq9TdZdueSObRZyQUAXNZ6nIvHJLZRt5eJoTgP6mA4H4hVtYaGKOA6dwJvfmApijWI0TeJolUK4CEXG9n6gRI/tKxdmLEqikCUL+IpeW9nSZF0p73FrTbAdzDELxy+GZXwC53xCYAhd1FYu44XuM63x0jl6yICd2KJTvGvCZTAmwTZdzQ8Cq3AQANqtfEN6C5KuUIQNQVjpkM4iaXTuLN0tJbj1FcWLz/ieTsQ7A+Jieh6iFlg2jY28KopXHh9RAjpls/MLDyalGjI0zKB3mrMGAtTfcro8zxcRYw99TYjjsuAUaOXVyg0w4xehrmArSqbuv9xLGlEuk3FssODnMrLNs3K/56xCNdpEC1JMKALNGs0hXbYXZBGETTUrZntgKp9PHMQoV8HCNwsY5haQO3OIikXliUYeFt+5dND9JTdA7fMHbNepQLQLBqVEWaf78Rl8iiroAZwYYkxJhV8xBvlAGIYmL1HCz0uUJbxnTXm5XBiaiqG36mUC2d14j0ALcuZzOtDxFitLo58SkDkSDKFd/wlWV4IleXQuUymeK5mV0ledQvDggQAXAswvwmIHCficowdxsYDhf4gArJhfMAtGTTmGnwTAbXg3KrxtgJSFPVy19ad6misN41Shdl/UatQd8CAaM8t34iCajqK3TLrEzbeV8wYhfMlb84/gTYs04zE91VdFUlq8HMglVRryw35C6riUBMiWUL4QRrAvO0yQrOceczOpjL9Sw0hWB7jlgk4xE3OcjRLE5tZ8z0DDDeG8+CKy7Z+oVBYW8koLWuKbg2Y3ptcVKg1iptrwYSWCrgwEUrc0JYyyM4+DBBDFKjuVZuDvyy95LTB4HIjNeCiuZhUx8cQup6uYNuDZhMndvGIOVjQzLJhbGyChqWl0gwhbZ+o5GRLuYtEFe8y0pY14hfpXpG1BV8vT7mTMi5/E/EYtIsQXZipWmpbzmEK4pjOyOlYPwS5sWaxK8wKzxFDDhj3EGb05LfMo4fTmPPWXCTeFPOaiGWBqaSH9pjKO+UEIBjbEQMrDhXZE8BfJ+Y2c5TdwSiHBYwG1GmoWYdh3FFNJ0RUoGx9+I1qLTjiWmAfBctucczAAUch7jCkrlrEJDiOE+7lQNh/CBSo+0RAnzmNHB8wKEwqWuuR5jtcWax6hQV1HM5DF01xB5lpQ8y5NP0gaLRMRcF14VGOtf1/ydl9V3iDkFrbT/AHzMFV8DieRwJdgFtitS2/kw8TOdcLHXxLAa3uZ4VTmyIxuntlACkXBwzfiWlL3OIIqw5IpD0HqFTXnOYqPaRtcujNagDn7XCtXY/GYo0Bb3qOaGDNyi3ekoDW6CaownMyVdcWxUmDJXUCrWhzNpdag6Io43OrqZ4OfUKaFeZoThYTC3Cz3GGVXBiCBVq1Tz4jtnlnx8QKvV1XzBxAV2Yrl7LzEjBHbXzMW0dJlirJ7n1KhEsXfMOxV32RZwq3FrKy5zBsUp22RxBrhWpqBujrqZT2zX+1KmwbzAd623xCKElqoDeOWJidMWuHt1NGGh4Zl/g+7i6GVcTRSuVzZGn67nOsqnz5iVyy5QIsN/DuOnB4GoIVm0ypzPwzCJmviZ001ArXASOb9M4nf5/cFDjyNxAHgyTMTELoPLEBgWWIJ5vFQSwAeMyvKb88QC9FcVxUoc041R+Yy+A8OiYdNUpzKCJeE+5iEbeJt1TiplAdDMBzvwILpdeYLWHL3LYqdPPMWinBdwrzKrng9P+QrcByVCtULSlhA03iVjZxuZBUTtiTEp1jMf8vlNkFt3C1IzgWWWiF42gg7+4Q0quG+RLHTxf3LYNGLwJdHo1N1V2zzHYVwRWF4bTNnmWAa3uVWMqFTdhXU1teN4j24njE1ViuRVnc1qsaCOxHB3zM0Le438jNfUpYwjUyaMNjVQ2Ac5xAWND7mtjrEENkXNxULY3AA7eVykLz6lLbHL7Ji58Y/UKqLg5xCWAOxxOKzlsQmkeA3HklnzFswEOYH8BHBwMZi0mLG+JVCI7j+/GOPEba3ByTeSvabaR+J5jBeZkZVfTMtMDu6uBTkDrX8zOGDnEVtANBXcNvvisw4bzmXnI6vEHR1mMy7FHNMIB6So5WuzDD+YXCkzYicHMNIXmZ1WliQgtA4bhGsmbP6m1N06qo6sGcMyCY8Ny6W1XpKZrddty8/ZR5lSrFeHctRnzCSkXywi2TnzUyKrIihG2ErA+YmZqFnKXTPt1KRY2OVywYD0VbC1BoJgVmF4xcpk0c3ChRSnqIa09V/Uw/oiKXL8RCLTY7mytdkIybMW8y6Qbw3LPjAiFseW8zfkOt6iGXngmo3si1eH6hLc9qmHb/f+QsoPCl+JV8txzqW2K51W5lCMMr/EMKlK1K4BXwMCha6b8QhBtXLHxK0egxq5ZBSHUxE5lNMaXswwyVrcJWft5lhdMZKM3jZgjaQSBpWsFXAaKmOpWLgoziB3OVJ0jtaXgOJhwydZiTbX4jbzdrdnMyCOwFMoPIrQmXYMYuOQxgChxJXvUN772ZuLmVvbUTszWzzMhfwYwIlHlmU1v4Ll6IXC+IqlsywvDlsjkpkvsqFVHOYrrDcfMXC1qZHr1f8A7MgdeuFijKo4Hca1DzMNUuaW2JbbrxxNDFoz1EjouGNS4enjFxlo/GYRYHIYgu/LGY+IXfiYNns7/MaO2+V4hmwaF5lHYxpLBXh1LqaPY3C5kDTUMNmrp3E20F8Y1JkZtzFBP/A/7EBTPMBv3th9TBn2LtgskKZjM2PMGMY7Iivm8Y9xucXxEX/d5l23LUQ1LqmviUDStVvWZWry3UwqZt33DuG+IUUG2LalSziqlRXwMolljo1OAV44lAf9QsbxmzywOWOuvuJGimFyHRviUUzjUEahesylqkeK+5g9SyZk7y2NxyeZcV7KmU6i6pR9xtUPWf3E+qU8R2JRznNTsMORIjp2WQazNq2JnY1zRC3KXdW3MM+WmAQI5YnLRxwQX4YrmXwOrvzGuGwhcJZe9X5lyitITY+OvE4JNJfHmC8TaOmzzuc5smpZPcCxMF5aTBimKlyi6io2svbKG2XvE24FS0v/AHL9TI3QDIdVcKjjR4EQOuMCcvmOzKvMWQYbAx9xWsZrUFuAdoVLltBqU1VmiYrVvO8StlYbItimPLTKbbrTjDiMXmz5Sxb1Uy4wmECwFbFz5hYHIxzCWrHXCwXZ8GYAFgq6gqwvzFm1zRbcapTau8zxE8TWq2b8RVOZT3mKVClxDxjjzG7w7lb3WIqswZqMkezolf0wFW19e5nvwczAWdNSywAOOyLto3G1sM14jQu6RaywBI8cTaccvEVOxXf3Gi9gwysouNvBl+VXHMaWG49GzzUZpVVVav3KewyDqBmHLPM5Kmoyw5avcoCxvtMC8R1ljTP4kauI9QtCkbTT3Lk3Vq/MWFMcJg4YAS+XBY1+IEiKW2uJWZxiIBBHRVsQbA2vphQEX3AYLtA5ZWcypWaGXuUKz5hDWoWgpszUOHh/MYuIOKm9h2taIlUtW1e5nYI2GoKUqx+IcVKMiZBoxhwU+Z3DuctTIjlXKLv9IWAi4NTmxibFo3MlYmN7YZJYHm6jvNy2NrHkmTRswLS9/MVgQ/uWWF8Ywt/9itsrMbTDy9TOKO+kWGDRnMEKVFiAIhKoi981bxmMxc6TIsHVTHUrGXVzFlm/qWaj+5eja+YiBWF3TGuGUsrErFuePbGWoeIC23zDUtzkkS6RS+Uoi/I4jjy6ozuHojZLhzLqVw14DKS9Me5ZgKNhnB4fP1BNuqVAjKhL7Mq916DqMZ3updX6XEvV53D3paY4obD5lXHfRuXigrNcxX5qPKcmuMgwETQOX+4laW2yl68TYvFHNfMUjyXiaF3VYqqAyLDjgcpQ5I5JxHgvnidwt88QU1Tq5RMfuZpW+ZUyvgncM0xKUrTlLbWlFrmOefxFwS1C3JiWLyWe04lW8RLwxbUWqqRzqKm1RMBs3lQwLmjw6j44HjJxjMJGvpywDQ4Uw+XXqc2dBPVdTPqM4Dm29zoVZ8mpQRQuA286Jd471OYsPPHqcAEObJYapzM2kNWVM3RzXuARKTtUBcrt54jod+4NoyLqO5ZH6ivLH635ib+z/e4G2N7CeauyydSOUQauNqkwC0LlZqD7nPiXYqjogFs3FOhAqlZ5HmXbrVpuGdpsPr5iiylLu90TYOOks7nu+VR1Ax+zuVyRPNBpMrkeEcFrHvuFtORTolAG9nnqNhle7jtQ0IZnQ5i6HOniGqWmOY1BDO+YqFjVVcpnz7iDIXmyKhkUykeFOREUXqtVomoYYS0vvkQ3kFmbhcauW+JhSls+5i+9J/UFtzynp6os8xwXSFULZuUNsGJsGz1Bv9iBm+O5Y16AywWXwzKFo2L7hQwZ1TP79l6BaHV3KPYmTVdDUpyV+IGTg7Rel/cVgb4b5lhlulY6gpFr14gOjgxs51L4TN1cDOysC1fUbSXRA2QQ6C0m4uz6nJa53wx0oY7JVPoXi4gDCquCpoQVYTbTxHNf2RDhGpk28Nww5Vy2lPGeISoYdf78ytiW5VHOTkywC5YaO/8AZl0REwqFAqzWo9kw6qK5gOk0Lea1G+hi5ufcfzKaJn7qFnnLSZhlWMOIS68tcRrQ0uqhgeyV0cuNR0oOD3mecM1UFE5qiNjVba5zSWDUbXBl59wIva0S/wBKCHFY6JkN0zjGolpzxmJVqSL66vkqVBw/ygCvfXUranD6mTTlzXJ6m3AO5QwDK2oCc3i5fK2u3xM3P3FMwyYpPGc3KU8Xdkej6krmSKhxVcu5rJXEuRCx5Iop0dIBYr1maxuBRy5TGhK5M8zVzD7SoHmWQnDlZl2pWLgVpgN3zFPuEUKdjGG8qF+pQ88mG5kWGs0wvkzVzktMPKuxgv0JgtHs6YCWAsltyyFCmPPc0Zpg74771KOBvbUaRd3VWQWZC/5ua5OeGYWdnW5R5763KDZTxmon7DUqaU7q5SLXpr/2ACtp/crS/DVEFmFPDMEfCiFDJzXmIu1tZIWVpxj1LWTnubpWALs5eJ7R2Q2rrUTtdVgGE0FUwMy+SlznTvyyjIXmBSK7b8wuZsqpbDtUEIL8y7azN4hWIY5rBeIuOLr7mhVDBhtTYwSgoLc/qBt0Axi/qKzL2H7mfaGisRJA7aCsThi+0mS3X/kqKKvUbSONGZbyu5kMrVUQKc4oIeItxiKh47ZnkNjMRQYc0RnGe63NI544hC/slO6fJByHAy9GYiqtdzuYmxqCFxSem5cwZz9yxdN1h4mqCmeSBUt2eoOQA9QrsxuGcMcy05DdmoVlQsutSqurOVxVE2XWSpkYAxAQ4Bt3Aus6ZQ3ocHm5xey/3MHnHGJa4s6pzAyMPAzowe+oEGfGFW8CBfIO5YOXvKYqM9y1r+m5ytrMqhQU0BfcuzQ0hj2D3LVgu+ncoOJjGHB8xsNgjEu0vTNtl1iWBg274gU2HYfuU2Q+Zmpl74mnZgo1Bd1Uy/1RfCyF2av3LCkbc1C08ruEZtO0oey2k5fCamwrOGjnuJRCy+OJcLc9wnyFsUy0YLi1213pAQ2HdcwwCr1ZCwyIwFqfDMOTV1bv4jxsOtyi+pYKrVpxEc0XefEMBXdylm21SuGx/9oADAMBAAIAAwAAABDaGAEyx66ZDU2tbSMp94rjyOUnXXOpkKVZQ2d/kcNqjUjL8NAuFxeIrSVe/rtK0B0LeM81qd1BugSgpKxLhM3Zu2njRfeDNu/fdK5aM63c4YrAALlxdb9fPkgZbTfCa2TdNvimw/cyxkyip7FYjKcZN3pXgjyK1C8wI0u27JBp7q+hgeArMUKo3qV4vDqAGDwGCP03qtP/AAgCV70pocunePitM3esVUQ3r6H8I1LemohBg7BLnF/zPjFyCtcLODs2+ffASmIQkyK9ntViwrOzn69yx2SlQYdv4uUgR7+nu1x2Eih8MnpQ6k5jSukuKrG233eCQ0dAycPIcCuhIMoEcLGftn2aQXa1xK7Zi0fzqx4FSw2vKaXDs/2s6+rib2TYdA1PTRHOHHxy9BEPVdZLf4NAqQyhhw5t4Nz94OIYPLtt/nx8w0Yj4nj/AMiefgjL05816EEyPGwgdcIdi3KF11SAHzB5yIQRYQlNgAxxbGR8b+wG0dnqOqycbZ06Z7fQV+PuW/PC9d+yeyN2vcXfZ+kJtQN+oNqYAsDisT+9/wAbVH1zB1/AktaSgtMW7kvTVVAUFZH4qfrrWGVaPFKy4CgzSxSd/pUcsTKx5G2xhi5RhKqQRvdRL0tCxfDTq+5WH7KjMWn7fBz2y0wLipdrLznHElB6swoiRRkkmK8OPFihYNIZ5YfVTeiELki4aNh5Rjwklix+E59OaaZWs0Mx/wC1xhHVPYmCswkPoZu0pVX9OA3oqtdtRZaJdeegFIhWHl72tJywlb5QUMmqxfkGmDm398CMYtgfKkxGsxDr9nytXju8lRE97spODXj92d9JJ5Xan4e79FhKkYgXs00c+yQSni3onAnOWmw/MoHidLdG07Fdw3tdds6y39B2re3fME4MbPpTSOb1JMNcC6kBwJWPTg/RD3ND6N+Gisd56Ywc+EMipH6ZxU4cPh8Am1w8c3GFvfcIO8c/M7XLW9VVF0+XZ72mJTdUTcnStcpGrFWMmt/aU0eFDzv/AFsQHub80AwdQ//EAB4RAAMAAwEBAQEBAAAAAAAAAAABERAhMUFRYXEg/9oACAEDAQE/ED0gnCi2QT1j+ZQ3skLC4rmiTuGnh0Wh1vFhafw2MS2NDWI8Ir4L9Ei+DLopfMWCZSt7Pw6oSoS3GcPRDEjSQnvN3iXhILeayxl+lxB/CDHaReCG0xlOC2PRRv7jjmJm1rHesUEx1bINeCVOF2dwkki7x4eaH/jo/hPBIYkJ4pZscmsIS1T0rHWNEEtD0pU0cHEQahdCqENCRopDbG9cOhsWZRr6QaYnMp/S15ra3hSIhxYkOY4f04Pez+Cd6fw9EvuKUSKNs9Ghu6xB49fo8TShKXwcDG1NZpwXw6NHh4WrE2NCc6XDaZPo1HrFGPFuGJfBibaH/j+jRofmHp+npND+ZZ7jWODol/pO8xaLuh4gxDei6yWF0uHhU2PR3CaTykdyssS9w6hrQhiP7hI2xNXEHrEZ/MJeIgiDUKbSonifcU0RlKy4Ylsa8FPRNrhGhNjYnhMQjmhN9GyC5hrKGXeGhIf0gtMcQ/8AN8OHNEJBl0cRBi0N3FhWJJlXuEOrH5jwS0Qa1l4ZPcNCGysR1EIdFshDrP4dEintONG8dPIdGQm8TEp+HBrRR61ivweEj0Swux8z5TpNYeiapfC4Q1XognBpDOYYiEXgyEHvhzh6dEMaJMfmGJ/TwQ3su9ZTgmUTovmXoQhYuxaZ/MrmG8fpSQhrDRRmkQ1Gxu7Y8IlPcQo2XHuH9E1nnS4rxGbYkFGbR0W1G6xDw1GM/RXo8T/TkNFP7jgjaIfw2fo/hGLTG9xi5T9OODFzCtgubEt7OaHAsV5Q7BEJD0jOHHoadZR0aPBieCWqP6hcEjx5m+i4Phz/AAhiZPg6UeGtno0hhtYSwxuqZnuJdHo0bCeGiYpcJEEEbE9CPcPSjEyHcOTR4QSzXRQf4IfR4hcIsL9LBbP6VMpY8TYxHuNCw14VoRcLRG2THhJnuLP8MYZ+Y0x9OMNNCRzo3fDTJhDfwomT6eCHiDE8NieWJ7NFp3n+NrTHoX6JwpbmUdEMR7sbv+Y8xxiW6xJ8Yd6QRwnwWdpUmsTZCFj2TCWLR2i+YWGi5hNej09oamxPCj5oT+5N7LEb4IqLjo1oVH+4eeHg9Y3h6w21Ruo2jXBJIgyj7giHh+iEiPCR6fg/mKjuaM/Sk+EUGsvWhIZLsfNFYqIlEPui7GQTGT3GsLXT2ZZMUrGxr0Wh4eelwl9EiGsQ9pwbXco9ENEOs4ejieix/wCWjwghELBs0x07hCW9kHoiNHWFP00dGpNjOYSo1uCLmPpoQ8THDzDKxDdP/8QAHREAAwEBAAMBAQAAAAAAAAAAAAERITEQQWFRcf/aAAgBAgEBPxBwV00wOJHRiZpotEoffDc545h04SOKV8Y/1eEr0o/gkkoOp+Jh/SejfYyC/GcUq9ibbL6ER+hL2xYzSwh0hcLRpUS/PGoxrENpYXw6Jtiw/BpDiQmsE/QmPp6GNFY0xqjKJxzxBKDGncKMnon4V0ej2Mo1tng3BVrR5E/FL6QiwgrRq6KB44L9foTU0RnhNQQ3eGNLWdGkYkUmW8HDQxD3RfrNdMqCXo/QmxxKidcKV0TSeHT1CpkUIWoawXRxHwNZSpog8OHByac/h1EP4WZ4ay01w3g41nRuqG8OHwlP6X0TdFnR+zOieDSvhL9LkHBub45pZ4fIM49KkNEYsQ3WRRNPhU+D5H41uEhR8wh1xjTlPh6hC5gmNobjE6xpkp/ThBp4ZdOEpNGr3gpL4Vnql04hZ09Q2ErEkujieClGzqjPRVYPh0jTqGW+HqKISyns+F/PDShIdG/GnRPYQv6eqRp6cfhaezXjPZrEfT4JR0evRDxi3oi1FQnRKiFwpcK+ELgk+EY8KmQqHhSH+DdSSGQ4WCfsgv0PtOsagm3Rc0/gb/RMz2I4PeDUOEINkpElhYW4hffHBcOiP0aZcG/Z0wSQ1+DSaj8H3BKhLNejb9CUQ+nPCaYmrokj1RNcQ8OrBLxhNo7T0Xwn++EnNKKif6U4NqnoPo/vi+ie2SIa1tEjw4VMFiMSa6aYkuIab4Pgvw4JrhSEOMa03iEvRzBFPQvB4LNHSOFpaX14+sX4VvCHULcMZiZouns+nwuFaCZgs8ehlHvBq5474T0nhdGOKDbWFTwfEMY84eyVjfoT3RtCZ10TaOnoXPHUKC8IghuM+DHe+GktZfYnmIlHjnhe0Mjiom6PeDZUNaRw50csPhET88c0WkdGvwmGeyrgp78SjMJJDBCiJpfQmKIsOolHVzx/BjXTbRPo3g8IrwTZ9N9jLNHo9HH0WsiR3xeGM91jXjIVjTpVINjLBnB+Dw6/g8ohOC1zyzvhvRVMfRiZ3SD4PrPgxYh1aJbotdGpwh1Yfp8H+E/fEF8IXRnBMTgncE1xHSHrPCkXUVtnR8otGn6PnlaJTh78VDJOD/TW/CeF6OPguhpnDFzwl5a+jbqLODqWHGK10agtRKUfaf00aE0NLpVT+jS8UdXBBZ6PpFTnSaJDS8LvjPZFh9GnfEZPw9waE3IzWcRf0X0auLw2iEfBYt6fw4dR6OoxLD6KRvfF09H6MR6o71j2L9Eo4Vo9wvp+ENMohJbBm+nVG0eLw+Hwp8Gn6NTPhg/hqtIykipMGvRwJRj4PVRkPY/Hw9jJ+Crzwm/Q5BCYJ5ooxj3gnCU4xdTGG74S/T0POH1ns+DRWkMZfDZgt6UukL44xtYPOnwrR7P4KcYklgkm6Mehb5YmH9EvZNJEdJ6EknXwpuoanSkNDcI/RELpPw1YNKaJ11ofSiQ1eiRRSEaZSt6NYNGnELBNIYn7DdcND4ayCek/Cr2Xx7Lh3PCHuTxg36QuHBT2PT0XBOmGCa4j6dYPo0ItiZ3DZDD0akJexPWhsftCspo+0iSqEJV6R0lI9Go6Gzq8KDCSbqLenNJ7E5D4Eoj2Jv2J16NaSFqFo3iIaL9L0WiaeD7UyvpolWUfCexULVpwPNGN7EOUqp030UT/AHw6IsHRdn4PpzgkWnxlE7RQqJXgmmpBpXTho2KvRjwbjE10QtJI08w9nBIUTwS0itRR/oSGncGSDX4JmzmiTXSn0wWukR8Q1pEhIxqcGkyYNwVfDaWIvvx7H2nwZJgt6KCeHSlb4jS3wc9mosQ+C/fH0jtY6YWCdP/EACUQAQACAgEDBAMBAQAAAAAAAAERIQAxQVFhcYGRofCxwdHh8f/aAAgBAQABPxAnFGIHRg/eB7FZBmVv1esJoaYuwdw/eMaETIXMEJvXpgBcWCD0L0/zDRYEMJFJVMQe7iSlGIHaQ6NH884kIIpMgm2bI/Yxc7GRYV2HR9sKaSFLCQSeYcTLyETjQuqN7jCVgKMymthxhuwVjlmOv2+mWJrurTv7e2GCNJhAxDrxeMAVKNRFYwW4jLFp53xqqwiAWEicPHt+cMgjers9tjPXxg0XdlG99tAemBDoAsB9vAT9GCC8TjZt3ovyGx24dDCrtZSyem8eKiKLS+slO3q4gwUZpUR1j/mECuiFylB88+s5I2lJUCNTGjiY5O+KnDQodiPfR75NhdAgqmPH+FYgKPIiBn7eLChbgoLkj2OusIjSkgdLKPu/GQ0bWQQh6+L/ALiK6kREQ1N8x1wmsCINfie3OUeCYABtt4WX/N5BQKokqndydsaDdELxG6O2MWRUBML1+9smMxLguxinrig6ORSGwN7+1AESE26TXTmT1yZIA2kfE9vjCmiURJ9kPt4nYG7IeYjjt1wASU6Uk1BO9vthxINsJMFaOI64JhYMvaacXnZaq7da0Efd4VBiBO73v2yCCINglwT2xLY0h/C9V8mTS6WlA399sgBGQzUjxLvXDjyQIfOur7XvA1fAFRuTXBkIQCCpFo63X+4I64iEctu5BwGKpsCjE8dfPORBZOky1x7++T5iRGGWe/pzvvi6AFRCdF74ZQiiC4izvpjzi2IrLr9P8w9KS2ajHDV+ccwpcJRVT1k/GXhNglJTFev6yRI1JTM9PNZQ2aQJcKO8665Mk0IdLybPb4yxGQJaGA6/nLPVAsRtBrpv8ThkJ0SWCu7N8Y7grpEJNNevfAoJG8JHHQ66yRM4RTuCaI/fOS0C9KZpme3P9wiwmCQuq9O2OGdAbExN36dsBnFsVtnt4H65IAAJtADwnxiERVCyz1g7w/5yEjAthKmwh+znXKRpG2zqamtZM+QCYphhn6nG2UMykhNt/BiKJNICu8xpwhI4YjB4l26yAyBsJlZ5h9Xtk0Q4LkgU/ecGsjZiHx95MSJaBHaqEeNe7gbkRI0MAde2CJHbpeBZ6WZJRQEQSNUits/8wCJMpqh49Nejjjw1Ju6f5OqxTETEotRL4/PnI6w5pRePxxiESXI5Z6H6yWP3awrJ0/OCIgyyYSF81loDiaZ99n+vXIUmDZQ0nmuDAUNwhMz232+3kmYokHQB58PthV9EtG06c1GSagXlnqTnWDzZxSkJCF46K4hoar0rEjwDMBzoPQ4OuBLiFdyGIB1eKpuHLZ5fOLDSUQkREHSI9shDHsAKJBG5NZBl2JAm01hLYs37ddlmSFCMokVLO3F5ORRApH+C/wAeounk6EudW75xbAFWEKOPfBWnE8sX46/jxEQe2oPS/wDMreVNnd+H6OBkBOqWWxGZqfBOd3myd2vr+YFlUYEmtnbxhQt8ANpJ56/3GSBVwiUaa7T3vDWNmEo76Zo7z64DJVmQMLLR7r64lv8ADgFtCG9ZYgRS1iAnR1/WImwUzDAIpj0xRsIE0BxKYxUJSmXrGVb14h3c8X89osaAm4DPCa0/GPJloCfHFKsPQBf1GFSjxaDQdyzFCzYBaddeuSAKCNKohNkdeckIf7Ebk/44tw0iYU8GE7gMHDu7TlfSKlsfnWBjoYsIOYlt4iMAJIBkyouSKZ/vrGTy4zY2jGvpj0pCU4NwHWKnFQGRKIg6kte1+2EWAUJJIgZDr43gVIcT1AMV0+8ZFJCCDnNFHn+5HQkhUq8bomN4HHoCqEXweHAGdhkGRPGo3rjBkaSBERKrvPGNBgOAdgX3vDcSAHYZ49H1w4sE06ZDjtAgilcRxPHXC7FBWzrU/d4pkVDCRA8ejrDhlo3MgjKmGqZExxfo+uIqARKfUxE9LxERICCVuK9clcoJIib35rHuDdocPGQcfiQLr3MbCTYteTc/xyQkRgBZxOu/f5xVEdwaJ49MkBZDRmZNPTADTZgLafrnjKuZAgQoA1xeBaEdhJWZquPplDgSJlZVar9ZKwRJi0iE9OhhQqJi3yQ62Y3ERrINwV1/uCk+xOU3JiEMbsAqXzxkWHJETLvXp9jAmihuSQh1997smIssD+8V1wtANUiCORrp+cKXG2FT1IwAU6RKcSSev64xlYWBiYkN9NdIjOIwQNBcsvnw9cFIJF6FSGJ+V/c4zH7e6+0Ie+BFgFSnsTEuBQFDTUGKtHRJEN/quciU+uNpD28YYpG0fzE0oQg8HXx8GASoBIeOKzpioWk/fGKVks3bWjzhqAolN64x2qxwATqWytb/AFj3bbbA1HobwQQK22JeApFU19J+vjEoEE0UqP8AnGRSwQiyKRxrjG9iImMlmvj4wH1T0A6Nnb842EXAgSxYclma3iTpqCB7f3LFaiKBFVUbwCKpGgjgfvOAESQhhG03E3vFQhxEq2f151jBFUIXpHTnp0nJGAIFEIRx64JfEPBGlO2BAFBK2amuz+cjgaQgSvsOPTWKmJNRkQeJr06e6JGCBCWlwzz9cQco3ojrPv8ADgFzqZTa3NDwLsCOI9sERBOCPrOHhIbCyO7TR8YwkskpC1PPOK4aUyq+vbWEw+oATXWTneAISIGC2WVdrAfjHqZMRLLtx/XXJbExyyBcd2vn1yTwga2FNyfdY0AbQ3cCEY8WQlxIWOg16ZE2DrAnv0kJwakHDam43G+2Q+TiMQtD8NfXBiVLEvV/MemDxAhEIJOhz9coiLAPc4EGpIEBfBvcf5iUEBVptg9b3kb0UQ2/5zz24kC56Dvm7dcYkwVElICq0euOK2VFRHp5yjtywCeLxrFSFlMr1j6+0C4cgISUPYy25YCaOGeP78rDsSrpF+le/qSCneGuyc/9yIwkUAc0k9/nCqVFC+OdX91iGI0BD29X/mGgko4XOTlABJ1N5DEACXbd4YZsJBPr9/pUWMIyFYZ9eMtgKFQ3EX1ZyAbsFvvljTipbchoaO83X4MeyIpQnvB+cKgN7KImFcuCehipEEXHj5xLh3CgEPrOEyGGFgMVM5U+gU2O0b8Fdsg0StqRfN9HjBQWqwaHmJKdYnAOpQonQmDb/mTB7zJFOTtvnrkICjDRB0q+3rjYnWyK7x075Z2YGhDvfI4YpiJUZvatS9skUMSt4iHc/d4bTB0R0O3U+MQkRpaTuF6ZTrfo9hVV8PsHEoIXd5l2RusAJSQadeO8fXBwXFCRpIvoMa3m4WZgk8Dtz65EYgGWJTjjxgKm2MXWjf8AMUKYMLplN+JfphYgypoHz/zGlkEWhdJ8ReM4oECCnPVOfxgGEKiLXrH3eHsJBDtX5+cLSJRUR3fnECioJMOnUdZnzmx5aSpuOF8Yo5iuRYmjmpxpAEpKIJT76Y8hNlNRHDeTMW1lPHfv7Yi5SJ2wWQpNtjdHx0xkd6JJgIhbp3Xb3ANtlEA9J1rnr4wlPQNqdz3xMm8EiucJHUMLAAkJDZsp9vKyzCRGR68RkOWRHAtuE0RJAK7XPj7rFBZWU1atXqk4xTiEyBGGqPzGIV1DKpBu9bCsOGDmlo/n3nGUtETiHR9sNqAk4HhJz3wxtiUBDH/ffAKopoVvpvZ3wBjxwxqxioSksOURrJNAJBKAb3zhLIEWEbOnuY8YmJJfc9fxjsZBsTtXFZO4XQUvUnr90sNxkIgCZl+cZSBBWiOQ39MYAKDPYNE+9TkCL1cKKk9/pgHYklAgmr1XL2ypIqkGRoV2kOSeCpbMcncoyapyJD1AWPB74iJNjWoFWPq8hEYghriNa4wLsZSH9P7k0BABBKo9J/E5Il5wFmj8Ri2pu4sNfkwuEQSJScHk9HOV6Cd2q8FnRxTeChjneQqLkgRuj06YVBGBiTZ1KYzUQrtNC/f5zU0ZWKj07fnBkJrD0B91lQCgFGmJjpO+MXSEBL1S11ymQ6WibjufzAjEKwkCQVc1V45NGglThMWCgQBF1sdzE5R6GtJjfGmXANIxFkttfxkQtANk/BfWd8emA7QgAcg3LxkqOaub7X85GtRLu2gbNe+LUxASqYH4P3gokmzNea58mjDIhE1KiI67cBxYFIGS+8OHTFSBItQOIoSEXBxPoaxkjAqeJK9ZysCJIRFsxPHVjIDBptFedcmR6ikv/D1jGztyhWpm9nHfKSU3QYC1Hjs5EjHINyAxW53h0dmItlh+FfbFk8k4yEcL7QdsBZLLudG9emMVLEhTIlB1Ywt1lAgiz4TtORw1iheSzvZO+mOgExbb/K3hDJqnSNGiXWTRiQ05sR73myDY5Emzp94yt/KEZSm44Z/HONLJieOQev5x0wdCKE/18YtMVKSpjU+Y+cPRhJQXPx0xikjJKZ1vzHoYAi5QlnTgskqFRO04VBTLO01vfM66ayp3CGpcX785GEEZioN0fZwMGEBNj7fGctoYEoCa5385CFC4mrW+VyZoJpBLR5dHgxiMOoJJRPQ2Yo3ULJ8fv7OAhkUUatrwPDxkujUMRAmxO932wwcMBo+m1nV5KZEgN+RXPGIhCBpd0kJuFjIIdCYbmePIyZYfdcwFp53kbECgAMkx7vxvBDCywpg4VziIRsLK6TxrKoV7aBwzPWPXzjzYWOjRqZyFSgSH2TU4omZMKsg/wmiDCeD+Awn4eezgnVDsU0X9ciTIAWeHWu2E7IUdSQPn+ZKmhLBEAqfLgT5JY2+vNuE6R0CMu0+Awb4qYyVc+14dqGpIia98UVLIdujry5YSJRREyvh12MqOQhiBuh7lPZ1k0IowVDdrTjVYS20F0QG2fjJcikiOosgf7jshihAzHd7OO6Q0WFOs9O3L5x1NU2wjDpzbxOKJpiKAHf298RLzzHQs0cc/OCKyVkPGwl/5kLKphQEW9z+4TAFSAAb0HnzlmIq4JXpeslWlYCYR6xkoZZUYR6Hth5nNSoQiP3lMUgo319MJJMMB7s7dWYIIQQVpbntSObrMwjNk2dIj0nFLkpAhcCQ+UJTOTqkQOFb7Ppkt6o6huO2smSotpFdPg8YzFUD7L6aH4wK0pIR6P17YoEJi9kSJ99zsxxrlCKOI7Y9TknfDg6V+8SrQlDc7Iev3WWkDlUKe5qRGsFhAUwBtKxKXWFl2aTM8Qe+KQlBJrycvETjERMENBULzr5cpMJCO9ceSvGDE5KSQs0DXTR5xIkaqOL3aX+/XGTiECUBjU/ergsWJDSHrq/SffDPgSglCp8f7mtpSVFRxq+cTRnHUNvR9vCAU6IuGsVqmoRuOe2MgDSJXRZ/p1wRkKFUCh7e+rMEnLBEC87dkT90AlUyXbeeKK477wpi8mDXXg+y4kEChKBeHr9vAexJFhCduYxkCOAV4MAVjgmhymjTlSNU2Fjt04+MRFJwMOxZ64FAwz/LPAYITF35VWe8fgx2EaSsMxHy9u2CkysEAqwz0NHTeuqMRJqaLX3u5pIqJCOs116dMX4FVGOId44eHNCK0LT04j+ZBKsgTfl7YU3GREAmzdfjChBUutmojr1+MlREigATz4jDuZFlWxbr1m8agFLtJdt1x16ZKQlqYJ5O9b4nHOkkKdypX+ayaCSGWQ867e+SGJsOhj9ye2P0qGiA3xPWqyJaTa3tq+3TA2oESwXv03jEpO+3fB1vfXFRYRo2+6fkwl12hAeh/zGByhnghKH3xSXDMhJF6CmSMSKcRDqdkwYROhMgmh/uCJoWObk+Zy+goS0Ot6ZPhwZL4CAXsOf8Ac7oBSp3XL27+uKIQnrAwWfaZ843bWkoDpVOAiJm9kdNYDZmEXCgJrz0yeKzFABW6n84wyVggR6cZ3qtgBR5/5iSoYBWp3065LNBFq4mvF41Y1gglW2o1j1IMFTVhVc+MAWSvJRXPLevlxCy8lVTu/vBESnXlkHp2j55xTJkngLqt7/e8R4lEaRD6bxnBGkWvn5xgGcIlLy7MiiQcW0cw96O2NAF9I5l9L+MULBAOb5PxiWOohiUjmtYAiSeSB/jiawVLAR69TBNRWBUnJ2fjAKcy6HtHx+sRb1QRTg+3167wQMNSZqtQ4cmF4XuZjnRmzQsIgjmf8yFANBChNHWIyU5Teg4/PnDhxRmSGufaMTEYOwYdnOUyqDNDq821gIEoqujxMdOXt6xLDYUrt/GezkgLROgrS9PzhhQ2FQX1PC5NQQ2AIorK0j+8U1iCSRqeOLIP5gsEZNLLd9UfTrhbs7rvydv4ZDkblDXWPYvVYjXGCV2ER45wAfoCQDripMeQNPjFuwIOxOAdQ0A7HH/MmJGMIjuiDWGZhApn2cA2SLZ6l/F4FUEJCkbv4+cKGZbcKcvdacIIbJ1L+T+YVBYNilT3gK4wpqlZ+UEzHxk4om/EJ+h+7qMYWVK0Qa7ecYWrKGxP196YgJQJJUTZr7GSAQQYnjXtHrhshsmJhVXfJgpL+RtT+PtjGFmJw+/OIWgA9TYOyP3ioKJEuUh3n384gAdChQ6un9MZpmQGnE664zEmQuz1HrcZAQC8jR7z3JxjeM0pN3iiMhgMzbh96xJTSW+B64NA9p2ivxrCbFFk3qo71hRSFsi5dPuiMPE2hiCO5PXZPrgvBLSxHoj2B64hhuCcyTTmDAEoLJu4mMtJNCUCeSJ/67YxGj3WC/8AOcC8kRZYeC86iEwQQm2OuPUlZXBufecFAJCWHvD529MNXBaABX384qA1sITIrCfffDX4RCV8z8p5w1QyBPQ9v5kwIFiIFl/ExW43kSQwJK3UP17eMmlo0TIRtke3bWIkFKQsj8c1kmggC1ZL7HfZ3wEhMIhG7v0nCDkED3PUrrrLugoEiKkjp5wIIWqFzvfY/WCqMM0s1IYNrBqPNnt0wAYhHSXh1wMleosG4sqPu8bfJQ0B/O+I6twJ6uiOMqhTCUdFfH1wmQCwQr53cjhETRhkQUEnz8GOpJoblyzMawfDWiXsj364wyLFBHj7OMcQY0oGJDy/euNSkRkSR1nCaRMwLJ14YpaisuJ424F+cAZk6QY7BDRIiHd4b/5ghQXXSHpLiUEZAkjl+cY2VGcoBohNu1jtzlAKiZg1oOd/aifGtrCsnzEnpghASpVMR38uFQApF1DnW5e3OMRKHFEBlv3xnAEySEbviv1iJ5ltQTqhv543eIrRyGaOjzGDB1hTIQzMcmGDbyyQTFe2LwBZF1z0ZrEqRAqCOet4TlM9Mh5JNWx6YgpdmoEdLvn8ZJVgMdD8x/mPMQTaR+xgdaZZPodu+FBlgoCjp36BlcBbg7erkdUCQq0N3we2NWM7LI/bxGGXRFL1GKiO9/GLrIGazKH5wHxEmWrb46nfNRzEwOiHt2O+Q0ktYAlTTIlZqZwIIQogK3iqEu2FzyLufzjMAZHXthyBNivoV6mFjriACXf1/uHGUTZ91f4x6EIGFYQ6+uzEFCkIDXW5jNkih1F7z54xKKAr0XW+4fjDEKAICMJrwfe7azBJfZ9JcITXqgJBq971ilrIXZhiRnwbvfXJLsW5IRqL6/rKTQdIxGjjiMkiQUWG1QTvp75rayVNs7YDor1wGyITESTx6c9MgiQujJHFdC8LjALAjJ/njfzhiR7B39/u8gJkRsTwmN4aoEtkDL3OPfDeTUVxUX3zRJhFgjqneckpADCh3GrSZ3GPICDZSEkxu+rk5CAtCv57ZZ6QiInVxm+jG8gZIuqvIY3eCcVPrx5yiEGT/I/5fjJoImKk9XrEE4pM9YkmCY98lJQHYSyP9wAA67sPHvklhUgth4N7/GEjubioz16Ybyo5g9fxWIQ5SScaL65NpWYsbso3z740UkodFxTt74g2l0BRFR2P7hJYUCUK0N1qfbIKiQEIjra9+N4Y7iDIDgIO+++8KWWJYwsB4ddsFIBQ4tnev5iK0QSxT19NnbA6UBEQ89eZwLQWgoHuvrh0tOGwNtcrCYQhBM+tPc3gySbPiHVfeXFZh5RoIivs4TyqHlLsyBApEUGyvMTkDCSA0sHzVf8AclFhmD9MiTEz09HAkcgp8Lf1hk1OgBflZ69MQA8CddxEE3v85PUZoFb67/D5ySM43VpV87wiICOX2I+cZhgCWKdFj498iqrgEl1qL0Yl0ImNg8J++MBKifEV2V6XiJNYgpOV2L96YYwMqYaRJJ4nICIFZcmLltj9+uPwLqE9fP6nBLUqKTzE69O2TRm2NjHjzGuHGHBB5KghrWNgIkopktg4i8giBQPBMH585FEJPQlSXz3yGwRFQqfo1OFG7XMj9Kwm1ShK8141TyYw0iSFKjpF+MLbL5iGm664MkporV0wCSB2Hr8H5ySjvBce8xxD+NYqRmZBhGgX2uMC4MpCsXyV1OmEG42mvbrXMuNqgVQJJR6jiI0PW4fXIIqjCNDCr5ynCpTqDcZS5JZyr69Pz8TwlDcKsdHnXtGc4UU9mfu8AmjSJu4mNdfZw9EQ02r2KxIhlIFuTU4BuaNi4kwWmjRoScR5wdNtGREc/Ea74x8SkWXcxiTahJePNtX2xsI2whQj5o9KxkjPMVA+3T70agVUZ008blwJaoEWBP7GQMzwiiIpXXFJ6mCkcSfPriRYjCuhz9ecCSBkUieR6do9sDQCqDDC1xxeQeSsQIenyz7ZLWfZSyDc4TAkIMxSr7MucjGIMKczx/TIUEJuGZNzX47YEOwkLKv0+mMqUkpCd7ybtglpR5ih+zkUkjDKXU8rxiBWj3ImPkD1xpjSiIu6/eRoiZBXPPbDaRUslurnBJCdEWhjR6Yl8C3aeL8fOGRQakCtn8T8ZakqCcDBIEEoKxBPoY17QPIsOS9Xr8YgALmN7g/FZsO4jvp/MR4m8RLoeOpgQCYJrdAr71zeWkzKnYPvbnGCMVlQoKbmHQn8yRCAUR2Tr1ybCU2L44jfSOPUJWQyhfSp6Xi4h4VtkNR3+OMCEIkBCnvhQqgIHyvfRmgRU0hjUHBfXBQmSdUeethWMBwRANteAbnx0cRECWQMhwxN5JechAATUX06YQTEBOgUusUIgky1dz2ifeO2NYZktZZjfphot6gV1XJXOHrGhfDL7/mE5GWYWUHipfXtjakkYCejDXkpklibj0fvAQrLJpItPu8mMglIqPj29N84Y0YwjBJHrPfNRmKoiI9f964s1JAWKhj/ADEiEEECUv3WOwdcKWAw6oafPp4xoqcZZJYni6s/OMCjZpVtHxvC0uyW3HGPi4CF336YGyT3D1f1qrcIfITq7X1j8OQCGoXDAw/grrh25SjAs6X1IciZZHTsLPf7wtwanJC01048OOmwt6w9ZL+6xgYig30HvkCuwXc6nhx6YGimpYf1/mGUhISOg8PFRmwGsSag1or/AJgwEpQck/Uz9MIIIJYgd154rELRiYDwT31eMGt4LIq7UmzCVgiRCE6enzjAwPfEp4tgsAmneHc/eZ6ZJwyaxTc9TXtkVK13QK14PxjAMoFOPMWLrxhykWi15Z3Nezk3qqPHb0wRoOwtet/7WCiIqdA/mvj0yTPpLCU/F7MFxKKSINVgtWGJwi3XXj7Nk5CoeLk7TgwCRKZALvnw4UWEWyzda/uR4lo93XrM5JKkTDomfRIr3wSQRHuqTdd99sSCFETQ6eOL/wC4snmigBjjQTs+cQJ6ldY15yFwIEcnUSknx+sRUATILrUHGQJCaC1YiJesArrjEQFgGO/t/IybWYdCCNvTHgaoCEDzVR4mMQxWYhlIIXrLPthORR87GY3xWMkbNLYGuo+f9wCSchlir+WsI1M6sahMHTfHXJ/ZK6ZCJXzCYqJIzI9K6vZxSb3LIRWjVY0UJ0lkf7fth5lkWT3kOnnGjnaIYB25nUYKCqSoEap35w5iboNQJHFxQhdcjZ1+9MhtEBQlGU+DFKchSTDr4xzIW2A/pxeMYFVxFkkIDrH7yWE0FrzfxgQCSBYi3rQz+8M0CJDe6KqsL0E3sTdU+PODBnYI1cAs9Ij3yTkroHQPGlsyMXp6TDjCvMKGH8xxmmTCAj1gd8enOR0iPkDVxx+sUTo9Qde/8ywZrKS5PXn84aSAFrx3whlBRhMCIb67wYmdp0k0v584qZDw8gPrz1yS7J4ipwoDMLUJxa605Imi9CcSen5xMQBUR/b8N4UCURzBMN9NdJwR0TRiIuu+vfEywISlidzrPtircIiRB3x0YckJGkbiIfvDWF7MalzVZEBMFQJmk7X8uJESGQlgyRffKICL3LOnpHTk13ATUVr367HGipAlcDAo9sAbBBBvnb3nFxqYQEMomKJxBFkZDY9Xr7RlOtkdGth0vFtEjSQ9sVGKAe4OI/MYjTCeA8llXc9jBOnqC6p+cj2QgCdeusXUCAaISlqD1/eQl2BFAq/TrzOMYdKpLC19ZT4w0mgGhuDfWKMZSQZQGgzMRDvXbDGa90UOjzhhSMpGA/Tp+cfLyqJUHMa38ecVl2JImGm3ncxkK+q8s9QDvF9cUrPvd9Z+8xkhmXQ11Js8TjgXYNwJo7391JzIwI2gn5xSlECTkefThyxnd1Kg1HGonCTCbukwEs1v2yY1pBKLhiZ6f3OIJQSdH2384OLfIMEOPWjELqFaYSYeDU+uKWoQMil+prxiqqIVPlGvGFqCBsJnjs4MZGmQna2XnFsSkNSkhOnPxiHGoIEdZd1G+NYVirslo0x0neAFQkhMU2L3DBJmGSnbHnVuv1iR0JRaU3HsYEAsVYhIFHdc5O0gkFir33xISYAQzLV3vT/ycdSQsATLRP8AzCUAKGEdKZkxK4VWwBd/MYiyIoIUmfh3wzKbm46BVF/jNQODiZH6X4zWY2IiNtPGIvVZBeLNV4vJnuKCnHZ/7kjDYBkq7d/OWI5EMp7/AJrCZhKICWXS9/btjgmOaISYZHjx34jO9ACgZDpOutzbjpYhalng+fzjOAQuI04y0WHKlt14EHzkR6CI7Q6+PbJI4oEiEuItb4yXHLhQkx+ZnJAYaEPBUz1P8yATJpDMrukipbyVZkwgadJ/3jLRK6hEkJIE8fdscBokfRvt+clxdaQeq0msSgSYkvXjURH6wyxXsuGyzmIn7WOlwaorhX8vDKGgPK1164c1RxGFpK+4+rhK5yktCLU7MT6RjKtIEFviekmM5BQtJHXnBCKKugm56/POGlBKydii64nCchSWQEypKULQE1XNYSTXfC/WT3f1jLJQiKAxcFD164MRZ9+EYfJghAq11b3imApM3KTK98YIEhOYQpJHx9nIFROiY0Ps+1+cUClJRsxNb3BffAEswk1NdTtiRDaQRE6noMei9DCpNA455XrBk6nJCuLtmMDqCo30/BF98V+QNibDvv54wtcrJ4eseqe+GvzmNo621X4MVkAQTIlHV9ScjZvGmGHV89P8xQomg2qCGOHERWEGFNEPEV+MCIoyo2N+J54wBSiYPbX6w0ZZlZFdP30y0iBNSe5qO/BjTAgZKkTTknEFRMQPC773xPOJbEqC9xx/MZg2RTTAI+pH+YGxAZ0yRfo+5gcYjCkbah9q/wAxxKRZYjrGBnDo7BExqcc4ID6z4nFJLphBsPpOSEAWlQjAdv8AmJBjQDBmI6dcvMd5rl+/3EMyJKEFO70f5hNfMBDOnxrJA+6h1l9d85BlDcNNTxunWHEMUbFhzW5/eQDUIa7OQj8YKoFio1PvgJoGv+HknIVMmKo2Icdp3gO5AdpOp6YxzHsCbbp+s4FuQtVDwa5wQpYloNrCeuWqKJFhJeq3kUtAgp0md1MecaNWu2efSPfIWooUHujcRD9nAuISmpkTzUT75LGUUCMVdd4d4rKSRJQO/wCPN5YdKTRsOvX/ALiXgSoDfYT1j+ZBODJVOzfeiPDg2YHVJoev9/raLNHcPz5xk7fBSpsh+P8AmOyulwPEvMZKSATKiL3R7dc80ynkZW4MCO0h7BL7ZNywuyw3v0cRrYpSGvzMuABonYoV54t/PTCEixBWBlGA4ucZmcUI4hc+lX2cDFFv7An7eOPIaqWtUTBtw4ZYdSLluCP3kpqJcLQ5IPxhEyaICJWTfMHj1yRUai56emUENl5DufPTnAWKTIuas7f3DpvCgk2w+uDkYuBKsdOv3jFOtHhJyf8AcccLAYEjUfHHGQGhkiiq69PXGDWyAIkPPr898ksQFjYeXf8A3eQlSS0mGo6/nDJURVDMbXVxP2MJhtJjxK4Zg/7kjLMrCCZmt8v81hsk2TFXJHTjE8XImAXbnnV4yaupJkbr0yAzVQidMDJGTAiCP7zg1gcr1PfXacVWCQRJJSJ45xMFALhjktjAFgWSsMann3yGKeWssvf0n2yygiEpiOI314wedhEUOfpjwKwgAF4cfjTk951QLvX2MC3ZlJeUy8H5jAGatMCDy7vtgmIUOr69PznNUCUOvG/9wrIkpWeRn0fdkIAFSLE336GHng21u3N4pCJIZacdPXLakVm6FsyM5JJEqAcMx21rIlsrYJ6vBWowleESlTg5iK6YgTG0Couuojc46YchgkdtTgTbDaCRca35xpIBZLN953eBCVjMEaNXxvtiOmCCi1NX3ySVbpQE8VyYjFEZhbH+dO2Q1TiItpuOGn4xOBLpIE6moEE8ZFeDKhY3wqs4SBKCDjs+DHIyhKaDyPeMgyiLKx5f+45VChKysLGgZU71f49skamA1N3J96YBU8gElhUTku8lUEzNj4/5gCRxzO6o+KyXGVA3Hp9tl80vmuut4iI1EWNxf3v6Y2VQK8wXvZxjANiE7lemTrAyGkwV39MKRCwMhTpZvDYWZaEvE9NPvgaDivyKPnFABBUiBEBMdJ3+MkPTeo9P1kniYYJ6vt4neIyy7Kjw4ixoJQHsx64ABEIQjIeHrxxkxOLM1yMTlpbVQT+fvbKXjaAbguNYVwEQGTqJe+t8/MHSyhEAgu3iWYezkbUaSQuJNTf3eQIRcDccRqNp3wsW1hR5Of1gAksJlKiKPb7OGlF09miZK9LM39vCrZO9VeVkJ3oRffnr1yNCS7FnPnB1wWEyzelmvRyQi0xo+IuJjJMvFWiL0a6fmsFG8oifN8YlZUNyDx23P2oEboRAC0XPn85QShIVcxfoLgnASQVuDb4xMQXABBfT8ZMRqQWvLHj/AJgSHlI0UxMWwJR1xtZPiSmZE/HriS6DVRSEoO0392ZMbDuraWOdz+8vehZOZtiNfzFPGADmCE89POCIqNV2h07NZBLsFCSk399ccACwiAKsmcYJhCBMm0Z9N5JooIrBk6+/t3wcmNoHlKPaPvjQoqld6GS++XFIjcoFrPNenLiSzBZiZB3iTGYFZlbd61f/ADHPUQSqvd64mpnABGmaI7e+BC9IoE8Vi2wRCg/B1n3yITAgCUAYO0ye2TFUtyCdtvPxilSBIYWc5LRDPyFY42e2Ap0gG0l1vjDzTGgEIAN+RdZOkuAxdb+mBqRXBRPMx6/GIopS5UVEQdD85MghIlfOJMwSBgC9k7+3vBB2KUik0zzzkAAU0ASxcPj0ygxCAZE+h9cikQQ4Jd4dLEJbFq99Hy+iYKCJSxxWtxkB4RAgbV66wZblkJCwR669853UOhpYNd/bIiIjMCEW5P33LzUiQFzVHa34wQz4axvTBP3xk7JKA6DcnphiwETx3Mcet4hc52HExXAYUQAgoeIdnHxjAQFyCVdCXW8px8EhvTvkYpAJOud93Ia2jodV+p84o1FIQ2bT59MmM9dJPqfjtkQyahwdI8e2LIhjqRQvve8VbJQBMlM3xJ/mVYAZJomT1384uhq2QbiOpWGAQgiETzZezjE0ksGOhZ4IrJISxIEnAdm2/VxkiSBCEOnjKP8AzFfQevHvkYQBCkX6ts+cIFL4jBz7RGGrMpDdpfgxcUpIBAepZ5+xjGMtFg5T16e2cfQhwenJcsb6YCsKopio7evbCFAWvT1opXBI3Y9UVJqCjXQwJIICVJbrxvI+0yJUv43/ANx0tkkNpM39ndYKtEiod3GtH7cSYPaCM6/d8xlDrkSL+Knn1xyCZRMSF5neu/GRbGUSeCo+xkylY6FexFeuLqAmAobVvz41iMIStazff6YTKBJQlJDHXqgLQnt2y9Q1y56DrZ90y+Q7h46fGJkFcSM6/eDCFQRLOWDnjAdAAkDI9WB46YvQ3CeS4PvGEq4XS08z16eMFzQggyZ6jwb/AO5UXcAQea8rjgOEA0Mkuu/z2yNYVopiWl6cT+MapAhICCa9N98ALE2UtQnTWCiSy6b6nv7ZLXyMBFBYqOoY13g2tH+zhAIElGSUn1xs0hTIkV07eciPUKh5O79jEFtEyIH19cklwDwK6e5Lrr64aBhKZIcNpHW8ncLX+cbvC1iUKyEeJxGwFiIueOvGSbCB2Hu78YSiSCIAdb9n1xVqJIItRx05PrkKsJIolcvMV9jBGKSSKSp63fyYg4kJbQ7rvPriYQSSNkim+NTjJKDCbGOpuTr3xpQ4mhJk4wQRht0OkdPbLEuEaswlAnzhZNBQdcLPWsNIEjMdBAn1+MkylBpC+T12YDwJ8gcLl4wzrCfNwfLOTBJCfJ426OMmDQgyzdz7fjCYNq75mP7gxBGkQQDD1pyeZBAOB2+s/jpiRwiK6Smo4NY7HOwG29eYwDKuYxO4iWv+5QNaMJZJ+84qEgEtqu13gdioDaqa3WBgbAT5vPDD3yE3ItYE3Ha9ecoBEUzUXFTp65PgBsDbvTF47WNIqkTW29m513yEYoIlnDM1xWOKhEK0dOh6ZClavg6v3tktqzk0CGiamf1zkmnIiyF5SccJuIWDc6mvw4lAEeoveKSeCEaZe5U46ZAJKtOhx75y5Gl8K/evfDEEk0UG2remLm6ZAC9Cm8YRHiu7c4+KHJfdjq4BGhIYuErl9suoAQygZuX14xiTRMJSy0x/uPhBGEiB3r1m8vpC8O2rIJ1e4wW0SuEEafnHWwJsFXv5K9caEDZbt9ueepiwWWLCoI6zMdsQh00AIre61rITRKILXadN1zJ0yCxLbAeKuIreDLmwRQMRYU8f7gwmIMLDVOsg2SMqUF8G/HfHsoIodf6bxAwRYaFlPNnTvzgBB4AUFERnsXN4aQXU0b6R68ZVgldJhVp1+xiTqih6tmn72yeSQPYT6YM1DRAewffXJU70WCOoH2sUjOL5kTnvC/W5exKWMj1rzzkoKHIMT1cFgFQKso316ecWWSFITBXzMuRU0KBT0/D1xdAOGdJ/H5y+9yBuX78x6uAsQvATuexM+THYUk3aX7BR7TgQriWo8mZ+uDVrQSU0RxDgslBEjRPPffjzozE7YLXv89rx8JIhyEyV337Y5rIYQwO48XliQEQyksdZnUHpiAoyKJBie5uMgsQ0iLoak/ftrFhVSAlivWr9/ZAcoWOx4Ohv9gyZssksq9mD5wBBRoNT1PXriDWzRJpPbWMyjAwkMqrXq4b80JCYdvXnEpgzaogROP8AuNcAulhhqOcooTnAWw1XPe8TKygi5nv2j2wLoLESRt36/rEY4wg3DZHE442YKhgsHv8AOBhEFSCUj4HzkUCl5BgLMqO8HitJkrrxz/3NjRZRvv0P+GSNMMIkSbrr5+hgFFIi2TpJo981rKgNnb/euLBxtktVNM61rxhInREoPSonJgAETBIegTgCgByAuat6fOFghiLqYV8emNDNurT4erfXnLgGFKnfX2sAC9Glfeav5xAECLR1GvPbCBAm7BnrudrvjB/kGCtXRWF341Mp8YkYI5bO79XiTF8gTCWQzPXAfnFrbab4N/OR8pooXfftgGgMhLKK1zeF1wo6bgIiifH9WRCMoUZL15jFCJRSpFiQd7h9c2UmCuRV43UOGVyqipc+OPTvknMSxCQEeLyeiBEoRzpnnriyBJBCl5HrzhvVMmNnn+/vLCTbVU8ejJyQqRgp34PGFWSMguDYj71q8h5NyAR/S/fFEsUrPBIj5xgBGU8qB++uOswSFVx94PXGYUpS2mgPOE5myE3DTG+X6YBSDENtSvb/AJkaQiQE0VgkOJcLQg7Kp2HmMEiOAoeo76PIYqCQk8Jc+04JHqLEkOi/395qnQGdLrujIGIIDTvfT/cS17FkUs28Qa65DSQIAtfnr5wGFB2SBcw8xzz64pggPS+3m7ddckgAQCsGp8eItyiFgu0jpR3MssiECDROP2YQKqLGC4vdRHNRWTQSXm1o+MjawaPKYfyYqHK5aSqrrPqdcUhJgx77j84yZGIOlTjRKqUOWkP3/MiAqmHTTH77zjJqYHU2fL8HbBNIWhZg8NTjLKssEPrtmvTIJFRShQZgJ9kvBNkIYcdjjjAMWolBOu9/byFR1pEbVjtE4RA97YHSPT+5MwKCEnlq+nbBcMLTIQX8RjWNCkkq6HZXfGMBQkekbPOLCJkLmCE8emL2G6D0T94wTrCnAPz+++SY1dlPoS0+v9bFTijYcLz3woDdEEENsX03m9FMVE8R0j7zjeEzIcOvbJiSoEbFenXG8FIASESFnP5cNgCYhtv9YjFK4I33jpktoIiSiTP69jAomYBAZfPiMkzYpiKRtZrXfA1Ld3TLD6/npiBnCKhgHavzggijkjURy/euOsKFqQqxrxrBVET7QEXHt9nFDLiKQhncfYxQggHgcw7qwodSFQw0VM3hjqEImUQJuN1jDqdzLRSzEUGZIegb6x9ZxCAlzHZ7fGHNFQHuTXr6YkIKMbyP9j4yUjAQLAK16xkvFLY6AOmterxjJIEELbv3qXtOJ1tNyUsfDg0kBRCiE55mZyRYAbxFRNHpgXyiYjM2m/8AmGobRFd8Mvr8ZBGloWPaNRcs5I4EGGVQTweuMSBKJYERAu3jNIwxtBF+thkSyBiMUbnnzgE7MQRcm/dNeecAQpiXRjZ7e/XIPxSS1uI86NHGMCYaBMP0JDiOJ1HylHfGVWBI4YCY7N4EFjBRKL3nnF6qVOtw+ijpGMOQikvQ3+scrC7wO76xOTBZjjcEfyPUw+dqELz3/WsAVwnFheX0/WNeaoMP6ViVVIkWAIL7cH4nBUoSCAXomz64B0GJRDM8ecBgIg2KEy3xiR71A5C4qDEAizt0vzOJoaWPy94x4yhQwiuesxm1WwTEpivX9YQQcRIlnp5rE1UqKjsf+dayTPS5kRx/MVgHZPYD0K6Zs4INKjy15rIUoYC26if3gDISpXJdhzw9KxVJySXOuODIDxCjSCXXXIfSGkoheq8+mByJIQsXHrv2PGQ6woGzgipA8mFINqBtZN847DK35ON9nAptUSCCdwPHgzaoZkkXonafs5YrSsqnbn5+mWJYwq8dQfXHJZZjacKO08+mSTKkhhfJ4+PGRJJOxnu/bwof1A1YPg74SizEi2+kBO3pgQIqj3R6l8Yxp5ltHsz5xaWCXMD8wHOMCrbJMKK+HWsAqPTMI8l+/TIsUSJWgIK9N6u8cB5gDcNTxzkWV0URtwceGumPMSmJJ0pGtRH5wm4TO7E7J9sQ0RG+A/34wk5uYE2+eO3ziaJioDu9furgQGgFJN29JclQSoqpVEk6C5r3y2dgWxIgK9pJ31xIR0AEF3OmjJ0EpE1Eq16F6reMPwGFrdP9wo8TYCP3vGnkksuZo1NQ49ycrsOoLMS5ssJGCsjSUUGHU6fH5yBgkBJrv+J37ZBXMiCPV4PjWXA4QKlzX4xGWBOjqY7YEFYVEN9dbqfbCghKEqk1+MhENRCkHk0+fnIboiBccj7YsiYRDfW7emq/MzyQ5CU9RDRjVSt11LvrUPbHTxzk5mGt3O8iDKosY5paijxiCXwXKfY98YgiRwRHUzQMzAhwsReAyWZkDCy0e6+uSIS0KAtoQ3r/ADEjQTK6ete/xhbPQLjq2sNcZolZIVRrfYsOMScOVCQYYj9Yw8sSmk1T5j5wlNICWdlBxw9cOE2hzoX2nzOCZBmECAnUvf1jJ0MKS0IkTxca74OEGK2TiPFD1xQSglaCxXmL9cDABtcHJv44ccuoRGXFXR/MgChIoWBPO0b6ZNyAoIL8Q7YQLcISk9mOtmGMtQqmoHqbO3fBNspisOvxiUJYyrrvkI+M2wiMNDy9OMY+kgDCsz/Mcsd6AEQ35+6xGwbDjzdfOuMOtImFjesg4gqEkeZ0YhcT3o3R6uv8xj0knlU7Tt3qDG0gJJRxAdrxHRtTRZfHj565rkfKqSTt6M9MmjYBZoekGSdlIlBnd+D65AICCTCbSObrKQpLWHQipUdsUU1ixqQ1+1xxmWZTRX2cGWBBIJVCTr0wUGRVy4QNDfhwk2yOie47vG7qQCSPQ1iUyAKIBEwddmBEiIQLQ7TfHvkqENqhAAD85BECD1MC+jxiAyUNk2vVlyIiNi5Y1MdLn2yQqGVo4kitc4IBGMgSSI9LXCgTBSEShO4uh/mJhIZao3ok1/cnEEuAgKrtHfJq3kGWxt/uSMQ0Kvke04kZKRRGGenLtwNKRBIbN7HrPqYyJu5EH1rpC98CtFVnc9F6T41xlJQadFHcekPzgLSSCMGeh2ZwQRIaJhJH2euIBSzmELfMcRik3UHQh+OmPKey43+EPfGEsSFRIrcTHmsJGTRui6v89MY7eEOnDVwwYCE0paJpv0mMH1qCyI43WSJDwJhi+Oz7ZFLsXRYTTWrxZM4ityg4sQASBLts/fU4OMIGb5J6+e8bx2iiELqv7rzkDAV2i037/GCYFBBRmdJu44yYoSImFE7wULJZk2CfpgjCIo0NMev2NuUFgkJGr7ecVE6yVoqzIXWvz2xJoDIiraPJjoRBjGDWhkcviq4vnFUJBkzUxVm45+KjuGEw8mCXpWAPAwVIitUb10yYbCZCiaYnfnEESYJdIOfe++TjDoj1vCzHLdpOkdsOFJVSTw8vzjwgWTopTV77PTCkQ1eW/k4+MV0SkPha+Jx1bFRQEh97wgOSGrVxunxGugKRUahhuoL9cqAKlRMcgx+uMAbhIBOw+O+AIrIImQYfv1kjAjPJcD0/3WQ0c2Kj6p9MaF0gWvadefbEARgEbz560Tg8IpTLyTU92/8AMgR0DRXKfg5rphbqJLDzW+cRPsLFhSCWqibMLgoBKiF6YKoMwSxRHxkZApgQK68SR75Nwl0lWaX727ggOKMaLyhr1ypUgkbZmYDsO8CqCUQWkQHx7ZI0CQaImd6kX3yNRstMzqHvUPA9cmUcSSwaofasbgRkYC9O0pOEnNwKSrCd7jGDCigX0k484QZDwDpcRb476yVQdCwLjjpJ6YVAUtN8kv6wGAQKw87eQr7eWmYiWuVO/riUKDRSl4O07yT7RaqQ6BJgZF3o438TkMcZA0S+MSaKKSGb/wAvNFhspTRxbrteEkhQIHQjn2yMozCqAn5ue/bCCUhNhfTp1xSYN2ZQ48VzuvcUZQigRDU6/wBwI5BsAYaXfOFkwWEGBeNyN5sRCAEgAfMn4jNIAi6iURfkM3kMeS+XJXzgXejBZMShgASE6At40XHvk1ziRJRKC9tBimbSZVCF1v8AObtOW2FsdOCMiTCUVq5NbrTOLwsLITX9vco4kWHIF556e3HzkKmDSUabjxPmsgFREFcV99IxpAi+7dxcRE9dYTNNoVchWtfnCHa62oKijQT6bemRt0209a5uyeMLECyyTTgm5wo3hVQCSY73ilKOCHcjCTsMBtgr4fulagQck41GOKWRFJDcN4R1rgJQt43XrGHBS0LKio1L8YKSgkTIQ9vDkhHASDQw6erBkDdgCQj26zg1Q06nQV+ZePXAQlkAuS67VeDahA+ypOkzgVkVJCwh9nPTHHaEHBvQvzv3wAFRTCIvW99/7jpk7CscM/bwSMjoEGefnARuqClOX0N4KEPAhtZIy7IVAexdX/vfAgGUJIbWDydjLRhsNqzRG9m8ThNKoN9dvaMSE0FhBat71058Y6RbQiCZDy1XbCbZAsFan2l/WI4gVBIBzzveRzJQqnLW4k7ZZnIlqlzHExjo7CSngbPAxkVKAamPJ8feqakiSAT5LEwe+FIDJKg+Pl9c2NbSGI6HV/OBEQRdFuOeuHQDCCRjr9/0OQiVBp5t6uQpVyJm73H28jXIyEcTU/hhJvn+ge0e2Eluk94a10/Jjju2Uu+6jZhBjSqPTKJ7NYiAQEmrh6emHNP2wjdh6fM1hAo1tuJO3fxXjECgAYoSvZrxB0nHQnoAfqmu7j2hOGwua49e2KjGopuQ6ejkKbtT2T1caowi4V7ga9shAZZWZOyPO3DuSMkWqlfZPbFL1YTxLO28E48JlAjZpwhzlxSfgdkT4wAII0pEjl6EfnDoMCxLVvxDhfK7KTe307vjNlAgWiXqePjGmUAi1KiQaoxoaKkkrv8ADgQABIbFdr7zgBQCQBQ4D597yzUlbEvWeAnCNMISSE7fyecTShY0sMzXv64tAQCJ0IA6tejkuCXaGtYw6AAKiK2euMyxBsk0Cpex75HhN2Ed/H2MaV2AkDKIrVLggxYAxRBfmnU4KoGwgihFfwySKTEIR90VJvJTRolIkGfwHnpk0RkCwK6+P3n5OkpjX4wAZosoCCRZq+vtisgbUx6poO+IGEpdc9UOfzjVIzITpt/HrkaQgSoq6denvjUuE2aL4J0v5y12XICXWZ688YCgSgBZ29/1hMHYQbgj3xZrMJJO+mTtURJo2nrH0y1ELAELHbtJv94ZsgZgdfQyW0TomCDf69euShKlBHA0PbBQ1OiiBAb7Hv4wzYyNnydFfazTKg5Ae2zJ4WYGYt4e28EcELdJ0jloXEJNLdYntpzjILCH8fGSaIMiWZ52ffXFYn2Cj2X7Yg0ImGwWsvMpE3WALhJe4K3Bf9xzLDlSOvKb35wSNNB0GHxbPrlkgPQL9Jw4QFLhANSW1I/HbLpChDNJOlODTOtlS96Xvj1DGAIJCAkIk/MTgKFLol47eOT+YprpGKyMJ3vAfwOZ1OvjJMkqCwkmt8uLOSJsZYFTrvEb1QsF7jQ76bwawFMyzCd+0+uIkcQNCqr1xGpZCzfZPnnJsTEb0SbJ1x6lZaRAAQWEbL/7kK6Vj8nTfzigMAXbvh4wkmQR5V+OmSWMdpn7+sgxxNiLKGOsjiI64KMoXTza8OBJYJS0uPKQHz5wIByNqXz3b9MSXkAJKva/+4DogG3m7O2t9qxuDyRMR51vFdbAhwvjVw+mKVsimyu+Y5wkCybHwXvGY24pJ2T25rrlOIXM2xOC43SRGpYfN85KmQg1t1e94phhWLXqOm+nM4D0Cnox19Mb5UKM2Qi/zGhFEqIQuY6WechCJ6ZsbK8fjGkI2T6D34b94NARBOQFET+ZQhYW8CTUwnM5W8IsWzzlmWcg211/V4ooYObbWj3Hs46G240VwVUdn/JMIKSJJi+s9PbGMQUFsv7reUphJJLPMuQZQjpbT3rr9HC7KKS2vo6PN4AOywkIKv8A7kxMlGknFc98iYhTKWtBLHScJUlUDhOoYoZAx4ggHyOI9OcikXzJoRqY0NX0y+XY1CHzP28SUouBEjiH1w5uOh1mYbH9ZAU8x0m9bjGEwNOgU0+rWE7prJ0NUZMnUFO5CVV/6ZNgs5Mnlx1pkv4mkLT0mdPReEgUMSuR0XrlAbBss3ZvTvI1DygmIrZu2cQkuACg9fWMGMhDLYl38PpkkSCXJYhrTPmumTHPKIuhfUT1jFFSgi7cw86v0ay7yZVgh0T0jvTilLIRYJR8YgY0lHY3XnFHWwFiPXgFbxQgsioIcvFoZuVDMQ1H2coYg3Kdo+9sADQcx54Dlj84p5DQJYHp4cBCMC0zpI6dp64yRSGQLIKvS+Na95RGwlRTO/vGCRhQg51r1ecIwlOwg9GJX2xERNlHQc/gvG4FJuhiaNHGsbCzbOha8xI/PTIJSwOJEtt75veGZAUWyF+D9rBxqFyJXDvAjBDHQWH7vAm6RRFamHwehiNEFzszpC54v/YwAIQRZqrLT72wKUgFRHD9TgiYS3H8tj285JUCy0TxEK6YFWYlEoWhf83gLfoDQcd/usWIGIgjy9WPWXHKAykt7TG+fjBj2BWAetxH5xhBmWVc9TxiDCsgAKneTBPCEGOEed/XJSmZJAqQk9fbEVkhSaSKLePf3MFCCAhJUhH28kgIW1YV37GRIKGWJbmHrB+OmIWATIZZS1TrgGIlUBew77xM+MIBKWUGU6vGIrgOY59LxJKPcEFnHPeO3XLIQIxbCy194xR4gLZGZa1Ye+CmkYFF3Evb84cmDZDE3x9n85KgM6VMz1orXzxkWgZoPNckTMc4vOLxUV6ne/fI7L0S0iWB8xvpiVtAhvgs8OXKqhgleDrm02PupR8fGTKJbs1Xbzl4yyKgafPOChoISZ4LnQT0OMQNKtQr90zg0mEKnlxF0fM1kBUwUCFxV9OYxZw0g1qf0/8AMmopOxacPbLNLBCXmtDRvtxGISAxzCjqfx29MgjYPgv0mX18YkvBqWVhm58ZGZIRAgP1xJIRzAGIVYqr9fODUIROk0R+D3xaKEOjcs/emSdjZoZhp9cSsCdSgL4+9cOZoiil8Pjpmgh1QiDYPfHiDIIMM11oWsuq68dYwx1QS6YSjrz64WEJ1KkI/MHxkVQIBoCpYdvrhKjAjZ68dZ/GHSsyQIt2wxG6+N4JEHUte+W9qFT9vBIDbZb3J/OOoiyATEx3bTBl0iDANWR/mBSWpiIJxAD5nXvkF5BBKejEfg8ayDSapHUh4o/7ipB0kIehH2seTKQrSk0Sb9ZxFfQaCeR7JliEvM/PF/jEp1tQCdIyYIHIsye+r+MunqOeeHadT1yA1aCkq4Q/rEqGRGWGkBuSpj3wITlIkKRF++TFeUxv1Xz44wgZmr4Pr5fOKY4EosUz68/zGIBXJVfXbTlTgxLSOnrrDKtvb1dkjNtUCSJCqz34cU+iUCAJnR5rGRUHkiC+cUBQlEkQT0qJ9sTkxkoNsWwcd8BWVyBpYr12npiMaLkJZ07+nTIDDCBOktntF+/TO6EEHofoyL40UxAJm6keephCmSxsHUnbj3wmi4iDSCEDpJ4yDBQWVuWOJ/eTQpBksHwYwTYNyLHxORFmYoAVC1t4vUYggVm0oiq14yKXiFjH7/npjEg92mVOnTZ0cgtpwVt7HTu4yzIiIKACJmtn+YgHS1xTyGxM0RhJ0rug336ZTGEaF/3tlRMdsm9+/wC8UyFEIxBwx6T3yUNShWpmLPx6YlAJyLkk9NxgEyTFdBRi/vTFVwSCS8vHrvCKqZWRbRR109yciKtBcQBHbcayEYi0g1FjHRH3MMzpVz1h+eMtu53r5lZ4yMJKgxx8j965VIahLZyFJ64oiPApSlS3xN4RVCSFhluut1gsHMrvZuO+A35pnXdeCMYqq6IKT9GQAZFCxMOQmzEqJjtVd6Ouj1GjGiKuTDxeSAgigVLDik1Zxe8ToxXIQ7P66YWgK1EFu3nEBIKoJ3MXzftiwQlESIDXTZ++YyEENUZipvgOYxNDQTc7LhtcaOylhT37evfEJAlRYiyeZl9cQyWvSPH18ZH4NwiDudTfX/F0jUUbJf5GDAYMNUan0KxHEUEIFzHrrCWWNNxjh10j7GTP5RdI1X+/9kgnJLTq3rEUbSBZBrhm/GCBBMcSbqd/ET64CFsG0zBHPD7Y882EsrbE4wBMagrCdZ3eAmhgmaZqfnBLSyWLVSel3ipwim+ce1Y8wAGdTuV69/TVYEwCSGb475b/ABrInPAJI9ImvneD0gzBwi/ePnCCDCRIVBXq3gvkEsRJZit0GQCgCoF4iD0PnHNlarOkEt+n4xvbaNCHw3EYnTDIkuTmb5vxg0KCEVoju+3tlhspDEYj89dxgL3QgSLg55vKk7kIVHr0+7UxAYQA2KFTWEgl9BE2ldVcDeRajIjv2+OcA0Gg6Tnm9cDvBJGwBtWdeTplLiI5qxXbiY+cjkEEUM9XrqP9zYpZqp4Sft4zropEfatYkhrl0vWv3jQE/oEYJjf/AHASdCpCNt+/zjVaIAMSVr71wnYQsk3MQe2BUx1UrX1yHnsRlVsR5tn07Y/4KDNvjXDeKwaU7nUEm/TriAUEwTEdTxXbGJDlUWsH3XnAwHrEl3mZkf8AuCRDZAbPc9ZMEikSKUTxGAJ3Eg0ywX1zRCCc63XTZ6OSOhMWbY2dte+JuADseg+pj7QFy715vEFkYL2b39/tQSk0MuR6awBJ2AsbxXPphIKkED1yDTuHTfp1x6yCFb67/f4ZWBCUmEqTB7+cVKRIkULiJ7HGD0KZkAb15X7GSF0ZmwVwefXBKN5JMi5rHEMyZdvRrx9coZBcwXM169fnKEtoOUk29Q7GELgF7ljh4nnrjc9aCl1vRgLyxSSBTMPWZYqhmKblYOnS8CASp7P4HtksVBopY1259s08MmVYdAeI9XtiPrpiXW/NR5nCEWCBEveqamwwx3rAG3Fcc77+cB0yLooejI8xgFYAU/L+sj22LTqU56R275pEyDi9HSUPXnCFsZARMI02EQemXiqQdzsLh9PnCEJodmkXprAmWAltPPKcdT3wwslMkII0npzl1Ui5QIJ/vplwiItWs79OmEipsSERplOGV64CYJsoiVJCdpSf5gqSSQS2d17EVOFKCDeR4MdJ/M4BEgQsb09TGKtQx5QHXv474UtTIgVtLfT7WKK2SO+fH+ZKgihCtQQA8ziVHqqMXqeY/GTUnIlo81kwoxSZQgicCMRQd3JzQdezjTZEgNTMLfjeFp0zJT2Q8qU+cQ2WXILJD0+TCVJp4H2Xv7OKMKkqMsePMusQUcEkTNkcYBgWKkaeKvBGUWrZ1dx3H0weUHSl0gZjCnYpVqX53PVMjkA9Bqb43ivgTAiPXI0CSIFyhbTrrkxIwImzDtmYT/cgN+xdA35wJBrAVV+2ryJqy314h7dznEBaMQMjzxfjvgO6LY6ub75JgGBXbKV7PhwujbZ/lH7xyiIoWB7cffU9wonUq4Ox0awhRYki99cST7dssUpUnHgeGKfbJfUrL8nvzjD8I5/kfdYQADyFgY9Mk0pkIYBP385F6NQsGgiK5P7vCFgJRkFyVfomAUJi1LaamSOQ1gLQqnV6Z74CCRiRWQxFVEXlaEnLoCnsxiYlkXJVjAJJk2969hCPnjDGcmDAtTZ6++PfcTZ0L4+7ytKFDdE0N8frBAgw6X96fqMlQ5V2EsYsgViO7offICZaEyczseHIAJ7oIi47xr8dUXNgolEhD0/ZimtAeShoOefxg0T+44EPxvAA01jMdvaODEbFCJo1E+k75xujiQJMcdNmKNDSNCTPV91kq35Dugk73OsCqZAkR0Hbz2xUiUKKMkyVcjH7yImSFpD0vdDb9dfQMELEnjJqM0bK2++mFbKobht8XOUFtQxR3SnT0e+Q3KAJQh8QYtg1nEGau6O3VxmuIiJmHIB+/wCYwpleoI/P5yZOdghDpvvMYhZUABFbiC+NTrIQOAKlL1VevtlmVhFmIEIHu98hKSG4CZ7UUut8XjjLIotavMd3BxKxJxDHHnGcWkltGgmq/WUUQiIB1ljYy8YpgkZAXHReXD9xJQt/pGBVAwRcup9MhYWtAV7++PRCyNSGh6uvTECYsdP+xljuMU20/wCYUFIFQjz6e2bYlgBFOlnHhrG64mp2zMKcuol65LhJDTCMc3fL8ekXojEcn5kffCfEUmCwjXGVFiEtTfSah8GSHiys1d7nnjnEEWaRITl9g+MCvYQiBb541jModLow+JwgSEAqTWIHn/MImcwbI9LrnCOVQd9ONaMCERAVl3MdDIFoBCB5JOr0wORRA6W0/OQ5guTZHHivjFDRO9sqPOpd9bwnQEzA6QpM2R+HA5FElPYGiot/ThHgc+g4BNn+5MIa2QE7k3EnxveQ4ZbNCYZWZ9fTEBKhM+HMevPTERC3NAkYJWH/ADeNTAhwJkuOlP3hkQAFikTd6m/xg7IBkNwXfp7deEUmqzN91tIS/wB4gxmRYa76mOvW8gcDu02tbPvZEkUbQWh2IBfDHSkZCwpKru4yMAklob9cJMHLMlV99uucggEhLQx8YoYtskE1eyvzkZDcbR0N3/zFLCVFQNlLfHn5L5a3SzMB8RWBN6BEkp/HOCTFrA4jVVH8y2cozyih+T1xAOQ2TDiHPMk5LlrKpLuVYKZXKFINg8y/rFtxbNz57xgCg9Rihr0wJwoRwM6i4pr64xFGtojk6jizGpMinv67yLMpDCyG2e0ZHNcmgxEx1vp0yMrUCxGo7XOOIhCsi7jEE/TAgXYXR5P45LkRJlCDNQzrEvAkjo8nfpp3kti2I1PF+rkmsTJmBiJfjIj14Wng24qwTGJc6D96mVQyp1GZfZ+H1BURSeWL5L12yCBRDgKDjsvthIqXVHqb/P8AcN7BROEa7XL65G3Gyj6/jzinTQokN14qvXxggjGhDJXtjIFEpMWPHWva8EgpigVG/ThjtjxnHM30LiDIDnqrJZH5wCRo1hGyPz6Yx0hWgkHrs98vOiDAtzvcR+MSGROE5OnQ/eETtG0DFwfrGLBsm9JUm9xrDMEBQED7H2cVPN+i6npvJgkzG0lwHTDChF45Cj8uGCROje9TrEjpsUSR1j+9zpJ5bYSduRzz74LqRFQElw80dsLYQEInmip54yTEjQV2EhiMilEGYbvXXjpgRtiHlp+v4DpEg2kp90T6GAgoLyxYuN6HFGEdFxUuuvXvHOLTRSjaWD4YNZ+xiY8tUeUOjjGUapIOjyLd5emIJHBNF6UfaybrsxTAhsv3vHkojzIY3+8gAjZEQ95idmJSGUlkZ73H30dTSDIhXifMdN+MlIBCW1ZqGlhvItwIyJFMTaH67YhR0xhATi+z9MWalRcQLKjjl3nEnHQBUFjc+njKFOqCE4OsmMSQgwEyV64jJFsSlao5ergZU0dp1Ma6ey4oZgZIUk2DOLJLUMDu/B/3FVECgRKNvmPSMLTJUOsCem8IaFDAMt+m0cZETQLB/l6ydxIhvZZPS3EArJEyqXu+cUEwmhCdffFW/JmEX/M5hNxdOuNUMIx0ON5OyRJMMDP6j1xAiQgyIBMH2bxTyAFEbOS/9wQnRIBQGjzH584mGQRPJ9S8qyG0SHLtEdOTGYOyKhhg8xODn2CUSgmyx++AOUYZQOJmXDJFXYhPRzR9jApBJRNa+J98AklQboS0d6Y9MQiQIOqIEev5yMQoslKgLnXsuIkATBwOre9ThzCboYVgieM4eIAs4mR7dOcE9EkER59fu8HpUQol8dKm+ByjggYV1Dc8/GRAgwUFEy6jf4xBJNBDBlV9H3yODEZqAf0+7rJl4hSLqwnkviMZmCkEtwevc5XwGG2MMm9MuT5N5XR/dYGkiJrurC1lm2RPL11kbyhsW2du+K1opEgIFnUVMv2ZSWy2WuKxhyaWs1Ivz64g0BA9ybUd8iwbApaHzufrhspRYqFxXgO3GIqJAQYlgj8YA7mp2awkIAiHE0e/7zVGEDYlRxO9pONgDRJhQmjrzhSoFAXDjczPXBhZhPSdT4vx0ySMIBhTN+f9yqSAxGtZIxCoYEdjEgzaeuIlBIIhCSyO+MRFSEUAbWx465cIklWQOL0fembcbKtEnV16dOMMCZsQ617ZLSQzRaePc1kkIs70IeK5qdZK6hAyIk12YNKXjKUmWjfepwY5GxiI4utVkzTBp1jfx84iggRdVKavj9dcKQyTye0uAkXpDSo3+nplV2Ooeh0nnHwcEeD2dNxkESvRA9J3/nRxJQpS7m+A8fOMllrQP+XiKqKSWNiUxhqwgAeiXjvxkQAJIaa/E/OXMZwabhjjLqgOpD/rFKChgckMS7OdYol5ImG4F6/lx0JNlEry8/ycSle5BEKPN+mRkCQJYHMsmCITtSF5AiT5xUIcWSgc9ZrrzkQQ0MSIRMz1/OQCgDQt/wArpnWAQDTUzs/uJ1RXmQnj4xBuUJmk6lD1+mEM4cBPkn056YLEBsGo+OPxlCqUgS1NeT7OCHyRFK+Ud/TAya2iM6QHTv8AOHUkzzJPxM19vEHclYvcPSz4nEqjSTH9bjDtxsiALTW+3pGTSAlHX9PZr85I6JiLGktePnGIcVgkAd+mKQDKQCeYI/vHnBoUiJ1ioCCJ3EpyV974JCjU2gqDJ+6KeXSEeH4xYPhAEksE7RJfnHVKRGg6WnW30wg7hBMFwSGd1OaMgQ1AjTNz6bxgfIbFOEnjt7YKxmhJR541xIHPqZIWUby579MMzwZLDw8fjFEhoGDwuXAnCtRBKizq9bnBpqlpUUD0n9YL8AsxKpOlscZduijlHQ4COvTJahJBRq6dOa4wqFqRA5BmOIwDbmJmLq4jU78YabFB4lJB49ciuTiRaMx964IBggIlO5/EuAgCM2FEczPOTYEUbQlvbn2ywDCbt0po7YgCzhgdkfHzi4WqWXoJiD7eBrRMxI2mIOnOcKbLBiYg6Y1SVYF9GINy+2ES6OTJ6RO+vbzkufBDAhKutxOr9sg1Noo+5x/mVQBX8PX6YwqAhGiScnnQ3vin2nEViXBmPv8AcfhdQnUefvGNEjhU4HYbCMBS8k4rZ19a8ZMUnSs+R+PfJUQQlAMeUd17ZSeCnUma926mDANmySALLfiuf3k7Tc0jrJFS/gxJYNtFdEPjprBSBFbIccHf2yvYCBKO7+8BUJQuC5L5wICQEMyxCjHSa+mKA5UNDG31fjCERCUYFa5h/M44bNEQF7+/jBHUEMpHeaJwoIECTHk3cfjBtMWDMTs4B8xnIS5WIzMlT/O7gNKwlgEtPe4jxxi4LlvyRW09D2nB8IsJLp4C+J+c2AIDZoyPauuENNW10X598VZoU22g+wd8loXSSdUqVt09sFzSu4J1DGCQuCCFBr8ebxWwnrBaBOs4IghcAHoZCP1XXFShfduni32yEkdCLE6D4HGSLZmpOT3OHI4uVsChLvGunziQjEq24qfXBKCVIKjycR7ZOIRkgJ9Y3ipl0kwjt1p8ZEbOCvVvYd9Dtmo7FhjUTzx8dMQXGyxBPLPxluBY8ta81JHbvi0ouEmCzL6zjpFEKChZ8mSCpAkwHWIqr84wBymMbQej8mbmogiJUh56pglCQuQlvrzJjxjajQsrXZNYilCQfIiD/JxLy5LSJ4lNa0byJRJTljpwaygR+qeuq6d8as7NL0utdNZPUwghhezLrWFhGRBbq4Tb+MFCU2u3S6x06d9YgWibFuI465MmUcEvWj7ZiJBIgsqR7Tk3v2IZ7O99LyWXMrZG4nvI+7jtrGZVY6kdsTp1Vd8+P7gtcKi/RD384VQIZPYrWKSLy0JdnpE+2OsDSTzx1wBZD2lNhs9n3zThYGqlZfbKqUtBO4TvH28lNQNQxsWq/wBxT5gBEg6C8YoiDdbiGjrgyQ4IbkuPvGCACXKtzonrufTHJtyKRZ5v8Zby7AS9/wAZYs2dMqVF55ffWWFIXVQsuZt9ucpFfJQHc3MYFWFQgNsnYffAAQtjAJBPRG+mc9hQamOezfzhtwGS2gGWItiPV1k/EKaohPExomshJREsyAJo+uJAtToF1X+fXIc2iKcETUN+n6w8AVZaUgd/Hs4nODIxCx99YaJW5EsGCNdYXDogmwrF+WGa5xTAgHYQaXKXv+45vLkkRbEo+xjo3aToND46dcuEJhtKbi9a60YorB0sw9JNa5OcC4UQmAZp6xte0ZDXRCDZDNNW8xpjJEQAJhIWveZorA920DYhLdafjEt6CATLSvZHzlKKTYByb5mfpgCAoUddA/beOPhlYeta19jEGpIA1IB72nasrWTIhyVbZkiPRwF1pyXvasxB0/mMyI2ZMJq/vTI3yQJYm4fF5dJSCeW+hoH7OTzokpHQmPI+TFEUWJMjXBJExrj2FYBSFxTa9Q/OEXMAEmwJJ9emBE8YimY7dnFttMIxJvT5jInmzplSv/MJJqAVNunXWNCjJoddqq/fvkrGyVkThlDHHVs1J59sIQsmhiX0rjJughQFCdXfvgBBXQMfV7x1WRSzpW/vvk0AlsiSIMBZhaFuL+GTEA5YCfkcuXND5BJ+HEjU5Ztwc+OM2JpDMkKvvUY5kgGEu9xXO/zhjtQSnkfTN7KIK8N8kV2nOUhKSnVx+zrmmtXoch+cBdQCavp65IIO0d3zhBEWw20ff1nViJzk7d9t8c4SKRlAQrcbijxgMNU1pEDXvOR3AQKVWvwv+4VkQjQFDp3gjVZLKAXEJt81gBdc6Y3Z5v0zScNgk3HH0wrkmh2Wh6h5xKaCtyhSH6YD7AYtC8SqA39gORSgg6cPGUIBeSh5U05xjqg0lYXXG/fc4MOfTtb9Jxp6bIWNzPcjnnFS2LFSEXqDtihHDQVDS4iON4sVCUEyzCfLffJPSGSVVJ8drM2uBDNniDWaIAobJnyuS4kTYGi9sx3NYSJMuhTlm47u2cMMAixHuE6fzIEoCJnb19zeMsI1ogesxXzhvJQlF8oxQpvIGKuBDbJ2Z9Ix1Paqo7Cdw9f1kUmDHCp9+cacVPMm2OsYAmBIJAFImY7/ANy6ZZBdWdYo/GIP7SVi79W8C0pDgkN06Gr1kjKIhZDCGu6ZBukCxSwE+j74allbs2j4L9MiRIRFCKZvnj2zm4ZjaEt+9cZFCcpXFefGKrEjAgR99sggFKRAj+4yQRAExCEOuMOyQQgxHb0MkAbIIokGGXfvrDpLWnkx0qEj845gIqZVNSfOKBsq7HMhRcf5hCQRSOAZ+Y9sFmBlJDwYOv8AzCKyQwRuomYn5xBiiE6UQRzOryRIFEToTjtiRgkLCp4Ju2j295AGQO4wHthyUkiBVk5/UfrImkYsGiZre8sJiYR0++3BsBxDTcvdj8daF8l+/wAYUgAQUT0K3GsGKmCuSBTn2ypfCroBvRej65IUu6ni73Ovhxz0Gw5mfHXDSkGIiRxTwcPjI0BqLInWY6TA443EA3YSDpHi8RCgkkbc2Tw1eIBtJK1yEIdPjIrREXipquvf0yyT3FhLqEiTftPMYV4BEawWtn2cVCiITaFZnxDhYYZNFOS5fTjJsqGxDaI88Tx7xEmNAp5qY/H7wxTghCo1EpjJD6W43ECPf4wVqmSQlLXfZ9uSJCoOWup1rd4IegiA6h6BKYouiTJKGX0n9YYyoMkKlsjqk+cDN5IClK8B2n5xAaZSwNm8uZouUOYdVxJ8gnRbRNJPsw5cImAL0b5gcWRA5GeiZbjUa4wKMhns9nj1xIhSbJL8xu7x1JMEwycaJPXtk2BAAUTDA8y6yMqkwEgD8jPrgoyTqEbgJOI3WoMQazOUukVqWWd9cdxdZTG5X2nXMecRMdlGWOZPbFLY1Wip6csdvXAL8ksiYAj1cKSCSto+NzH7xpClboh4v6YBGSyRBxrqz85MOiBKMcH394+0jpQNwPtipwESCyoaO+BK5IIKaZh6T7mMysBKChcPneKwAElc9QrAa+xjSMXMOiOmAM02oFlRPpU9sQkEFu+mXyHnsZIULoA1SXfziy+hclLGu31yCZlQnLY13h+M1CAkpTDUn/MFicJgTLU6o/3rQxNTpUifO+MJEE0KvZ83vreIYmgEkibid2hzTxhCesBTSFLXjGGsWWuaiqh6YoYEEw9iQcR3ZgC8k+3PbpgYeg2JAJnpWTthEcwdXsXdd8KCU3gI335xUYiT6npOT4WS00WHhectkDeXUF46siKmRE+x8YwpVQoK6muCe0YEsg30VuDjpWEgwyOgKJ5+xiGg8Sw3s+sR64TjQU6TNC5gmNYURgiAIq79eenbFH03F99R5711wOkUiEotDsefnAWryF2RzPn6YJjE0D0Yiw4/OF0/gojeo2NRkA7XK+0T6POTyZEA2bjTvr5yBtMiqEtUm+H4wSpHXiI1DsbvxvA8cZOkRD556ZfhO8MGOFx8CB6A8kg14w7JBAkh+dvvk5L/AGp6ThiZRlLts01XtpoNkZrZ6uGsQDBKgEJMz4jNLlprjrVVejn3bQ0IdDPLxxjhic1ABOemIRJKJt0qnMR8dMRAtSNAuoIbGOzl0GgMzzQR16b/AByFxBSg6MCpsphB88VlJYOSJnevT3yySLJBExzzh6DLZc9esT7axVJvEBjxtMGlkxoCrPUTgYcV6wzp7zD74Lhs2JRcPX9YFBDuvpxjlNBVQ8nPrm5lASwXfpP6w1KcSoLllOwmTYNrlleu/vOAVRpWpDcQTGJZMARC8d/beUqIIARL8b3rd5FuQoIE4nX4yVzOqb5slj2xZIA7Ytp5/wB74xOKVI0njtz64qMGhYJ36hk0boQBtwnXISIBEadd+J9+MSS6S3kzV2BhU8KhFdRT22QZRFG6NAT78YJAMgHtt10+XGSGQ0AAa+X64nMBTDENp4e7gIShKjRLx+ow+cgib00emQbk47Ld9L9MlStNY+h75NHDLG264fzGIhvVyRGyC9nGThtMCDzvzOSYWRNQNO14ylsZQtQdVsx6yahS6N3aejgbWwpishaMoBAXwWxd4xpRcxZgZOv11eZOiRHc+Y+e2Toy0wdwcar1yXGYBmi9GXEH5wnJECAjL1wZHjDKYATQ+uRQIE0x7121gJLaJtQpIdJv8ZwrhJeVhzx9qJFigjW563Fpkc6zog781XtivKgN0d+PsYFCGplUV1Rv3wCNaihMMR1wRl2inrL7fnrl5CRE9KKg8ZGEmofQlLrnXnFIAJD1D+8SamLIbOCL3rAIEqQ2C8ANN6wUhgWhEOfMoc6xo0ESgEI76VT4wZQDYM6Q2G+84oFSIFgvTx2wSYkQUySKX3/7giXFprpN4VmfcoT0I3OTBiGhABN/PvgEEuFZTNvSjCn0rwlXPa69sCbCqNRftzOdpIX4FGjnjzjTZ1EXMNOGUWQuk+J1+cgpRFFu8MjlSFp3F1dZelYmlC79oPdilKSJJFk0e+ITayXUUydj/cgalYeM9/j3MpGJgUhx4/E4M0RMA/HrU+uEiQVog0z3nRZgGAgRSJf5hHElSFkSIdIUTqZExAkJOgk/H4whjiIkC5l6/wB4yODAgYNhr2+c0wYmWOiC/Vwlg6Fhjt7R74KAtEmknHX33lyXhCp6xx3+xYJAkEz3SZiPlwUEBhGE7N74574xbxQYVuOqfe2OFNWJI7j+K/OToJBwMibGJuvGLyYUkGCWeFv0xpZEIklI46Gn7WFK8ypCZUb5QcYswOZC0fTFY3BaRaontPy4wUBC02nJ9PDiRBiA6NArcRPt6YhSYh0n+OMGaUmpakPTATFokSzGEfTvgIKGkes9/TjpiCiaCd9qOp64TyndQOkR4xrgBBOaI8DqPm8DLaiKlDXAdv3jrKBCR8FyB/cMjah0S6J+9tYqPDTh1+D7YIM4EBl5jpXXXTI2Adgo6jrM85sRlFbmTh/PcwBE4FNIRh11reRoT0InhV+ziYBCGZsjW5jeQMBFRIj1KvGMhAY5Z6u2Onpi5KpmUywoY0f75wET6imjlVv13GQWR1S4mN1+vbCFsEjMOY66tx7wXsQks8785Gb6YTPk5/jjBZViC1Ssdsc2ASzAruQxQSCjIAsfiJxtkW1Jo6veF+uLFaS2lEa6z16YiTagrC98b/xxTLEIJXejLGGCGp4HbERGCa0ssHiBazqVQ6TmWpOMQYVSSn443FYEQ4QQWNp688RjszSxBOQuBjnJ9zAhSUTNtH05zckoAi0/uX7GCJCiXIJZt5J4sHLQyoRLp3xx1waMvASD6ydOuCkAgNMP2aw3rjd4Zn8+keuWskVDC9Hw++NMItmF4kh4/wAxHTtLAgdfhwsUoQEDzOUFCqNbYThtfG8k4Yxlwc11k54yDFrEMGtK3j7JBFpm9I6nWSyXCkzMPh5Psi1yLIE+ByYjRJFt3HM1zk1CGJ7E3XocbcllTeYdtH2Z9MnaXGZB1GBwtVggbI763/MlnqAAjuW4hhJcExcoTXXtvBDAICTRglZr0+MgRZmwulVMR+sFGEDVomgno8ZCDq6g9YUTrUc5JAFooDSR/mMHQmM3Mzv9YLLGkxTvrrZHbrjQkWZtL27cd/SrDAfHPBPDR744FiQWJWN8xblPPIMpEpK7vfnKIDFWSOnz7euMOSISot3WufXrm0SFod/a+MkXxoTt4XvTfb3GAv0pOCYYh0V7ZFQSsFuycb+cgWdoIqvVenzOF1ixFh6PZjBnwQXUHDBTrr6Y3JgxCJAb6E898EBSL5Zkldd94wUZICQde0RWsiZC4IQ6NXyR9jOYVwITrirw4C6CkWWKOziEh1EJ5dlvvDiMFgJpQQDHX7vIfDCo7bqMpRQBRCLPlwkqAhyCy9PxjghG2qbfj5y2ICU0yP8ASuxlQCxy8Pn+RkqfFrDrK8z/AMxxGLuoLvbt6e2T62VTPZvfdGDDNsjUhOfn/uFEKIsiANRzv1rBICEhMeOzziYrbBo3jTHxgOwCAGV+jeIsWewvAyPf1nKKMps2jfPX55yPygMG2r77rKWBY8s2A+sV3zeEuRhtle3tziwKmkjwXQe+NgiIEqFkY6f73x1k3yZHOqP5gThoW6dVMPx8YLJASoMFU9/5gIIxlpeqO1vrkwxSIXaZXrRiEkAgjXxwHicsdEnwJsevPpkhAbr0NR19/FZeh1JKJah63841w6B52R1t85ChaU5jb6XicQ2Enbt0e+E3SKJgVNc0tcuE9YAKSwjw9cRWIdMQnRXMWZOkA0mU+Krm8BDKtop6fmsdgTNZFBKszOoxZQxssS+DtrJsLHFqQoTuzGsUcyFSDGyhzRgCronWg/E98Q0BSTa1+fHmMmKFTu1JPllfQjjG4Ei6Tn5iK8YJxCCSQnqw4s+NlKuLvnFhQFNLZH/DxlQDmiA9AdtYXiJTFUHxjKahqDXXs78ZNGtCSelJjaJLcCipv9dcbKECWc+YDlie+TJJ4KkENq0g64hfCkOQnbeit1ihqABLhJD0cLGQLVMLc3z6174wCzAWL6aZ6vricU0LJJYes4tIzcRL3/mKAUIiIGCm+rlojgEEzD3v07YbiDBDu5DzGAOosBNh1+/jLcowUk8V7/eIdc4C2zUcavJRlELY9hz0n/mLJAjAaV6OdntiR+HbFPVcZrRDGmixF48r4zXaW2ZntF8YyxCWmOZdl4DBQsQtSEPj3Zag7IODp5rfGKY4KEkqaHnrzHtlHBJahTsPphOR0jcgxG2vF4GCAgQmCvQ6Y6IIJi4rwU+2DQCnQI3zuj44xYkmbXMMMfHYwolFJI9+nbvxiMgCheQrb1njvjWIG0Wfo84s1ogsEtPZzdHaXqLUqeDnHSO3FEiEMgAFec+OsdsXaU6cElfo4yvQUKjjWtNR+MYiBJc8Nz1r5xEsQLCSfrr8YA1kF4kJvTE1ffAKSWXWQZ9oT3yMYCSxMJIxzGRLUBlG4PnHDSGycanvG/MYtCE00u2UklGPsLgCCWz0DnhfjIShgsU3VMv69MnYgllqa/GMBc3sYFYTtR8YmIgaEsqb9Vx7liIHVYdH/cJSJFLAYACA6qGgDIICszoCSSb4yREzOoqD8uM+J+Otls+cCzJMkkdkXtj7G34BXitwdfusIEFYcNCHH+OTfqJKlHMHn2yMIsFoQ0jVR3cKZgNBWa3MVgQxCgyU2avDDCCCIBNc6eY8ZPZGgEyI57+ciUTJMwngjVbyOIKxKTT7nxeSwl0MCCV8z+XWJJSAQt4O+QwoQJe3nJXqmJO1qYRj2wGkCAYXW9utM4QG/IC3IRP2umDTEAlk9zZ/mBKGwKj38tV5yRVSBSDZJndaOvnGS/X9AvFBQK5ZacknfOHeClon2GTeMbkEqQj0ufbpnItSCQ2R0iO2jBjdlTe4GL7c4FSlokQMTYDx7Y5FGoCXmZjq1xWLgXSgexT1yXN7AuPPz0yhESO0tXz08GHSkrqKYn9Rxiza8hub3PacJBJFDLPW1e2GSEkYRjuB9MgCRYgAP4O8mls52G5b/hhKpo0uXWOMmkMzJmuviPfvlZBoKLivDzk3iEQmUBBZveM5Gdije/LOvnBZlK7Aum2Le/QjBVEBZQYIzMNlfGQXXFQB7e3xgFtwbH+LwgN8WUdYusFcmExvbc+DjGcVipVCDRR0y6QJbDW5u/f8YHIFIz+uMqQ8BLjcT1In07ZBKEx5EkzB5nzrnIvpEqqI9GK6uIwSIENp3JOuu+QzMCMiPWekdpxFeawb0dvOTJugQ6RPGpHL8YrsXa1n4wxENR1PbztPXaIbFqU9ezrlMBawlCdkjitP2cVXgIUtzUevORkVZELDu9fXrl6aRZRYo0eebnIYFUpnVXx6f9xxSJ2wkCOv98ZKogIge9yFV0yAaIKDJBMRfS8cjGTBREOuu/bCsQFBBd7DsJWCyGyDweWuY1hQ0ppalmTx8YOAEwkwTId+fulCCopCL1OoYxJKJicLBudR7YLdhMWRLS6fhyQ1IgJ24OsBPTDKJxFIgId9p9+MSbIWUVJlY9XErAolgAFx3v64M0WECZY0R7b6YMWRbzPh4wXYanqIqXVQ/OIoXDLO7DcGWsqxJEdp0e2SIDKMyPBK6Y1JHFQdSdecFREClzDEzydceodhNPI+Qj641hPItGoaXPHHGOGTlKs+JOj0jIkAqLA643zB84m8uin/AE9vGRlitgW6nrOPTcFEJ+sXiJyoIxKHym6w6PWbPRX4yAb7aUSsujY84OLigGOm5XfXt2ySCIBDdk9J/JjbLmAk2Xl2+fTA1Fio1saNeMBN+6C3ysuR1htLbc6rVdcLImUAN9Z7xiiKZIHqir26xuU6YuZP9wTyqjTNik59MUDIlJFSCuN5EXQESoSWDje++GEAQ0FPT59sBEAkEhv9V6OFoMhYkPQSIP7zj84reoDrMT/MgWR7EKHZ3dce2Rtm4Z3dk+Ue3FDGUIyCyZa6b9s6pgKY0xO8IHKhI+RBucsAMhNIPDz3yYBkKFfon94J41ZdcJZ5Nd8eQQmWpuOWLjCEh5WR6x+MhywsNsPNG/J4xEEhqBUN1xPY64wbI9IgL/OBOBBAVwuvnvju9lo7pfbODUBGdV5npiQrIq041f2cVJlICKS/JXxjqSTLTUmzpbkebkBNusx2+cRmkA4S9nPX0MdhISml0Txy+mMmQHJrF3rprrjAkC3csWb/AMwBDWhsmDguMCAlKnLyPt4yUwI27NBGSUOBiV37knnJj+sr9bkxIiJgcevthWDURSSTybc7fDitafeb+cYwTaZjdaZ7zlYsIKTBmefPplaxaF3TLQRgifLkAZLZ/wCYqKFKbFFj1/ZhmNIUlK+UmKnCtII1BUofvOMqJt0yS5dP4Y0JBFNyH+5ES0xqBo57+jjoOBoVRU1zvjEjL8QC4n9sIKnsE2V3MMZohClR6OHHL4CtT80G+uBDChtSWj3jjeNEIWAWDuFgZGBFltOrT2qeTvmkOzSApuGrnHYoCVnsrhu4wBEM6AMbdo8/OJBatD56vLLApIGUYYJdng98AZqwtM81oPxlc4gXg5ezE4XONzZoX276zmlEVC2ZJ7U4TaGys2L9R3kmagoRO3HMavNdlhYlZ+AZ9POEwJKWEBBNdVv0xVbkB6aI14wSwdSNCJl8vODgDYg2YEfZ/ImkskieI/5gWQgA2qFN7GJ5xyqbDOHR5euOAXMMz6JP0wUhaIioqk4nfMc5FT3IeHmNOShIigvnUcemGIhi3ynOumKDuggfHD/3InIcPl4X2caCohtp6R667ZKCLgnbz3xPLOIp2Vxr1xKKtpLm9xr3wAUxBJgCQ836d8ek07XP61+awCBABySye8deYrGsoRHDq/L7ycYfpl3oRMva/hxrJoMIJOFs1PqnOUElLwHrPWJxHFNSh8R5+e2F8a8RpPzPTCQUJy3TJ0twwFTyNTY2+a7YxVwy3M/ztkGIJCC+SnjdYx0EtbjkHb+5LmJY8AJJnx+cWDkoUVs+qT5wnQQMqiY/ODKSlIoNQHpPfWGDCdUCjEMsJBIUJtfZFPphLYkirINKO8CoiImYWGZLtyUUAIIqd8kWXCRI/wBwQk9kUOc3uWMimZEQBYp/t5dFpB6h/dTpwqHCDpvUTvq784BGiCJURzzY/wCYOjSCQHSRePtYKfImuQiThOfHTGQwUiK2IJe/zkSysECDxvtAx84NVTEQk07jfj3yRzEZQJeztX0yRaCmEjQyN9J7YgEg2bBQ40/OTRwmChHbLACJljF3xzidQmBLECXqjCD4cgon0JnQYmYkRpAfxjKEqCkIKO8GQBYhMBCmJ98YVqXMaT679UxBKgGdBPUhZ76wARYwsC+ExPfdmt4VIbB29SvCWbwRpElgmeI+mShSUBDkB7YJtvIkb9ssuBEyWU5106dDA+QJlN0EYloBw58/P5xijIqJyfN98UJoFSWjk4xGaDIy7S6840JTaHQeBM/9wASFEWhbPrjxrjIptBExOqpyYuopCJqpO8bxGMU7XDBYaVRsn91llG0SYuI80PrhpImURIRr1icJUIFJUK4TfrhKKYQBB6T2wgPxkSk5DX5xhAEraCSzwZJZzUkICt+1M7wG2RORG0k6a9cCxjYgNn0+ZwE1QgMuo+ONdsTeIMVJvnYVjKaBEZCN36YCtexCFGp2yTJDhkSZ0FGsMKhkSgve4M2jUUcFzVML7ecUxi6672fGUMszzO1e/vgGBLLpHUr94CkqqDV9vQrE5BIjT83qcUchyECUo9Hmu/jGNAUTAyaPWPbCmQiXodf3iBnRI9euctKICbJt9YfQ75UHumFiEV7E+cSek9VHpMTwx4xvblQKaki1OEDSkEfZEd/9wUk0LCeSGWfFZBMUQuksrPSsncKRTbma6/GEaZIaJMviz84JWCcmbECdOIwgRMWbIUrzOA0IsUcWRXM85YECM09On96zgdUSSKnzNGU8cQDIrG+vTLkj2NLT4g+cJVgkgpmzrxxsyipAFKkNBx09MDcBCRKUblximNAgXudTvxjLIEyCs5roBkJuSR5dx7vxkwXAUya8b/5niJjYlT8vv2ziIjcRHfI33n4wJCWoBw6ZdzpzkFCGoV917YucFRxTjvifqTMeCerQ4lKgXRJEJHSeO3jOLEzgEcTo2uL3q5VTyUTleNpBZ6sPGDAIUZKeo6+chc2hCW6qR1JiHipbzxawYDBd+WA5jiveYjLpwwAPjNxHF6w8zEQCTxxkFC8KAaeSdLEPrjYaZzfl+BMAQOEIJC4ybWFxCQx6G7yGpkeEUQPU98sbLKdLze756Vgzg6pIdQQjx2xE+uW0SqtW6zckkQUI5ob1xllWSwC5oTmCsJDAhooxD5jTkoaiQhvh8YlgLZ2nSY9e99sFqRRFqWR9/GTQQLAu50mOtX+5wfRCQbUczBhLEjUKOpY329MWVBAJi/L9vFbGbAqG9+MmElPghXqO5jBBmUwQV33LHvgEi15MvXDpCMusPz74YgwnGTyl1iiGtCLHYePGrzUwKSAkpRqtwt4QO5AZQTHu6x09mIIPqRXvhZ2uwGm/v4MCGQhKUblOrfrkBUKCzJzZGh+OmMgCDYSQ1Xg8S5AwcREmNkPGBgBasF/DbvJHF9na2fOKqCF3E7FPUrHMN9ikTHeYxBUKZSDyefXIaKLoPcyEOLcyIlKiImdf8wNQNhEbmV+864xAIIC6hInk/GGKLSJUswIev3eOsyNnZuvv5wMSk86HlT0whCdAKRA6OXxgpOUWY93zxFYgDQT3jkOXBEtKRxfx99GA2JDrDqj6YiraCymDJPvx+MAjqwoCOsesY6o2VSPROPOsVqSoiUFB0li8stNbynheP5mwXST/AFdHZ9tIMAsw7JmMe0GyWm5duGIIiCIBbXI3XbAcFIhwlPFuIwcECE3NpTIa6ZOFSoA+l9fjFSaSRQQ1F8fjJTbJSFlT6WaO+ComzEBd1xwj6YKAkaNNddRONd2lNdndoq/UxczULGRwces48DSosyzE+fdGVESmvMdfr17yhtJIIlJk8FPvhPggBQlYYOm/QyREa5cHL+cv9CrRPebH4cL0quokmYgr/cQMsC1iZTPaPnAkjbvMHH06ZGFF2EG0IHLgjuSIqQc194xiFDfTIREi4ZSaYveSnVqVSDmzidzrGusJpW7D4iH0w6ISVjSsiz45xT7gxW+ljp76zYtCkiXrtyAQAKwXuPWD1XLQTimSR2qox9SkQzld9/rFiOWQRi0x92ZJRu0NpKc75yKKBQNI7ev8XrkFGZbdyenXj844Q4gYhyaO+v5gl5sCopNcXkVdlJ4N1z09cKhDYIYk2UX93miloO7+uOg6V2ldfGHBztgLbfXW+fLgzr1GAzMXw+nXWAnSBKRXS3l8fG8miEFVpKIk+nlxSsIBkpOC1ReLUBFyVehgc4wkwpwz39cLC3DKK9utz8Zwcw4SOfkw2tGW5pQk77YkKKElMB7XWMAKkiICzNx18TkzEsQVjLxx/mDMZTBA9es4ACkWmiedRPp/cgkAonCVj/H9YQJ2AXcoiPd+0WKKyeZkPfASEREHQ9HzrFdgommbp7dPGITWNcH5cQ4oTGwKEN8CbvtkIYpQ5o/7jlIKZzJ17c8fvIg2kXiJVvpE0f7jQWLlE6Ob3zOJZwCI56vbe8gaDVMp0l+/vOpiW4Dgw3E0FZg4Kv8Aw74DFceRHnVc2+eMWxKjUjsBzJt5YFOxazD+gYPoFE2FMr4PnK/4IE7LM3/nbIRnGiSnbxiAFJujVSON61kPA0jsHvPOXMyQXL0NYcT6BVesz3+uQ8RaIlZhfxgMmoq4bpWnt6ZW5jAXfTEVAUIOegPSo/GLpuTBYlPrB31iUIoRYtY+GfsYEvCiEoInpzgucAl9O7t2VzgIZCajsVgEvIpaeXeFkM1UBDJL+sZVppbOhE3x5nGGaKCZ9W1nh9sZA1iAMV254xzbLgG/z/zWX05CVEQ+df5ljNmCJiN+Ht01hZi2Ql6I5515wDUAQ2n/ADHhMRRheHe6h3x5xeuFiOOx7z75BThxwrxWEbSJBvXb0xUWwRI4vcecSY6Q2J0jr+utGMJUogQhw9OK3mg0g0j0LqoxlJMSIIh5a95xGOGWJM9W8uSyJJHRnUv0rGgSMJrcJ0x9g0IajzhGJdDLa411jo7x1a0SnbPa7rrGTQg67BZPGrzVUo2mTLUdue+ADMC9IDlPcyBCvQVcl8LWBFZENQUefF3lnQRVw5O209Vxz8YFjF0E86/OGFCsmAMkdNkj+B2xQYXS9VxXjnJioEgJy/lawbqVC9T9R+nBnopAKLnt4wPTimCbt16+2HIi6AgqJG+Z6d8mAJJ3k6q6C9frCoDQLRx7/wAwvVVKCo68cYBECQrbqT7+bxikG58Fezk4JxAlZA1z9MmMkCEku8RABmW0oaepidsKahEH3pkhCOkkPeT0M0UBZDNAG+r5OpkSKdMnNHfvhCDQEMix/wBxwpENBz564poopa564ZoyqeDk6XiROeQRInt6+uB3MFB1zDijgso2NwunHqcvqvvvOBsgRdB29k5CVTaSnXvxlx4PVx47se2PPHIMDaK1xv8AWNbALWW9HPrqMK+Y5xGqj1n1vIAJIpA1UldNVgHzMkNtQDOvHbijCIhDZZDiNO/WMUhZ5QBc2j117eMZfICDt4J9MKnREGEzJKdzDGVSThXtE+JwM5TErNi9T1xpEUJsp19p+6w6sAJsPPz6uABmKhrRweeeuOLAIFDc1PY8d8GGFnREbnviQSsRwka/3qY+AqvwAe+8oAUl2J09owIMBIHgaOHHcVWCAJ7o8YkJnI5Xoq9ftZCCFJVtToW+cgKVhIHgd3u7ySlSxABs9DCiCQal2PPG+xjrmBC47XPXHQQJMglpnRrjrrGpObTS8hMTiYkbAZK81xc36YSLTP8AIp75BphcjUOCfGCpuEJEESV7lZYIbCsl6+3PjFolLSjdHbXu4ihDLEpeY5HT64RTAUJiDn0ie+IeFNKWVme2UCFBRqp+L9fXJxUkrRvoh13gYqKnqam36ZJMwyt9n5yZoShpKqfMc/jJFFOZpT94Fj0tgkbPzr/mBsAB2KF+JX2yIpSpIK6R84j8BKdFuR7dMLYLNyZTyU20Y8aBozta3epwQUsD+bRg1ggkqYag6BgLRlIRDUL5vGdQMvgt9f1jy3oOq/v2MakCR+ZyhBQq8Iq4itYSVohgmnPVJziU5KwGzIKp0tB44JhxZSElaO2d9SMHNNLlF2dxk+mCYkwHk/BxJhAZPDZ+MgxIFH8fDeEYkOFLOGWemsGIb2BNj6z+fObfdA0MaennEVCEMCmXiN0mLWAwhKNMVD9cmSWFLYBIOOI/ePOwbCnkD9jFRCo4LOtV0mMOtxk4T4+/0kpJGCW7/mJKzlVba/XDgEEWWohn5j3ymVaU2n3x5wKlIPfY9fTAiSSkUuG37xkAA6KlfwPfLxeMg8OeNRiuSSBD6nReTDOidDMq8xL6RkikSeCVb2nBMQWqtvT8e+BDIAOBf2MYysJAeV339cQJADMCmeZb10cRgGGSlNTCsexzkh81EMpoZSJ8ZAg2ASVQRXvkBqWzEASqjU+cDJknNiN98YAEkQmIO/8A3EK5ALueI4b76wFlIqgkhFPV49nEBPKJUmlvifTNIRgJg7q4BGCAE1rjpQV4xkgTAYSD4ySxSEFm1y/XnEmZAuToMnzxiIWHRn/vXJwQJVQOCuO3+4TEzXL1LvU8+nfLtRAvl8YAFTrrvOVqo466aaxIhhwVHLjWZuDJSQHWUxbAlTTayfk/5jS60QBp0bnvWAhqBvkX5rTw4MAZIRdRJL6XgymBK6IBL3low6kqMrbr998ojDaBZ3w5AJpry4uPrp+cUjkhtKSI+9MBUSpidab+fbCSzUwpLkVdwX6e1lJoSfBz5jAIoJYB2qWOTHgWIhUXM8dfnChKgmOzvqc+8cMQVAXRwtE6waVYYlbGOrmqpsjZIWvE5JZcWxKsJPjEIxxyzyCfOLEyokuZ5x6BTAgE8vn73wJBGXUKKXEz1MA5BoVA2Pf2nxjSiJhJQiB1sW/5klVakcIj1QZMxCTBYRrjIzlcRN9Jr8YSYkJJGelGrePaMPOAUhgixDW6ffxgGMhkO3TX2chSphgGtT6z64oUsEDfpv4wAQJgxKXq9PXGZsOoPNr9jFPCUhQh1esl06BOlxZLEJbFq99PV9JQKDls47bjENgzMtD423+cPpDFQTfnWPhfSgSXBGsiYAWRII7MxxrFg4ZzIDNI5bnKoUYJRD1jX/DIoOOMleSblj5wA6BIRTY9q9Mbk3p09ZdDffpjZSalkk7Z1yc5OIHInIL/ABhShIKJJMVzTrNpQlMCzrhfNNr9jj1trIRMSgsDO+p/nbBUIVSYusc3V48MgHUJaE9J3465SElNRl6UOJIkArLpfZ7YEktENxVeMqLVQkp1Xnn3xmRUCiuIusLX7yF4+8YJlsovIOH1+MUySzcwzb0r5xZJrtXsOhWKqFIGpv72xSXIuiP0TDqMXEMTAIBE+W/fHENWJ9jtlFggWImeK7dMkkHK1PF9fxiGlbPiceBkutbp7/zAg6gcDodvvbAkUEilkmjp6GvTGceiCw14RIxZgkXHLMRFlp6mUoRSpuuLS8FhjiHZ8SdzV9sAEPaEfDr8c4bQUskBPUfG4wOBEBKVFpG9uGQQeH3UoDzy5CSg2Ex3yPLQUMgADP3plAjTBjRt4tV84sEqyZBsInnfV12xSDNAkF1PivnKRrM+1t9zh2Mj1sLIhfzf4844g0qJDdeKr18ZOJBQhkr2wsCi08/uv3glbJFCU87mN4YVsC1ljtksyptQYSYNb3jFYtxCQ90/3DME2CveuuAYTDrALiZg31n3UMihB2e50mMFEuXTfUfX2wJ+iMBFBYqOoZGdIbWj/ZxxjIGWBy/eLSICDbPoax/YHoNdb/mB8kRNEjcGm5yYrJKJBj1P7gYIApKOi89f8yQbaR4iAhwCuBFLR/fveVm9yaN8OQAIrBUkkYIPXAOJEUCGJrxOKwgRJBmDiSfW8GjGIUpral7+3jXsATQNL61PtlI04CjAGj1zRQVwTJjnn01kETIIbIGR0JSOmJIowitiauus9PbE+YMpvqc9/wAYSIQYZNvXWv8AuTRUU5AqIiuO8ViRJLc7WREvp74cZoDQl865j0qcsEmsJEQ7+vXLHsB0UNZJCksBKtlb64jZBwgx0b7snHSrwQLpdyAb4htINanAYRhMzCWdsCvJSnqRz5wvYmi+onpv0w0ebAkY+mKMCSjreQWMzpPT4xCDZqU3zxr8YCgIHoCLA43vs4nNNAiyDqROt98hiSQRQ+/GXJICxWP81O+MDuKCU0qDj/MbjAVQtLYig77/AFkoACEAdd3HpGIDJZKYluB35pwG7bBTTKx275OoBEi01EVxrrhBIJJayRcvCGSB5en8wVaVgwnrPr90ukBgiRji4BeemQiBJz3BOCIDTSEND13kqQSvEo5FjB94Q3gG6ut+2NsNMgATbBz8ZFhnaScR/ffFIwYuBm3/ALwPXJGAsJZHr8n7pIETSAY3Mf8AcSTRQh5F8+PN5MIjUSSoIp5r4nvjZrWaEkdNRurx1JAmgq9/JXrjYANl67tzz1MYbhamF1HBAfQxSoE6DQsOnbIUeaJGDtOm67nTGE6W6WfBrfOOAsxEAvmPT847NkNVp088+MluKs4Hf8ySk8Nyur2e8zeAOCJSCEkYlwlDEBVTPQPn3wpUNZdp1rVRPRzq5Edw6HefnGECgoJQPHXd/wDc3GbAK9H7HjFOmICiF97jHoUCXDLM9z+ZYgRZRovpXacXUCRNlILj09MBRgkqBfPRfjJADjFL6xk0TKhSHOpi/wCY8MalMQahK++1nMyAn58ZuLoHbvGOnIhBxNfjJlrCNAhv8r74CVmEgbJr8i3hEAE+uWd/lx88cDiWa6ueOhhQaUEdaGN1N9rxnJsYiM6sOcInGIwfI7M7yCUqAQT0SPjvksNlEk8rOuNRjKqkysg8TF8U8YsLARDO16uMvgQUFqbyWywgqVNnTfphGyIxI2rr8awQCQXQ5fYk+xjoLRLgISPSZO8uKmTmRKznzsx4EeBL6wN1d4hQxHZNIUmphfjEGdcIuB26zRE7YbdW/wDmK/yIk9Qb4mftYqm7kmGJiLwUGF2Cs/f5kYglQUk01qD8x1xQQFxCT518ZD7kpZI86xyGJqWgKROOu4xgCoZVKHaJq++dQFQoMRXp8OCjNneitd/9wmJBtEM+P7lDc1YiHB/uFaQEE93zOCMRZakA6GSichvwuu9j0wlJNQwmmDn/AHLKEpU76+1j3SotxPRmd/OIkXoxd2e+uuMeoxDkHUdJ564k1qJYdarWMxM4JfnGToAzbIHv6uK0yGJIAxJnxrtjJ6VhCYnn31jQCZVESmUmKTYYcNVF6fPExjQimVBJXEJx/JxCYKHEzyCdYu+MUW8wFSANPsfGS0nXXRCX6SV/MEYItYEdoNTWCdKJkWXE/NZHDsipCU3Ax/zLkMytw/P73hGCpEhvR4r8YGpAzLMJ++hkIhLuryDkjCiNKUHjaXxPfJ0cmLGHTtv7GRyq5ZY8kH3WMplaFVD1g66j9YwIIst1y/yeGcV9oZSWTp+pwlSioOir9DXpjPhQCVDx28OCkTSny/lF5EABsk9Z9jjIIq6rrD3Wd4K8yUSRBHeL/wCY0BQDfdwz36duMMuCVu1nXjCCTIKx7391gCwXjp7165K3QThjf0x6QQZEzsNdZcRYsm0okzZximQmHYdn0/GJByDzW0z+b6eMkp7oUgCIdzfvhqIgIw/4nHSUEZh39NxkF6pRKu5gs847ZLkMTE11k/OI4GfqQ8r+MQRMyHdvxgToGgIdY64UFuSEgNk8Xr/HEidkijR0cTKFwGRwJ/nfJhUkoSF88XHOGJIITOu/xhHbTCAiorzzhVQUzGhqL47Y3A9BbmJ1kWiE3YBH9xKMIKpBE8pPr7Xn/9k=";
var floor = [];
var counter = [];
var wall_tex = [];

/* floor.push("./resources/floors/Bathroom tile.jpg");
floor.push("./resources/floors/Marble blocks.jpg"); */
floor.push("./resources/floors/Marble tile.jpg");
/* floor.push("./resources/floors/Seamless black white marble tile pattern texture.jpg"); */
counter.push("./resources/floors/Seamless blue black marble cloud texture.jpg");
/* floor.push("./resources/floors/Seamless floor concrete stone block tiles texture.jpg");
floor.push("./resources/floors/Seamless marble cream tiles pattern texture.jpg"); */
counter.push("./resources/floors/Seamless marble texture (11).jpg");
counter.push("./resources/floors/Seamless marble texture (2).jpg");
counter.push("./resources/floors/Seamless marble texture (25).jpg");
counter.push("./resources/floors/Seamless marble texture (8).jpg");
/* floor.push("./resources/floors/Seamless marble tile texture (29).jpg");
floor.push("./resources/floors/Seamless marble tile texture 00.jpg"); */
floor.push("./resources/floors/Seamless marble tile texture 01.jpg");
/* floor.push("./resources/floors/biltmore_cherry_DIFFUSE.jpg"); */
floor.push("./resources/floors/Estate Golden Oak_DIFFUSE.jpg");
floor.push("./resources/floors/Estate Northern Birch_DIFFUSE.jpg");
floor.push("./resources/floors/Natural Anagre_DIFFUSE.jpg");
/* floor.push("./resources/floors/Seamless marble tile texture 02.jpg");
floor.push("./resources/floors/Seamless marble tile texture 03.jpg");
floor.push("./resources/floors/Seamless marble tile texture 04.jpg"); */
wall_tex.push("./resources/floors/Seamless wall white paint stucco plaster texture 01.jpg");
counter.push("./resources/floors/Seamless white black marble spec texture.jpg");
/* floor.push("data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD//gATQ3JlYXRlZCB3aXRoIEdJTVD/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wgARCAAgACADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAcG/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEAMQAAAB0AJ+ACgA/8QAFBABAAAAAAAAAAAAAAAAAAAAQP/aAAgBAQABBQIH/8QAFBEBAAAAAAAAAAAAAAAAAAAAIP/aAAgBAwEBPwEf/8QAFBEBAAAAAAAAAAAAAAAAAAAAIP/aAAgBAgEBPwEf/8QAFBABAAAAAAAAAAAAAAAAAAAAQP/aAAgBAQAGPwIH/8QAFBABAAAAAAAAAAAAAAAAAAAAQP/aAAgBAQABPyEH/9oADAMBAAIAAwAAABAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAg/9oACAEDAQE/EB//xAAUEQEAAAAAAAAAAAAAAAAAAAAg/9oACAECAQE/EB//xAAUEAEAAAAAAAAAAAAAAAAAAABA/9oACAEBAAE/EAf/2Q=="); */


var cab_def = [];
cab_def.push({sku:'8.3DB12.', description:'Drawer Base Cabinet 12" W x 34.5" H x 24" D', category:'Drawer Base Cabinet', type:'drawerbasecabinet', door:'default', height:34.5, width:12, depth:24, base_height:0});
cab_def.push({sku:'8.3DB15.', description:'Drawer Base Cabinet 15" W x 34.5" H x 24" D', category:'Drawer Base Cabinet', type:'drawerbasecabinet', door:'default', height:34.5, width:15, depth:24, base_height:0});
cab_def.push({sku:'8.3DB18.', description:'Drawer Base Cabinet 18" W x 34.5" H x 24" D', category:'Drawer Base Cabinet', type:'drawerbasecabinet', door:'default', height:34.5, width:18, depth:24, base_height:0});
cab_def.push({sku:'8.3DB21.', description:'Drawer Base Cabinet 21" W x 34.5" H x 24" D', category:'Drawer Base Cabinet', type:'drawerbasecabinet', door:'default', height:34.5, width:21, depth:24, base_height:0});
cab_def.push({sku:'8.3DB24.', description:'Drawer Base Cabinet 24" W x 34.5" H x 24" D', category:'Drawer Base Cabinet', type:'drawerbasecabinet', door:'default', height:34.5, width:24, depth:24, base_height:0});
cab_def.push({sku:'8.3DB27.', description:'Drawer Base Cabinet 27" W x 34.5" H x 24" D', category:'Drawer Base Cabinet', type:'drawerbasecabinet', door:'default', height:34.5, width:27, depth:24, base_height:0});
cab_def.push({sku:'8.3DB30.', description:'Drawer Base Cabinet 30" W x 34.5" H x 24" D', category:'Drawer Base Cabinet', type:'drawerbasecabinet', door:'default', height:34.5, width:30, depth:24, base_height:0});
cab_def.push({sku:'8.3DB33.', description:'Drawer Base Cabinet 33" W x 34.5" H x 24" D', category:'Drawer Base Cabinet', type:'drawerbasecabinet', door:'default', height:34.5, width:33, depth:24, base_height:0});
cab_def.push({sku:'8.3DB36.', description:'Drawer Base Cabinet 36" W x 34.5" H x 24" D', category:'Drawer Base Cabinet', type:'drawerbasecabinet', door:'default', height:34.5, width:36, depth:24, base_height:0});
cab_def.push({sku:'8.AB24.', description:'Drawer Base Cabinet 24" W x 34.5" H x 24" D', category:'Drawer Base Cabinet', type:'cornerendbasecabinet', door:'default', height:34.5, width:24, depth:24, base_height:0});
cab_def.push({sku:'8.AG1818.', description:'Appliance Garage 18" W x 18" H x 18" D', category:'Appliance Garage', type:'x', door:'garage', height:18, width:18, depth:18, base_height:54});
cab_def.push({sku:'8.AGD2418.', description:'Appliance Garage 24" W x 18" H x 24" D', category:'Appliance Garage', type:'x', door:'garage', height:18, width:24, depth:24, base_height:54});
cab_def.push({sku:'8.AGS1818.', description:'Appliance Garage 18" W x 18" H x 18" D', category:'Appliance Garage', type:'x', door:'garage', height:18, width:18, depth:18, base_height:54});
cab_def.push({sku:'8.AW30.', description:'Wall Angled End 12" W x 30" H x 12" D', category:'Wall Angled End', type:'x', door:'default', height:30, width:12, depth:12, base_height:54});
cab_def.push({sku:'8.AW36.', description:'Wall Angled End 12" W x 36" H x 12" D', category:'Wall Angled End', type:'x', door:'default', height:36, width:12, depth:12, base_height:54});
cab_def.push({sku:'8.AW42.', description:'Wall Angled End 12" W x 42" H x 12" D', category:'Wall Angled End', type:'x', door:'default', height:42, width:12, depth:12, base_height:54});
cab_def.push({sku:'8.B06.', description:'Base Cabinet 6" W x 34.5" H x 24" D', category:'Base Cabinet', type:'basecabinet', door:'default', height:34.5, width:6, depth:24, base_height:0});
cab_def.push({sku:'8.B09.', description:'Base Cabinet 9" W x 34.5" H x 24" D', category:'Base Cabinet', type:'basecabinet', door:'default', height:34.5, width:9, depth:24, base_height:0});
cab_def.push({sku:'8.B09FD.', description:'Base Cabinet 9" W x 34.5" H x 24" D', category:'Base Cabinet', type:'basecabinet', door:'default', height:34.5, width:9, depth:24, base_height:0});
cab_def.push({sku:'8.B09ND.', description:'Base Cabinet 9" W x 34.5" H x 24" D', category:'Base Cabinet', type:'basecabinet', door:'default', height:34.5, width:9, depth:24, base_height:0});
cab_def.push({sku:'8.B09P.', description:'Base Cabinet 9" W x 34.5" H x 24" D', category:'Base Cabinet', type:'basecabinet', door:'default', height:34.5, width:9, depth:24, base_height:0});
cab_def.push({sku:'8.B09PO.', description:'Base Cabinet 9" W x 34.5" H x 24" D', category:'Base Cabinet', type:'basecabinet', door:'default', height:34.5, width:9, depth:24, base_height:0});
cab_def.push({sku:'8.B12.', description:'Base Cabinet 12" W x 34.5" H x 24" D', category:'Base Cabinet', type:'basecabinet', door:'default', height:34.5, width:12, depth:24, base_height:0});
cab_def.push({sku:'8.B15.', description:'Base Cabinet 15" W x 34.5" H x 24" D', category:'Base Cabinet', type:'basecabinet', door:'default', height:34.5, width:15, depth:24, base_height:0});
cab_def.push({sku:'8.B15RT.', description:'Base Cabinet 15" W x 34.5" H x 24" D', category:'Base Cabinet', type:'basecabinet', door:'default', height:34.5, width:15, depth:24, base_height:0});
cab_def.push({sku:'8.B18.', description:'Base Cabinet 18" W x 34.5" H x 24" D', category:'Base Cabinet', type:'basecabinet', door:'default', height:34.5, width:18, depth:24, base_height:0});
cab_def.push({sku:'8.B18RT.', description:'Base Cabinet 18" W x 34.5" H x 24" D', category:'Base Cabinet', type:'basecabinet', door:'default', height:34.5, width:18, depth:24, base_height:0});
cab_def.push({sku:'8.B18TR.', description:'Base Cabinet 18" W x 34.5" H x 24" D', category:'Base Cabinet', type:'basecabinet', door:'default', height:34.5, width:18, depth:24, base_height:0});
cab_def.push({sku:'8.B21.', description:'Base Cabinet 21" W x 34.5" H x 24" D', category:'Base Cabinet', type:'basecabinet', door:'default', height:34.5, width:21, depth:24, base_height:0});
cab_def.push({sku:'8.B21RT.', description:'Base Cabinet 21" W x 34.5" H x 24" D', category:'Base Cabinet', type:'basecabinet', door:'default', height:34.5, width:21, depth:24, base_height:0});
cab_def.push({sku:'8.B24.', description:'Base Cabinet 24" W x 34.5" H x 24" D', category:'Base Cabinet', type:'basecabinet', door:'default', height:34.5, width:24, depth:24, base_height:0});
cab_def.push({sku:'8.B24B.', description:'Base Cabinet 24" W x 34.5" H x 24" D', category:'Base Cabinet', type:'basecabinet', door:'default', height:34.5, width:24, depth:24, base_height:0});
cab_def.push({sku:'8.B24RT.', description:'Base Cabinet 24" W x 34.5" H x 24" D', category:'Base Cabinet', type:'basecabinet', door:'default', height:34.5, width:24, depth:24, base_height:0});
cab_def.push({sku:'8.B27.', description:'Base Cabinet 27" W x 34.5" H x 24" D', category:'Base Cabinet', type:'basecabinet', door:'default', height:34.5, width:27, depth:24, base_height:0});
cab_def.push({sku:'8.B27B.', description:'Base Cabinet 27" W x 34.5" H x 24" D', category:'Base Cabinet', type:'basecabinet', door:'default', height:34.5, width:27, depth:24, base_height:0});
cab_def.push({sku:'8.B27RT.', description:'Base Cabinet 27" W x 34.5" H x 24" D', category:'Base Cabinet', type:'basecabinet', door:'default', height:34.5, width:27, depth:24, base_height:0});
cab_def.push({sku:'8.B30.', description:'Base Cabinet 30" W x 34.5" H x 24" D', category:'Base Cabinet', type:'basecabinet', door:'default', height:34.5, width:30, depth:24, base_height:0});
cab_def.push({sku:'8.B30B.', description:'Base Cabinet 30" W x 34.5" H x 24" D', category:'Base Cabinet', type:'basecabinet', door:'default', height:34.5, width:30, depth:24, base_height:0});
cab_def.push({sku:'8.B30RT.', description:'Base Cabinet 30" W x 34.5" H x 24" D', category:'Base Cabinet', type:'basecabinet', door:'default', height:34.5, width:30, depth:24, base_height:0});
cab_def.push({sku:'8.B33.', description:'Base Cabinet 33" W x 34.5" H x 24" D', category:'Base Cabinet', type:'basecabinet', door:'default', height:34.5, width:33, depth:24, base_height:0});
cab_def.push({sku:'8.B33B.', description:'Base Cabinet 33" W x 34.5" H x 24" D', category:'Base Cabinet', type:'basecabinet', door:'default', height:34.5, width:33, depth:24, base_height:0});
cab_def.push({sku:'8.B36.', description:'Base Cabinet 36" W x 34.5" H x 24" D', category:'Base Cabinet', type:'basecabinet', door:'default', height:34.5, width:36, depth:24, base_height:0});
cab_def.push({sku:'8.B36B.', description:'Base Cabinet 36" W x 34.5" H x 24" D', category:'Base Cabinet', type:'basecabinet', door:'default', height:34.5, width:36, depth:24, base_height:0});
cab_def.push({sku:'8.B36RT.', description:'Base Cabinet 36" W x 34.5" H x 24" D', category:'Base Cabinet', type:'basecabinet', door:'default', height:34.5, width:36, depth:24, base_height:0});
cab_def.push({sku:'8.B39.', description:'Base Cabinet 39" W x 34.5" H x 24" D', category:'Base Cabinet', type:'basecabinet', door:'default', height:34.5, width:39, depth:24, base_height:0});
cab_def.push({sku:'8.B42.', description:'Base Cabinet 42" W x 34.5" H x 24" D', category:'Base Cabinet', type:'basecabinet', door:'default', height:34.5, width:42, depth:24, base_height:0});
cab_def.push({sku:'8.B42B.', description:'Base Cabinet 42" W x 34.5" H x 24" D', category:'Base Cabinet', type:'basecabinet', door:'default', height:34.5, width:42, depth:24, base_height:0});
cab_def.push({sku:'8.B42RT.', description:'Base Cabinet 42" W x 34.5" H x 24" D', category:'Base Cabinet', type:'basecabinet', door:'default', height:34.5, width:42, depth:24, base_height:0});
cab_def.push({sku:'8.B48.', description:'Base Cabinet 48" W x 34.5" H x 24" D', category:'Base Cabinet', type:'basecabinet', door:'default', height:34.5, width:48, depth:24, base_height:0});
cab_def.push({sku:'8.BBC36/39.', description:'Blind Base Cabinet 36" W x 34.5" H x 24" D', category:'Base Cabinet', type:'[left/right]baseblindcornercabinet', door:'default', height:34.5, width:36, depth:24, base_height:0});
cab_def.push({sku:'8.BBC39.', description:'Blind Base Cabinet 39" W x 34.5" H x 24" D', category:'Base Cabinet', type:'[left/right]baseblindcornercabinet', door:'default', height:34.5, width:39, depth:24, base_height:0});
cab_def.push({sku:'8.BBC39/42.', description:'Blind Base Cabinet 39" W x 34.5" H x 24" D', category:'Base Cabinet', type:'[left/right]baseblindcornercabinet', door:'default', height:34.5, width:39, depth:24, base_height:0});
cab_def.push({sku:'8.BBC39/45.', description:'Blind Base Cabinet 36" W x 34.5" H x 24" D', category:'Base Cabinet', type:'[left/right]baseblindcornercabinet', door:'default', height:34.5, width:36, depth:24, base_height:0});
cab_def.push({sku:'8.BBC42.', description:'Blind Base Cabinet 42" W x 34.5" H x 24" D', category:'Base Cabinet', type:'[left/right]baseblindcornercabinet', door:'default', height:34.5, width:42, depth:24, base_height:0});
cab_def.push({sku:'8.BBC42/45.', description:'Blind Base Cabinet 42" W x 34.5" H x 24" D', category:'Base Cabinet', type:'[left/right]baseblindcornercabinet', door:'default', height:34.5, width:42, depth:24, base_height:0});
cab_def.push({sku:'8.BBC45.', description:'Blind Base Cabinet 45" W x 34.5" H x 24" D', category:'Base Cabinet', type:'[left/right]baseblindcornercabinet', door:'default', height:34.5, width:45, depth:24, base_height:0});
cab_def.push({sku:'8.BBC45/48.', description:'Blind Base Cabinet 45" W x 34.5" H x 24" D', category:'Base Cabinet', type:'[left/right]baseblindcornercabinet', door:'default', height:34.5, width:45, depth:24, base_height:0});
cab_def.push({sku:'8.BBC48/51.', description:'Blind Base Cabinet 48" W x 34.5" H x 24" D', category:'Base Cabinet', type:'[left/right]baseblindcornercabinet', door:'default', height:34.5, width:48, depth:24, base_height:0});
cab_def.push({sku:'8.BC24.', description:'Base Cabinet 24" W x 34.5" H x 24" D', category:'Base Cabinet', type:'cornerendbasecabinet', door:'default', height:34.5, width:24, depth:24, base_height:0});
cab_def.push({sku:'8.BEC24.', description:'Base End Cabinet 24" W x 34.5" H x 24" D', category:'Base Cabinet', type:'cornerendbasecabinet', door:'default', height:34.5, width:24, depth:24, base_height:0});
cab_def.push({sku:'8.BEOS9L.', description:'Base End Open Shelf 9" W x 34.5" H x 24" D', category:'Base Cabinet', type:'baseendshelfflip', door:'default', height:34.5, width:9, depth:24, base_height:0});
cab_def.push({sku:'8.BEOSR.', description:'Base End Open Shelf 9" W x 34.5" H x 24" D', category:'Base Cabinet', type:'baseendshelf', door:'default', height:34.5, width:9, depth:24, base_height:0});
cab_def.push({sku:'8.BFD1821.', description:'Base Cabinet 18" W x 34.5" H x 24" D', category:'Base Cabinet', type:'x', door:'default', height:34.5, width:18, depth:24, base_height:0});
cab_def.push({sku:'8.BMC30.', description:'Base Microwave Cabinet 30" W x 34.5" H x 24" D', category:'Base Cabinet', type:'basemicrowave', door:'default', height:34.5, width:30, depth:24, base_height:0});
cab_def.push({sku:'8.BOC30.', description:'Base Cabinet 30" W x 34.5" H x 24" D', category:'Base Cabinet', type:'x', door:'default', height:34.5, width:30, depth:24, base_height:0});
cab_def.push({sku:'8.BPO6.', description:'Base Cabinet 6" W x 34.5" H x 24" D', category:'Base Cabinet', type:'basecabinet', door:'default', height:34.5, width:6, depth:24, base_height:0});
cab_def.push({sku:'8.BPO9.', description:'Base Cabinet 9" W x 34.5" H x 24" D', category:'Base Cabinet', type:'basecabinet', door:'default', height:34.5, width:9, depth:24, base_height:0});
cab_def.push({sku:'8.BRA24.', description:'Base Cabinet 24" W x 34.5" H x 24" D', category:'Base Cabinet', type:'cornerendbasecabinet', door:'default', height:34.5, width:24, depth:24, base_height:0});
cab_def.push({sku:'8.BS24.', description:'Base Cabinet 12" W x 34.5" H x 24" D', category:'Base Cabinet', type:'baseendshelf', door:'default', height:34.5, width:12, depth:24, base_height:0});
cab_def.push({sku:'8.BTL1224.', description:'Base Cabinet 12" W x 34.5" H x 24" D', category:'Base Cabinet', type:'x', door:'default', height:34.5, width:12, depth:24, base_height:0});
cab_def.push({sku:'8.BTR1224.', description:'Base Cabinet 12" W x 34.5" H x 24" D', category:'Base Cabinet', type:'x', door:'default', height:34.5, width:12, depth:24, base_height:0});
cab_def.push({sku:'8.BWR6.', description:'Base Cabinet 6" W x 34.5" H x 24" D', category:'Base Cabinet', type:'x', door:'default', height:34.5, width:6, depth:24, base_height:0});
cab_def.push({sku:'8.DCB36.', description:'Diagonal Corner Base Cabinet 36" W x 34.5" H x 36" D', category:'Base Cabinet', type:'diagcornerbasecabinet', door:'default', height:34.5, width:36, depth:36, base_height:0});
cab_def.push({sku:'8.DCB42.', description:'Diagonal Corner Base Cabinet 42" W x 34.5" H x 42" D', category:'Base Cabinet', type:'diagcornerbasecabinet', door:'default', height:34.5, width:42, depth:42, base_height:0});
cab_def.push({sku:'8.ECB33.', description:'Easy Reach Corner Base Cabinet 33" W x 34.5" H x 33" D', category:'Base Cabinet', type:'easyreachcornerbasecabinet', door:'default', height:34.5, width:33, depth:33, base_height:0});
cab_def.push({sku:'8.ECB36.', description:'Easy Reach Corner Base Cabinet 36" W x 34.5" H x 36" D', category:'Base Cabinet', type:'easyreachcornerbasecabinet', door:'default', height:34.5, width:36, depth:36, base_height:0});
cab_def.push({sku:'8.ECB36L.', description:'Easy Reach Corner Base Cabinet 36" W x 34.5" H x 36" D', category:'Base Cabinet', type:'easyreachcornerbasecabinet', door:'default', height:34.5, width:36, depth:36, base_height:0});
cab_def.push({sku:'8.ECB36R.', description:'Easy Reach Corner Base Cabinet 36" W x 34.5" H x 36" D', category:'Base Cabinet', type:'easyreachcornerbasecabinet', door:'default', height:34.5, width:36, depth:36, base_height:0});
cab_def.push({sku:'8.EMB36.', description:'Easy Reach Corner Base Cabinet 36" W x 34.5" H x 36" D', category:'Base Cabinet', type:'easyreachcornerbasecabinet', door:'default', height:34.5, width:36, depth:36, base_height:0});
cab_def.push({sku:'8.ISL6030A.', description:'Island Base Cabinet 60" W x 34.5" H x 30" D', category:'Base Cabinet', type:'x', door:'default', height:34.5, width:60, depth:30, base_height:0});
cab_def.push({sku:'8.ISL6030B.', description:'Island Base Cabinet 60" W x 34.5" H x 30" D', category:'Base Cabinet', type:'x', door:'default', height:34.5, width:60, depth:30, base_height:0});
cab_def.push({sku:'8.ISL6036A.', description:'Island Base Cabinet 60" W x 34.5" H x 36" D', category:'Base Cabinet', type:'x', door:'default', height:34.5, width:60, depth:36, base_height:0});
cab_def.push({sku:'8.ISL6036B.', description:'Island Base Cabinet 60" W x 34.5" H x 36" D', category:'Base Cabinet', type:'x', door:'default', height:34.5, width:60, depth:36, base_height:0});
cab_def.push({sku:'8.ISL7230C.', description:'Island Base Cabinet 72" W x 34.5" H x 30" D', category:'Base Cabinet', type:'x', door:'default', height:34.5, width:72, depth:30, base_height:0});
cab_def.push({sku:'8.ISL7230D.', description:'Island Base Cabinet 72" W x 34.5" H x 30" D', category:'Base Cabinet', type:'x', door:'default', height:34.5, width:72, depth:30, base_height:0});
cab_def.push({sku:'8.ISL7236C.', description:'Island Base Cabinet 72" W x 34.5" H x 36" D', category:'Base Cabinet', type:'x', door:'default', height:34.5, width:72, depth:36, base_height:0});
cab_def.push({sku:'8.ISL7236D.', description:'Island Base Cabinet 72" W x 34.5" H x 36" D', category:'Base Cabinet', type:'x', door:'default', height:34.5, width:72, depth:36, base_height:0});
cab_def.push({sku:'8.LSB33.', description:'Lazy Susan Base Cabinet 33" W x 34.5" H x 33" D', category:'Base Cabinet', type:'easyreachcornerbasecabinet', door:'default', height:34.5, width:33, depth:33, base_height:0});
cab_def.push({sku:'8.LSB33R.', description:'Lazy Susan Base Cabinet 33" W x 34.5" H x 33" D', category:'Base Cabinet', type:'easyreachcornerbasecabinet', door:'default', height:34.5, width:33, depth:33, base_height:0});
cab_def.push({sku:'8.LSB36.', description:'Lazy Susan Base Cabinet 36" W x 34.5" H x 36" D', category:'Base Cabinet', type:'easyreachcornerbasecabinet', door:'default', height:34.5, width:36, depth:36, base_height:0});
cab_def.push({sku:'8.LSB36L.', description:'Lazy Susan Base Cabinet 36" W x 34.5" H x 36" D', category:'Base Cabinet', type:'easyreachcornerbasecabinet', door:'default', height:34.5, width:36, depth:36, base_height:0});
cab_def.push({sku:'8.LSB36R.', description:'Lazy Susan Base Cabinet 36" W x 34.5" H x 36" D', category:'Base Cabinet', type:'easyreachcornerbasecabinet', door:'default', height:34.5, width:36, depth:36, base_height:0});
cab_def.push({sku:'8.MC3018.', description:'Microwave Wall Shelf 30" W x 18" H x 12" D', category:'Microwave', type:'microwaveshelf', door:'default', height:18, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.MC303315.', description:'Microwave Wall Shelf 30" W x 3315" H x 15" D', category:'Microwave', type:'wallmicrowave', door:'default', height:3315, width:30, depth:15, base_height:54});
cab_def.push({sku:'8.MC304515.', description:'Microwave Wall Shelf 30" W x 45" H x 15" D', category:'Microwave', type:'wallmicrowave', door:'default', height:45, width:30, depth:15, base_height:54});
cab_def.push({sku:'8.OC3084.', description:'Oven 30" W x 84" H x 24" D', category:'Oven', type:'ovencabinet', door:'default', height:84, width:30, depth:24, base_height:0});
cab_def.push({sku:'8.OC3090.', description:'Oven 30" W x 90" H x 24" D', category:'Oven', type:'ovencabinet', door:'default', height:90, width:30, depth:24, base_height:0});
cab_def.push({sku:'8.OC3093.', description:'Oven 30" W x 93" H x 24" D', category:'Oven', type:'ovencabinet', door:'default', height:93, width:30, depth:24, base_height:0});
cab_def.push({sku:'8.OC3096.', description:'Oven 30" W x 96" H x 24" D', category:'Oven', type:'ovencabinet', door:'default', height:96, width:30, depth:24, base_height:0});
cab_def.push({sku:'8.OC3384.', description:'Oven 33" W x 84" H x 24" D', category:'Oven', type:'ovencabinet', door:'default', height:84, width:33, depth:24, base_height:0});
cab_def.push({sku:'8.OC3390.', description:'Oven 33" W x 90" H x 24" D', category:'Oven', type:'ovencabinet', door:'default', height:90, width:33, depth:24, base_height:0});
cab_def.push({sku:'8.OC3396.', description:'Oven 33" W x 96" H x 24" D', category:'Oven', type:'ovencabinet', door:'default', height:96, width:33, depth:24, base_height:0});
cab_def.push({sku:'8.OE1230.', description:'Shelf 12" W x 30" H x 12.5" D', category:'Shelf', type:'wallshelf[/flip]', door:'default', height:30, width:12, depth:12.5, base_height:54});
cab_def.push({sku:'8.OE1236.', description:'Shelf 12" W x 36" H x 12" D', category:'Shelf', type:'wallshelf[/flip]', door:'default', height:36, width:12, depth:12, base_height:54});
cab_def.push({sku:'8.OE1242.', description:'Shelf 12" W x 42" H x 12.5" D', category:'Shelf', type:'wallshelf[/flip]', door:'default', height:42, width:12, depth:12.5, base_height:54});
cab_def.push({sku:'8.OE630.', description:'Shelf 6" W x 30" H x 12.5" D', category:'Shelf', type:'wallshelf[/flip]', door:'default', height:30, width:6, depth:12.5, base_height:54});
cab_def.push({sku:'8.OE636.', description:'Shelf 6" W x 36" H x 12" D', category:'Shelf', type:'wallshelf[/flip]', door:'default', height:36, width:6, depth:12, base_height:54});
cab_def.push({sku:'8.OE642.', description:'Shelf 6" W x 42" H x 12.5" D', category:'Shelf', type:'wallshelf[/flip]', door:'default', height:42, width:6, depth:12.5, base_height:54});
cab_def.push({sku:'8.OU3096.', description:'Oven 33" W x 96" H x 24" D', category:'Oven', type:'ovencabinet', door:'default', height:96, width:33, depth:24, base_height:0});
cab_def.push({sku:'8.OU3384.', description:'Oven 33" W x 84" H x 24" D', category:'Oven', type:'ovencabinet', door:'default', height:84, width:33, depth:24, base_height:0});
cab_def.push({sku:'8.OU3390.', description:'Oven 33" W x 90" H x 24" D', category:'Oven', type:'ovencabinet', door:'default', height:90, width:33, depth:24, base_height:0});
cab_def.push({sku:'8.PH3624.', description:'Range Hood 36" W x 24" H x 15" D', category:'Range Hood', type:'x', door:'default', height:24, width:36, depth:15, base_height:54});
cab_def.push({sku:'8.PH4224.', description:'Range Hood 42" W x 24" H x 15" D', category:'Range Hood', type:'x', door:'default', height:24, width:42, depth:15, base_height:54});
cab_def.push({sku:'8.PR3015.', description:'Plate Rack 30" W x 15" H x 12" D', category:'Plate Rack', type:'platerack', door:'default', height:15, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.PR3018.', description:'Plate Rack 30" W x 18" H x 12" D', category:'Plate Rack', type:'platerack', door:'default', height:18, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.PR3615.', description:'Plate Rack 36" W x 15" H x 12" D', category:'Plate Rack', type:'platerack', door:'default', height:15, width:36, depth:12, base_height:54});
cab_def.push({sku:'8.RHA423018.', description:'Range Hood 42" W x 30" H x 21" D', category:'Range Hood', type:'x', door:'default', height:30, width:42, depth:21, base_height:54});
cab_def.push({sku:'8.RHA483018.', description:'Range Hood 48" W x 30" H x 21" D', category:'Range Hood', type:'x', door:'default', height:30, width:48, depth:21, base_height:54});
cab_def.push({sku:'8.RHA543018.', description:'Range Hood 54" W x 30" H x 21" D', category:'Range Hood', type:'x', door:'default', height:30, width:54, depth:21, base_height:54});
cab_def.push({sku:'8.RHC4238.', description:'Range Hood 42" W x 38" H x 17" D', category:'Range Hood', type:'x', door:'default', height:38, width:42, depth:17, base_height:54});
cab_def.push({sku:'8.RHC4244.', description:'Range Hood 42" W x 44" H x 17" D', category:'Range Hood', type:'x', door:'default', height:44, width:42, depth:17, base_height:54});
cab_def.push({sku:'8.RHE3024.', description:'Range Hood 30" W x 24" H x 22" D', category:'Range Hood', type:'x', door:'default', height:24, width:30, depth:22, base_height:54});
cab_def.push({sku:'8.RHE3624.', description:'Range Hood 36" W x 24" H x 22" D', category:'Range Hood', type:'x', door:'default', height:24, width:36, depth:22, base_height:54});
cab_def.push({sku:'8.RHS6060.', description:'Range Hood 60" W x 60" H x 12" D', category:'Range Hood', type:'x', door:'default', height:60, width:60, depth:12, base_height:54});
cab_def.push({sku:'8.RHS6066.', description:'Range Hood 60" W x 66" H x 12" D', category:'Range Hood', type:'x', door:'default', height:66, width:60, depth:12, base_height:54});
cab_def.push({sku:'8.SB24.', description:'Sink Base Cabinet 24" W x 34.5" H x 24" D', category:'Sink Base Cabinet', type:'sinkbasecabinet', door:'default', height:34.5, width:24, depth:24, base_height:0});
cab_def.push({sku:'8.SB27.', description:'Sink Base Cabinet 27" W x 34.5" H x 24" D', category:'Sink Base Cabinet', type:'sinkbasecabinet', door:'default', height:34.5, width:27, depth:24, base_height:0});
cab_def.push({sku:'8.SB30.', description:'Sink Base Cabinet 30" W x 34.5" H x 24" D', category:'Sink Base Cabinet', type:'sinkbasecabinet', door:'default', height:34.5, width:30, depth:24, base_height:0});
cab_def.push({sku:'8.SB30B.', description:'Sink Base Cabinet 30" W x 34.5" H x 24" D', category:'Sink Base Cabinet', type:'sinkbasecabinet', door:'default', height:34.5, width:30, depth:24, base_height:0});
cab_def.push({sku:'8.SB33.', description:'Sink Base Cabinet 33" W x 34.5" H x 24" D', category:'Sink Base Cabinet', type:'sinkbasecabinet', door:'default', height:34.5, width:33, depth:24, base_height:0});
cab_def.push({sku:'8.SB33B.', description:'Sink Base Cabinet 33" W x 34.5" H x 24" D', category:'Sink Base Cabinet', type:'sinkbasecabinet', door:'default', height:34.5, width:33, depth:24, base_height:0});
cab_def.push({sku:'8.SB36.', description:'Sink Base Cabinet 36" W x 34.5" H x 24" D', category:'Sink Base Cabinet', type:'sinkbasecabinet', door:'default', height:34.5, width:36, depth:24, base_height:0});
cab_def.push({sku:'8.SB36B.', description:'Sink Base Cabinet 36" W x 34.5" H x 24" D', category:'Sink Base Cabinet', type:'sinkbasecabinet', door:'default', height:34.5, width:36, depth:24, base_height:0});
cab_def.push({sku:'8.SB39.', description:'Sink Base Cabinet 39" W x 34.5" H x 24" D', category:'Sink Base Cabinet', type:'sinkbasecabinet', door:'default', height:34.5, width:39, depth:24, base_height:0});
cab_def.push({sku:'8.SB42.', description:'Sink Base Cabinet 42" W x 34.5" H x 24" D', category:'Sink Base Cabinet', type:'sinkbasecabinet', door:'default', height:34.5, width:42, depth:24, base_height:0});
cab_def.push({sku:'8.SB42B.', description:'Sink Base Cabinet 42" W x 34.5" H x 24" D', category:'Sink Base Cabinet', type:'sinkbasecabinet', door:'default', height:34.5, width:42, depth:24, base_height:0});
cab_def.push({sku:'8.SB48.', description:'Sink Base Cabinet 48" W x 34.5" H x 24" D', category:'Sink Base Cabinet', type:'sinkbasecabinet', door:'default', height:34.5, width:48, depth:24, base_height:0});
cab_def.push({sku:'8.SB60.', description:'Sink Base Cabinet 60" W x 34.5" H x 24" D', category:'Sink Base Cabinet', type:'sinkbasecabinet', door:'default', height:34.5, width:60, depth:24, base_height:0});
cab_def.push({sku:'8.SH3630.', description:'Range Hood 36" W x 30" H x 16" D', category:'Range Hood', type:'x', door:'default', height:30, width:36, depth:16, base_height:54});
cab_def.push({sku:'8.SH4230.', description:'Range Hood 42" W x 30" H x 16" D', category:'Range Hood', type:'x', door:'default', height:30, width:42, depth:16, base_height:54});
cab_def.push({sku:'8.TH3024.', description:'Range Hood 30" W x 30" H x 12" D', category:'Range Hood', type:'x', door:'default', height:30, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.TH3624.', description:'Range Hood 36" W x 36" H x 12" D', category:'Range Hood', type:'x', door:'default', height:36, width:36, depth:12, base_height:54});
cab_def.push({sku:'8.VA30.', description:'Valance 30" W x 4.5" H x 0.75" D', category:'Valance', type:'valance', door:'default', height:4.5, width:30, depth:0.75, base_height:67.25});
cab_def.push({sku:'8.VA36.', description:'Valance 36" W x 6" H x 0.75" D', category:'Valance', type:'valance', door:'default', height:6, width:36, depth:0.75, base_height:66});
cab_def.push({sku:'8.VA48.', description:'Valance 48" W x 4.5" H x 0.75" D', category:'Valance', type:'valance', door:'default', height:4.5, width:48, depth:0.75, base_height:67.25});
cab_def.push({sku:'8.VA60.', description:'Valance 60" W x 4.5" H x 0.75" D', category:'Valance', type:'valance', door:'default', height:4.5, width:60, depth:0.75, base_height:67.25});
cab_def.push({sku:'8.VAL36.', description:'Valance 36" W x 6" H x 0.75" D', category:'Valance', type:'valance', door:'default', height:6, width:36, depth:0.75, base_height:66});
cab_def.push({sku:'8.VAL36F.', description:'Valance 36" W x 4.75" H x 0.75" D', category:'Valance', type:'valance', door:'default', height:4.75, width:36, depth:0.75, base_height:67.25});
cab_def.push({sku:'8.VAL48.', description:'Valance 48" W x 3" H x 0.75" D', category:'Valance', type:'valance', door:'default', height:3, width:48, depth:0.75, base_height:68});
cab_def.push({sku:'8.VAR54.', description:'Valance 54" W x 6" H x 0.75" D', category:'Valance', type:'valance', door:'default', height:6, width:54, depth:0.75, base_height:66});
cab_def.push({sku:'8.VARP-42.', description:'Valance 42" W x 4.5" H x 0.75" D', category:'Valance', type:'valance', door:'default', height:4.5, width:42, depth:0.75, base_height:67.25});
cab_def.push({sku:'8.VARP-54.', description:'Valance 54" W x 4.5" H x 0.75" D', category:'Valance', type:'valance', door:'default', height:4.5, width:54, depth:0.75, base_height:67.25});
cab_def.push({sku:'8.VAS30.', description:'Valance 30" W x 4.5" H x 0.75" D', category:'Valance', type:'valance', door:'default', height:4.5, width:30, depth:0.75, base_height:67.25});
cab_def.push({sku:'8.VAS48.', description:'Valance 48" W x 4.5" H x 0.75" D', category:'Valance', type:'valance', door:'default', height:4.5, width:48, depth:0.75, base_height:67.25});
cab_def.push({sku:'8.VAS60.', description:'Valance 60" W x 4.5" H x 0.75" D', category:'Valance', type:'valance', door:'default', height:4.5, width:60, depth:0.75, base_height:67.25});
cab_def.push({sku:'8.VST96.', description:'Valance 96" W x 6" H x 0.75" D', category:'Valance', type:'valance', door:'default', height:6, width:96, depth:0.75, base_height:66});
cab_def.push({sku:'8.W0630.', description:'Wall Cabinet 6" W x 30" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'slab', height:30, width:6, depth:12, base_height:54});
cab_def.push({sku:'8.W0636.', description:'Wall Cabinet 6" W x 36" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'slab', height:36, width:6, depth:12, base_height:54});
cab_def.push({sku:'8.W0642.', description:'Wall Cabinet 6" W x 42" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'slab', height:42, width:6, depth:12, base_height:54});
cab_def.push({sku:'8.W0930.', description:'Wall Cabinet 9" W x 30" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:30, width:9, depth:12, base_height:54});
cab_def.push({sku:'8.W0936.', description:'Wall Cabinet 9" W x 36" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:36, width:9, depth:12, base_height:54});
cab_def.push({sku:'8.W0942.', description:'Wall Cabinet 9" W x 42" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:42, width:9, depth:12, base_height:54});
cab_def.push({sku:'8.W1230.', description:'Wall Cabinet 12" W x 30" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:30, width:12, depth:12, base_height:54});
cab_def.push({sku:'8.W1236.', description:'Wall Cabinet 12" W x 36" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:36, width:12, depth:12, base_height:54});
cab_def.push({sku:'8.W1242.', description:'Wall Cabinet 12" W x 42" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:42, width:12, depth:12, base_height:54});
cab_def.push({sku:'8.W1530.', description:'Wall Cabinet 15" W x 30" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:30, width:15, depth:12, base_height:54});
cab_def.push({sku:'8.W1530GD.', description:'Wall Cabinet 15" W x 30" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'glass', height:30, width:15, depth:12, base_height:54});
cab_def.push({sku:'8.W1530MD.', description:'Wall Cabinet 15" W x 30" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'mullion', height:30, width:15, depth:12, base_height:54});
cab_def.push({sku:'8.W1530ND.', description:'Wall Cabinet 15" W x 30" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'none', height:30, width:15, depth:12, base_height:54});
cab_def.push({sku:'8.W1536.', description:'Wall Cabinet 15" W x 36" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:36, width:15, depth:12, base_height:54});
cab_def.push({sku:'8.W1536GD.', description:'Wall Cabinet 15" W x 36" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'glass', height:36, width:15, depth:12, base_height:54});
cab_def.push({sku:'8.W1536MD.', description:'Wall Cabinet 15" W x 36" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'mullion', height:36, width:15, depth:12, base_height:54});
cab_def.push({sku:'8.W1536ND.', description:'Wall Cabinet 15" W x 36" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'none', height:36, width:15, depth:12, base_height:54});
cab_def.push({sku:'8.W1542.', description:'Wall Cabinet 15" W x 42" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:42, width:15, depth:12, base_height:54});
cab_def.push({sku:'8.W1542GD.', description:'Wall Cabinet 15" W x 42" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'glass', height:42, width:15, depth:12, base_height:54});
cab_def.push({sku:'8.W1542MD.', description:'Wall Cabinet 15" W x 42" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'mullion', height:42, width:15, depth:12, base_height:54});
cab_def.push({sku:'8.W1542ND.', description:'Wall Cabinet 15" W x 42" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'none', height:42, width:15, depth:12, base_height:54});
cab_def.push({sku:'8.W1830.', description:'Wall Cabinet 18" W x 30" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:30, width:18, depth:12, base_height:54});
cab_def.push({sku:'8.W1830GD.', description:'Wall Cabinet 18" W x 30" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'glass', height:30, width:18, depth:12, base_height:54});
cab_def.push({sku:'8.W1830MD.', description:'Wall Cabinet 18" W x 30" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'mullion', height:30, width:18, depth:12, base_height:54});
cab_def.push({sku:'8.W1830ND.', description:'Wall Cabinet 18" W x 36" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'none', height:36, width:18, depth:12, base_height:54});
cab_def.push({sku:'8.W1836.', description:'Wall Cabinet 18" W x 36" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:36, width:18, depth:12, base_height:54});
cab_def.push({sku:'8.W1836GD.', description:'Wall Cabinet 18" W x 36" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'glass', height:36, width:18, depth:12, base_height:54});
cab_def.push({sku:'8.W1836MD.', description:'Wall Cabinet 18" W x 36" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'mullion', height:36, width:18, depth:12, base_height:54});
cab_def.push({sku:'8.W1836ND.', description:'Wall Cabinet 18" W x 36" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'none', height:36, width:18, depth:12, base_height:54});
cab_def.push({sku:'8.W1842.', description:'Wall Cabinet 18" W x 42" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:42, width:18, depth:12, base_height:54});
cab_def.push({sku:'8.W1842GD.', description:'Wall Cabinet 18" W x 42" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'glass', height:42, width:18, depth:12, base_height:54});
cab_def.push({sku:'8.W1842MD.', description:'Wall Cabinet 18" W x 42" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'mullion', height:42, width:18, depth:12, base_height:54});
cab_def.push({sku:'8.W1842ND.', description:'Wall Cabinet 18" W x 42" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'none', height:42, width:18, depth:12, base_height:54});
cab_def.push({sku:'8.W2115.', description:'Wall Cabinet 21" W x 15" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:15, width:21, depth:12, base_height:54});
cab_def.push({sku:'8.W2118.', description:'Wall Cabinet 21" W x 18" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:18, width:21, depth:12, base_height:54});
cab_def.push({sku:'8.W2130.', description:'Wall Cabinet 21" W x 30" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:30, width:21, depth:12, base_height:54});
cab_def.push({sku:'8.W2136.', description:'Wall Cabinet 21" W x 36" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:36, width:21, depth:12, base_height:54});
cab_def.push({sku:'8.W2142.', description:'Wall Cabinet 21" W x 42" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:42, width:21, depth:12, base_height:54});
cab_def.push({sku:'8.W2412.', description:'Wall Cabinet 24" W x 12" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:12, width:24, depth:12, base_height:54});
cab_def.push({sku:'8.W2415.', description:'Wall Cabinet 24" W x 12" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:12, width:24, depth:12, base_height:54});
cab_def.push({sku:'8.W2418.', description:'Wall Cabinet 24" W x 18" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:18, width:24, depth:12, base_height:54});
cab_def.push({sku:'8.W2424.', description:'Wall Cabinet 24" W x 24" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:24, width:24, depth:12, base_height:54});
cab_def.push({sku:'8.W2430.', description:'Wall Cabinet 24" W x 30" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:30, width:24, depth:12, base_height:54});
cab_def.push({sku:'8.W2430B.', description:'Wall Cabinet 24" W x 30" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:30, width:24, depth:12, base_height:54});
cab_def.push({sku:'8.W2436.', description:'Wall Cabinet 24" W x 36" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:36, width:24, depth:12, base_height:54});
cab_def.push({sku:'8.W2436B.', description:'Wall Cabinet 24" W x 36" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:36, width:24, depth:12, base_height:54});
cab_def.push({sku:'8.W2442.', description:'Wall Cabinet 24" W x 42" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:42, width:24, depth:12, base_height:54});
cab_def.push({sku:'8.W2442B.', description:'Wall Cabinet 24" W x 42" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:42, width:24, depth:12, base_height:54});
cab_def.push({sku:'8.W2724.', description:'Wall Cabinet 27" W x 24" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:24, width:27, depth:12, base_height:54});
cab_def.push({sku:'8.W2730.', description:'Wall Cabinet 27" W x 30" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:30, width:27, depth:12, base_height:54});
cab_def.push({sku:'8.W2730B.', description:'Wall Cabinet 27" W x 30" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:30, width:27, depth:12, base_height:54});
cab_def.push({sku:'8.W2736.', description:'Wall Cabinet 27" W x 36" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:36, width:27, depth:12, base_height:54});
cab_def.push({sku:'8.W2736B.', description:'Wall Cabinet 27" W x 36" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:36, width:27, depth:12, base_height:54});
cab_def.push({sku:'8.W2742.', description:'Wall Cabinet 27" W x 42" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:42, width:27, depth:12, base_height:54});
cab_def.push({sku:'8.W2742B.', description:'Wall Cabinet 27" W x 42" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:42, width:27, depth:12, base_height:54});
cab_def.push({sku:'8.W3012.', description:'Wall Cabinet 30" W x 12" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:12, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.W301224.', description:'Wall Cabinet 30" W x 12" H x 24" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:12, width:30, depth:24, base_height:54});
cab_def.push({sku:'8.W3012B.', description:'Wall Cabinet 30" W x 12" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:12, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.W3015.', description:'Wall Cabinet 30" W x 12" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:12, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.W301524.', description:'Wall Cabinet 30" W x 15" H x 24" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:15, width:30, depth:24, base_height:54});
cab_def.push({sku:'8.W3015B.', description:'Wall Cabinet 30" W x 15" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:15, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.W3015PL.', description:'Wall Cabinet 30" W x 15" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:15, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.W3018.', description:'Wall Cabinet 30" W x 18" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:18, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.W301824.', description:'Wall Cabinet 30" W x 18" H x 24" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:18, width:30, depth:24, base_height:54});
cab_def.push({sku:'8.W3018B.', description:'Wall Cabinet 30" W x 18" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:18, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.W3018HD.', description:'Wall Cabinet 30" W x 18" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:18, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.W3021.', description:'Wall Cabinet 30" W x 21" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:21, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.W3024.', description:'Wall Cabinet 30" W x 24" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:24, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.W302424.', description:'Wall Cabinet 30" W x 24" H x 24" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:24, width:30, depth:24, base_height:54});
cab_def.push({sku:'8.W3024B.', description:'Wall Cabinet 30" W x 24" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:24, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.W3024HD.', description:'Wall Cabinet 30" W x 24" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:24, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.W3027.', description:'Wall Cabinet 30" W x 27" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:27, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.W3030.', description:'Wall Cabinet 30" W x 30" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:30, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.W3030B.', description:'Wall Cabinet 30" W x 30" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:30, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.W3030GD.', description:'Wall Cabinet 30" W x 30" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'glass', height:30, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.W3030MD.', description:'Wall Cabinet 30" W x 30" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'mullion', height:30, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.W3030ND.', description:'Wall Cabinet 30" W x 30" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'none', height:30, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.W3036.', description:'Wall Cabinet 30" W x 36" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:36, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.W3036B.', description:'Wall Cabinet 30" W x 36" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:36, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.W3036GD.', description:'Wall Cabinet 30" W x 36" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'glass', height:36, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.W3036MD.', description:'Wall Cabinet 30" W x 36" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'mullion', height:36, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.W3036ND.', description:'Wall Cabinet 30" W x 36" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'none', height:36, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.W3042.', description:'Wall Cabinet 30" W x 42" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:42, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.W3042B.', description:'Wall Cabinet 30" W x 42" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:42, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.W3042GD.', description:'Wall Cabinet 30" W x 42" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'glass', height:42, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.W3042MC.', description:'Wall Cabinet 30" W x 42" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'mullion', height:42, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.W3042MD.', description:'Wall Cabinet 30" W x 42" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'mullion', height:42, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.W3042ND.', description:'Wall Cabinet 30" W x 42" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'none', height:42, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.W3312.', description:'Wall Cabinet 33" W x 12" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:12, width:33, depth:12, base_height:54});
cab_def.push({sku:'8.W331224.', description:'Wall Cabinet 33" W x 12" H x 24" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:12, width:33, depth:24, base_height:54});
cab_def.push({sku:'8.W3312B.', description:'Wall Cabinet 33" W x 12" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:12, width:33, depth:12, base_height:54});
cab_def.push({sku:'8.W3315.', description:'Wall Cabinet 33" W x 12" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:12, width:33, depth:12, base_height:54});
cab_def.push({sku:'8.W331524.', description:'Wall Cabinet 33" W x 15" H x 24" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:15, width:33, depth:24, base_height:54});
cab_def.push({sku:'8.W331524B.', description:'Wall Cabinet 33" W x 15" H x 24" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:15, width:33, depth:24, base_height:54});
cab_def.push({sku:'8.W3315B.', description:'Wall Cabinet 33" W x 15" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:15, width:33, depth:12, base_height:54});
cab_def.push({sku:'8.W3318.', description:'Wall Cabinet 33" W x 18" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:18, width:33, depth:12, base_height:54});
cab_def.push({sku:'8.W331824.', description:'Wall Cabinet 33" W x 18" H x 24" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:18, width:33, depth:24, base_height:54});
cab_def.push({sku:'8.W3318B.', description:'Wall Cabinet 33" W x 18" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:18, width:33, depth:12, base_height:54});
cab_def.push({sku:'8.W3324.', description:'Wall Cabinet 33" W x 24" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:24, width:33, depth:12, base_height:54});
cab_def.push({sku:'8.W332424.', description:'Wall Cabinet 33" W x 24" H x 24" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:24, width:33, depth:24, base_height:54});
cab_def.push({sku:'8.W3330.', description:'Wall Cabinet 33" W x 30" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:30, width:33, depth:12, base_height:54});
cab_def.push({sku:'8.W3330B.', description:'Wall Cabinet 33" W x 30" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:30, width:33, depth:12, base_height:54});
cab_def.push({sku:'8.W3336.', description:'Wall Cabinet 33" W x 36" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:36, width:33, depth:12, base_height:54});
cab_def.push({sku:'8.W3336B.', description:'Wall Cabinet 33" W x 36" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:36, width:33, depth:12, base_height:54});
cab_def.push({sku:'8.W3342.', description:'Wall Cabinet 33" W x 42" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:42, width:33, depth:12, base_height:54});
cab_def.push({sku:'8.W3342B.', description:'Wall Cabinet 33" W x 42" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:42, width:33, depth:12, base_height:54});
cab_def.push({sku:'8.W3612.', description:'Wall Cabinet 36" W x 12" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:12, width:36, depth:12, base_height:54});
cab_def.push({sku:'8.W361224.', description:'Wall Cabinet 36" W x 12" H x 24" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:12, width:36, depth:24, base_height:54});
cab_def.push({sku:'8.W3612B.', description:'Wall Cabinet 36" W x 12" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:12, width:36, depth:12, base_height:54});
cab_def.push({sku:'8.W3615.', description:'Wall Cabinet 36" W x 12" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:12, width:36, depth:12, base_height:54});
cab_def.push({sku:'8.W361524.', description:'Wall Cabinet 36" W x 15" H x 24" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:15, width:36, depth:24, base_height:54});
cab_def.push({sku:'8.W361524B.', description:'Wall Cabinet 36" W x 15" H x 24" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:15, width:36, depth:24, base_height:54});
cab_def.push({sku:'8.W3615B.', description:'Wall Cabinet 36" W x 15" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:15, width:36, depth:12, base_height:54});
cab_def.push({sku:'8.W3615PL.', description:'Wall Cabinet 36" W x 15" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:15, width:36, depth:12, base_height:54});
cab_def.push({sku:'8.W3618.', description:'Wall Cabinet 36" W x 18" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:18, width:36, depth:12, base_height:54});
cab_def.push({sku:'8.W361824.', description:'Wall Cabinet 36" W x 18" H x 24" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:18, width:36, depth:24, base_height:54});
cab_def.push({sku:'8.W3618B.', description:'Wall Cabinet 36" W x 18" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:18, width:36, depth:12, base_height:54});
cab_def.push({sku:'8.W3624.', description:'Wall Cabinet 36" W x 24" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:24, width:36, depth:12, base_height:54});
cab_def.push({sku:'8.W362424.', description:'Wall Cabinet 36" W x 24" H x 24" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:24, width:36, depth:24, base_height:54});
cab_def.push({sku:'8.W362424B.', description:'Wall Cabinet 36" W x 24" H x 24" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:24, width:36, depth:24, base_height:54});
cab_def.push({sku:'8.W3624B.', description:'Wall Cabinet 36" W x 24" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:24, width:36, depth:12, base_height:54});
cab_def.push({sku:'8.W3630.', description:'Wall Cabinet 36" W x 30" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:30, width:36, depth:12, base_height:54});
cab_def.push({sku:'8.W3630B.', description:'Wall Cabinet 36" W x 30" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:30, width:36, depth:12, base_height:54});
cab_def.push({sku:'8.W3630GD.', description:'Wall Cabinet 36" W x 30" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'glass', height:30, width:36, depth:12, base_height:54});
cab_def.push({sku:'8.W3630MD.', description:'Wall Cabinet 36" W x 30" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'mullion', height:30, width:36, depth:12, base_height:54});
cab_def.push({sku:'8.W3630ND.', description:'Wall Cabinet 36" W x 30" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'none', height:30, width:36, depth:12, base_height:54});
cab_def.push({sku:'8.W3636.', description:'Wall Cabinet 36" W x 36" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:36, width:36, depth:12, base_height:54});
cab_def.push({sku:'8.W3636B.', description:'Wall Cabinet 36" W x 36" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:36, width:36, depth:12, base_height:54});
cab_def.push({sku:'8.W3636GD.', description:'Wall Cabinet 36" W x 36" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'glass', height:36, width:36, depth:12, base_height:54});
cab_def.push({sku:'8.W3636MD.', description:'Wall Cabinet 36" W x 36" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'mullion', height:36, width:36, depth:12, base_height:54});
cab_def.push({sku:'8.W3636ND.', description:'Wall Cabinet 36" W x 36" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'none', height:36, width:36, depth:12, base_height:54});
cab_def.push({sku:'8.W3642.', description:'Wall Cabinet 36" W x 42" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:42, width:36, depth:12, base_height:54});
cab_def.push({sku:'8.W3642B.', description:'Wall Cabinet 36" W x 42" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:42, width:36, depth:12, base_height:54});
cab_def.push({sku:'8.W3642GD.', description:'Wall Cabinet 36" W x 42" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'glass', height:42, width:36, depth:12, base_height:54});
cab_def.push({sku:'8.W3642MD.', description:'Wall Cabinet 36" W x 42" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'mullion', height:42, width:36, depth:12, base_height:54});
cab_def.push({sku:'8.W3642ND.', description:'Wall Cabinet 36" W x 42" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'none', height:42, width:36, depth:12, base_height:54});
cab_def.push({sku:'8.W3930.', description:'Wall Cabinet 39" W x 30" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:30, width:39, depth:12, base_height:54});
cab_def.push({sku:'8.W3936.', description:'Wall Cabinet 39" W x 36" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:36, width:39, depth:12, base_height:54});
cab_def.push({sku:'8.W3942.', description:'Wall Cabinet 39" W x 42" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:42, width:39, depth:12, base_height:54});
cab_def.push({sku:'8.W4212.', description:'Wall Cabinet 42" W x 12" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:12, width:42, depth:12, base_height:54});
cab_def.push({sku:'8.W4224.', description:'Wall Cabinet 42" W x 24" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:24, width:42, depth:12, base_height:54});
cab_def.push({sku:'8.W4230.', description:'Wall Cabinet 42" W x 30" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:30, width:42, depth:12, base_height:54});
cab_def.push({sku:'8.W4230B.', description:'Wall Cabinet 42" W x 30" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:30, width:42, depth:12, base_height:54});
cab_def.push({sku:'8.W4236.', description:'Wall Cabinet 42" W x 36" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:36, width:42, depth:12, base_height:54});
cab_def.push({sku:'8.W4236B.', description:'Wall Cabinet 42" W x 36" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:36, width:42, depth:12, base_height:54});
cab_def.push({sku:'8.W4242.', description:'Wall Cabinet 42" W x 42" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:42, width:42, depth:12, base_height:54});
cab_def.push({sku:'8.W4242B.', description:'Wall Cabinet 42" W x 42" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:42, width:42, depth:12, base_height:54});
cab_def.push({sku:'8.W4812.', description:'Wall Cabinet 48" W x 12" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:12, width:48, depth:12, base_height:54});
cab_def.push({sku:'8.W481224.', description:'Wall Cabinet 48" W x 12" H x 24" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:12, width:48, depth:24, base_height:54});
cab_def.push({sku:'8.W4830.', description:'Wall Cabinet 48" W x 30" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:30, width:48, depth:12, base_height:54});
cab_def.push({sku:'8.W6030-0.', description:'Wall Cabinet 60" W x 30" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:30, width:60, depth:12, base_height:54});
cab_def.push({sku:'8.W6030.', description:'Wall Cabinet 60" W x 30" H x 12" D', category:'Wall Cabinet', type:'wallcabinet', door:'default', height:30, width:60, depth:12, base_height:54});
cab_def.push({sku:'8.WAE1230.', description:'Wall Cabinet 12" W x 30" H x 12" D', category:'Wall Cabinet', type:'x', door:'default', height:30, width:12, depth:12, base_height:54});
cab_def.push({sku:'8.WAE1236.', description:'Wall Cabinet 12" W x 36" H x 12" D', category:'Wall Cabinet', type:'x', door:'default', height:36, width:12, depth:12, base_height:54});
cab_def.push({sku:'8.WAE1242.', description:'Wall Cabinet 12" W x 42" H x 12" D', category:'Wall Cabinet', type:'x', door:'default', height:42, width:12, depth:12, base_height:54});
cab_def.push({sku:'8.WBC2430.', description:'Wall Blind Cabinet 24" W x 30" H x 12" D', category:'Wall Cabinet', type:'[left/right]wallblindcornercabinet', door:'default', height:30, width:24, depth:12, base_height:54});
cab_def.push({sku:'8.WBC2436.', description:'Wall Blind Cabinet 24" W x 36" H x 12" D', category:'Wall Cabinet', type:'[left/right]wallblindcornercabinet', door:'default', height:36, width:24, depth:12, base_height:54});
cab_def.push({sku:'8.WBC2442.', description:'Wall Blind Cabinet 24" W x 42" H x 12" D', category:'Wall Cabinet', type:'[left/right]wallblindcornercabinet', door:'default', height:42, width:24, depth:12, base_height:54});
cab_def.push({sku:'8.WBC2730.', description:'Wall Blind Cabinet 30" W x 30" H x 12" D', category:'Wall Cabinet', type:'[left/right]wallblindcornercabinet', door:'default', height:30, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.WBC2736.', description:'Wall Blind Cabinet 30" W x 36" H x 12" D', category:'Wall Cabinet', type:'[left/right]wallblindcornercabinet', door:'default', height:36, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.WBC2742.', description:'Wall Blind Cabinet 30" W x 42" H x 12" D', category:'Wall Cabinet', type:'[left/right]wallblindcornercabinet', door:'default', height:42, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.WBC3030.', description:'Wall Blind Cabinet 30" W x 30" H x 12" D', category:'Wall Cabinet', type:'[left/right]wallblindcornercabinet', door:'default', height:30, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.WBC3036.', description:'Wall Blind Cabinet 30" W x 36" H x 12" D', category:'Wall Cabinet', type:'[left/right]wallblindcornercabinet', door:'default', height:36, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.WBC3042.', description:'Wall Blind Cabinet 30" W x 42" H x 12" D', category:'Wall Cabinet', type:'[left/right]wallblindcornercabinet', door:'default', height:42, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.WBC3330.', description:'Wall Blind Cabinet 33" W x 30" H x 12" D', category:'Wall Cabinet', type:'[left/right]wallblindcornercabinet', door:'default', height:30, width:33, depth:12, base_height:54});
cab_def.push({sku:'8.WBC3336.', description:'Wall Blind Cabinet 33" W x 36" H x 12" D', category:'Wall Cabinet', type:'[left/right]wallblindcornercabinet', door:'default', height:36, width:33, depth:12, base_height:54});
cab_def.push({sku:'8.WBC3342.', description:'Wall Blind Cabinet 33" W x 42" H x 12" D', category:'Wall Cabinet', type:'[left/right]wallblindcornercabinet', door:'default', height:42, width:33, depth:12, base_height:54});
cab_def.push({sku:'8.WBC3630.', description:'Wall Blind Cabinet 39" W x 30" H x 12" D', category:'Wall Cabinet', type:'[left/right]wallblindcornercabinet', door:'default', height:30, width:39, depth:12, base_height:54});
cab_def.push({sku:'8.WBC3636.', description:'Wall Blind Cabinet 36" W x 36" H x 12" D', category:'Wall Cabinet', type:'[left/right]wallblindcornercabinet', door:'default', height:36, width:36, depth:12, base_height:54});
cab_def.push({sku:'8.WBC3642.', description:'Wall Blind Cabinet 36" W x 42" H x 12" D', category:'Wall Cabinet', type:'[left/right]wallblindcornercabinet', door:'default', height:42, width:36, depth:12, base_height:54});
cab_def.push({sku:'8.WBC3930.', description:'Wall Blind Cabinet 39" W x 30" H x 12" D', category:'Wall Cabinet', type:'[left/right]wallblindcornercabinet', door:'default', height:30, width:39, depth:12, base_height:54});
cab_def.push({sku:'8.WBC3936.', description:'Wall Blind Cabinet 39" W x 36" H x 12" D', category:'Wall Cabinet', type:'[left/right]wallblindcornercabinet', door:'default', height:36, width:39, depth:12, base_height:54});
cab_def.push({sku:'8.WBC3942.', description:'Wall Blind Cabinet 39" W x 42" H x 12" D', category:'Wall Cabinet', type:'[left/right]wallblindcornercabinet', door:'default', height:42, width:39, depth:12, base_height:54});
cab_def.push({sku:'8.WBC4230.', description:'Wall Blind Cabinet 42" W x 30" H x 12" D', category:'Wall Cabinet', type:'[left/right]wallblindcornercabinet', door:'default', height:30, width:42, depth:12, base_height:54});
cab_def.push({sku:'8.WBC4236.', description:'Wall Blind Cabinet 42" W x 36" H x 12" D', category:'Wall Cabinet', type:'[left/right]wallblindcornercabinet', door:'default', height:36, width:42, depth:12, base_height:54});
cab_def.push({sku:'8.WBC4242.', description:'Wall Blind Cabinet 42" W x 42" H x 12" D', category:'Wall Cabinet', type:'[left/right]wallblindcornercabinet', door:'default', height:42, width:42, depth:12, base_height:54});
cab_def.push({sku:'8.WD1818.', description:'Wall Cabinet 18" W x 18" H x 12" D', category:'Wall Cabinet', type:'x', door:'default', height:18, width:18, depth:12, base_height:54});
cab_def.push({sku:'8.WDC2418.', description:'Diagonal Corner Wall Cabinet 24" W x 18" H x 24" D', category:'Wall Cabinet', type:'diagcornerwallcabinet', door:'default', height:18, width:24, depth:24, base_height:54});
cab_def.push({sku:'8.WDC2430.', description:'Diagonal Corner Wall Cabinet 24" W x 30" H x 24" D', category:'Wall Cabinet', type:'diagcornerwallcabinet', door:'default', height:30, width:24, depth:24, base_height:54});
cab_def.push({sku:'8.WDC2430GD.', description:'Diagonal Corner Wall Cabinet 24" W x 30" H x 24" D', category:'Wall Cabinet', type:'diagcornerwallcabinet', door:'glass', height:30, width:24, depth:24, base_height:54});
cab_def.push({sku:'8.WDC2430MD.', description:'Diagonal Corner Wall Cabinet 24" W x 30" H x 24" D', category:'Wall Cabinet', type:'diagcornerwallcabinet', door:'mullion', height:30, width:24, depth:24, base_height:54});
cab_def.push({sku:'8.WDC2430ND.', description:'Diagonal Corner Wall Cabinet 24" W x 30" H x 24" D', category:'Wall Cabinet', type:'diagcornerwallcabinet', door:'none', height:30, width:24, depth:24, base_height:54});
cab_def.push({sku:'8.WDC2436.', description:'Diagonal Corner Wall Cabinet 24" W x 36" H x 24" D', category:'Wall Cabinet', type:'diagcornerwallcabinet', door:'default', height:36, width:24, depth:24, base_height:54});
cab_def.push({sku:'8.WDC2436GD.', description:'Diagonal Corner Wall Cabinet 24" W x 36" H x 24" D', category:'Wall Cabinet', type:'diagcornerwallcabinet', door:'glass', height:36, width:24, depth:24, base_height:54});
cab_def.push({sku:'8.WDC2436MD.', description:'Diagonal Corner Wall Cabinet 24" W x 36" H x 24" D', category:'Wall Cabinet', type:'diagcornerwallcabinet', door:'mullion', height:36, width:24, depth:24, base_height:54});
cab_def.push({sku:'8.WDC2436ND.', description:'Diagonal Corner Wall Cabinet 24" W x 36" H x 24" D', category:'Wall Cabinet', type:'diagcornerwallcabinet', door:'none', height:36, width:24, depth:24, base_height:54});
cab_def.push({sku:'8.WDC2442.', description:'Diagonal Corner Wall Cabinet 24" W x 42" H x 24" D', category:'Wall Cabinet', type:'diagcornerwallcabinet', door:'default', height:42, width:24, depth:24, base_height:54});
cab_def.push({sku:'8.WDC2442GD.', description:'Diagonal Corner Wall Cabinet 24" W x 42" H x 24" D', category:'Wall Cabinet', type:'diagcornerwallcabinet', door:'glass', height:42, width:24, depth:24, base_height:54});
cab_def.push({sku:'8.WDC2442MD.', description:'Diagonal Corner Wall Cabinet 24" W x 42" H x 24" D', category:'Wall Cabinet', type:'diagcornerwallcabinet', door:'mullion', height:42, width:24, depth:24, base_height:54});
cab_def.push({sku:'8.WDC2442ND.', description:'Diagonal Corner Wall Cabinet 24" W x 42" H x 24" D', category:'Wall Cabinet', type:'diagcornerwallcabinet', door:'none', height:42, width:24, depth:24, base_height:54});
cab_def.push({sku:'8.WDC2730.', description:'Diagonal Corner Wall Cabinet 27" W x 30" H x 27" D', category:'Wall Cabinet', type:'diagcornerwallcabinet', door:'default', height:30, width:27, depth:27, base_height:54});
cab_def.push({sku:'8.WDC2730ND.', description:'Diagonal Corner Wall Cabinet 27" W x 30" H x 27" D', category:'Wall Cabinet', type:'diagcornerwallcabinet', door:'none', height:30, width:27, depth:27, base_height:54});
cab_def.push({sku:'8.WDC2736.', description:'Diagonal Corner Wall Cabinet 27" W x 36" H x 27" D', category:'Wall Cabinet', type:'diagcornerwallcabinet', door:'default', height:36, width:27, depth:27, base_height:54});
cab_def.push({sku:'8.WDC273615.', description:'Diagonal Corner Wall Cabinet 27" W x 36" H x 27" D', category:'Wall Cabinet', type:'diagcornerwallcabinet', door:'default', height:36, width:27, depth:27, base_height:54});
cab_def.push({sku:'8.WDC2736GD.', description:'Diagonal Corner Wall Cabinet 27" W x 36" H x 27" D', category:'Wall Cabinet', type:'diagcornerwallcabinet', door:'glass', height:36, width:27, depth:27, base_height:54});
cab_def.push({sku:'8.WDC2736MD.', description:'Diagonal Corner Wall Cabinet 27" W x 36" H x 27" D', category:'Wall Cabinet', type:'diagcornerwallcabinet', door:'mullion', height:36, width:27, depth:27, base_height:54});
cab_def.push({sku:'8.WDC2736ND.', description:'Diagonal Corner Wall Cabinet 27" W x 36" H x 27" D', category:'Wall Cabinet', type:'diagcornerwallcabinet', door:'none', height:36, width:27, depth:27, base_height:54});
cab_def.push({sku:'8.WDC2742.', description:'Diagonal Corner Wall Cabinet 27" W x 42" H x 27" D', category:'Wall Cabinet', type:'diagcornerwallcabinet', door:'default', height:42, width:27, depth:27, base_height:54});
cab_def.push({sku:'8.WDC274215.', description:'Diagonal Corner Wall Cabinet 27" W x 42" H x 27" D', category:'Wall Cabinet', type:'diagcornerwallcabinet', door:'default', height:42, width:27, depth:27, base_height:54});
cab_def.push({sku:'8.WDC2742GD.', description:'Diagonal Corner Wall Cabinet 27" W x 42" H x 27" D', category:'Wall Cabinet', type:'diagcornerwallcabinet', door:'glass', height:42, width:27, depth:27, base_height:54});
cab_def.push({sku:'8.WDC2742MD.', description:'Diagonal Corner Wall Cabinet 27" W x 42" H x 27" D', category:'Wall Cabinet', type:'diagcornerwallcabinet', door:'mullion', height:42, width:27, depth:27, base_height:54});
cab_def.push({sku:'8.WDC2742ND.', description:'Diagonal Corner Wall Cabinet 27" W x 42" H x 27" D', category:'Wall Cabinet', type:'diagcornerwallcabinet', door:'none', height:42, width:27, depth:27, base_height:54});
cab_def.push({sku:'8.WDC2748.', description:'Diagonal Corner Wall Cabinet 27" W x 48" H x 27" D', category:'Wall Cabinet', type:'diagcornerwallcabinet', door:'default', height:48, width:27, depth:27, base_height:54});
cab_def.push({sku:'8.WDC2748ND.', description:'Diagonal Corner Wall Cabinet 27" W x 48" H x 27" D', category:'Wall Cabinet', type:'diagcornerwallcabinet', door:'none', height:48, width:27, depth:27, base_height:54});
cab_def.push({sku:'8.WEC1230.', description:'Diagonal Corner Wall Cabinet 12" W x 30" H x 12" D', category:'Wall Cabinet', type:'x', door:'default', height:30, width:12, depth:12, base_height:54});
cab_def.push({sku:'8.WEC1236.', description:'Diagonal Corner Wall Cabinet 12" W x 36" H x 12" D', category:'Wall Cabinet', type:'x', door:'default', height:36, width:12, depth:12, base_height:54});
cab_def.push({sku:'8.WEC1242.', description:'Diagonal Corner Wall Cabinet 12" W x 42" H x 12" D', category:'Wall Cabinet', type:'x', door:'default', height:42, width:12, depth:12, base_height:54});
cab_def.push({sku:'8.WECD1230.', description:'Diagonal Corner Wall Cabinet 12" W x 30" H x 12" D', category:'Wall Cabinet', type:'x', door:'default', height:30, width:12, depth:12, base_height:54});
cab_def.push({sku:'8.WECD1236.', description:'Diagonal Corner Wall Cabinet 12" W x 36" H x 12" D', category:'Wall Cabinet', type:'x', door:'default', height:36, width:12, depth:12, base_height:54});
cab_def.push({sku:'8.WECD1242.', description:'Diagonal Corner Wall Cabinet 12" W x 42" H x 12" D', category:'Wall Cabinet', type:'x', door:'default', height:42, width:12, depth:12, base_height:54});
cab_def.push({sku:'8.WEOS1242.', description:'Diagonal Corner Open Shelf 12" W x 42" H x 12" D', category:'Wall Cabinet', type:'wallshelf[/flip]', door:'default', height:42, width:12, depth:12, base_height:54});
cab_def.push({sku:'8.WEOS930.', description:'Diagonal Corner Open Shelf 9" W x 30" H x 12" D', category:'Wall Cabinet', type:'wallshelf[/flip]', door:'default', height:30, width:9, depth:12, base_height:54});
cab_def.push({sku:'8.WEOS936.', description:'Diagonal Corner Open Shelf 9" W x 36" H x 12" D', category:'Wall Cabinet', type:'wallshelf[/flip]', door:'default', height:36, width:9, depth:12, base_height:54});
cab_def.push({sku:'8.WH30.', description:'Range Hood 30" W x 24" H x 19" D', category:'Range Hood', type:'x', door:'default', height:24, width:30, depth:19, base_height:54});
cab_def.push({sku:'8.WH36.', description:'Range Hood 36" W x 24" H x 7.5" D', category:'Range Hood', type:'x', door:'default', height:24, width:36, depth:7.5, base_height:54});
cab_def.push({sku:'8.WHA30.', description:'Range Hood 30" W x 42" H x 20.75" D', category:'Range Hood', type:'x', door:'default', height:42, width:30, depth:20.75, base_height:54});
cab_def.push({sku:'8.WHA36.', description:'Range Hood 36" W x 42" H x 20.75" D', category:'Range Hood', type:'x', door:'default', height:42, width:36, depth:20.75, base_height:54});
cab_def.push({sku:'8.WHA42.', description:'Range Hood 42" W x 42" H x 20.75" D', category:'Range Hood', type:'x', door:'default', height:42, width:42, depth:20.75, base_height:54});
cab_def.push({sku:'8.WHA48.', description:'Range Hood 48" W x 42" H x 20.75" D', category:'Range Hood', type:'x', door:'default', height:42, width:48, depth:20.75, base_height:54});
cab_def.push({sku:'8.WHP30.', description:'Range Hood 30" W x 42" H x 20.75" D', category:'Range Hood', type:'x', door:'default', height:42, width:30, depth:20.75, base_height:54});
cab_def.push({sku:'8.WHP36.', description:'Range Hood 36" W x 42" H x 20.75" D', category:'Range Hood', type:'x', door:'default', height:42, width:36, depth:20.75, base_height:54});
cab_def.push({sku:'8.WHP42.', description:'Range Hood 42" W x 42" H x 20.75" D', category:'Range Hood', type:'x', door:'default', height:42, width:42, depth:20.75, base_height:54});
cab_def.push({sku:'8.WHP48.', description:'Range Hood 48" W x 42" H x 20.75" D', category:'Range Hood', type:'x', door:'default', height:42, width:48, depth:20.75, base_height:54});
cab_def.push({sku:'8.WHV30.', description:'Range Hood 30" W x 24" H x 20.75" D', category:'Range Hood', type:'x', door:'default', height:24, width:30, depth:20.75, base_height:54});
cab_def.push({sku:'8.WHV36.', description:'Range Hood 36" W x 24" H x 8" D', category:'Range Hood', type:'x', door:'default', height:24, width:36, depth:8, base_height:54});
cab_def.push({sku:'8.WMC3030.', description:'Microwave Wall Cabinet 30" W x 30" H x 12" D', category:'Microwave', type:'wallmicrowave', door:'default', height:30, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.WMC3036.', description:'Microwave Wall Cabinet 30" W x 36" H x 12" D', category:'Microwave', type:'wallmicrowave', door:'default', height:36, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.WMC3042.', description:'Microwave Wall Cabinet 30" W x 42" H x 12" D', category:'Microwave', type:'wallmicrowave', door:'default', height:42, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.WO306.', description:'Shelf 30" W x 6" H x 12" D', category:'Shelf', type:'wallshelf[/flip]', door:'default', height:30, width:6, depth:12, base_height:54});
cab_def.push({sku:'8.WO366.', description:'Shelf 36" W x 6" H x 12" D', category:'Shelf', type:'wallshelf[/flip]', door:'default', height:36, width:6, depth:12, base_height:54});
cab_def.push({sku:'8.WOE1230.', description:'Shelf 12" W x 30" H x 12" D', category:'Shelf', type:'wallshelf[/flip]', door:'default', height:30, width:12, depth:12, base_height:54});
cab_def.push({sku:'8.WOE1236.', description:'Shelf 12" W x 36" H x 12" D', category:'Shelf', type:'wallshelf[/flip]', door:'default', height:36, width:12, depth:12, base_height:54});
cab_def.push({sku:'8.WOE1242.', description:'Shelf 12" W x 42" H x 12" D', category:'Shelf', type:'wallshelf[/flip]', door:'default', height:42, width:12, depth:12, base_height:54});
cab_def.push({sku:'8.WOE630.', description:'Shelf 6" W x 30" H x 12" D', category:'Shelf', type:'wallshelf[/flip]', door:'default', height:30, width:6, depth:12, base_height:54});
cab_def.push({sku:'8.WOE636.', description:'Shelf 6" W x 36" H x 12" D', category:'Shelf', type:'wallshelf[/flip]', door:'default', height:36, width:6, depth:12, base_height:54});
cab_def.push({sku:'8.WOE642.', description:'Shelf 6" W x 42" H x 12" D', category:'Shelf', type:'wallshelf[/flip]', door:'default', height:42, width:6, depth:12, base_height:54});
cab_def.push({sku:'8.WOS1830.', description:'Shelf 18" W x 30" H x 12" D', category:'Shelf', type:'wallshelf[/flip]', door:'default', height:30, width:18, depth:12, base_height:54});
cab_def.push({sku:'8.WOS1836.', description:'Shelf 18" W x 36" H x 12" D', category:'Shelf', type:'wallshelf[/flip]', door:'default', height:36, width:18, depth:12, base_height:54});
cab_def.push({sku:'8.WOS1842.', description:'Shelf 18" W x 42" H x 12" D', category:'Shelf', type:'wallshelf[/flip]', door:'default', height:42, width:18, depth:12, base_height:54});
cab_def.push({sku:'8.WOS3030.', description:'Shelf 30" W x 30" H x 12" D', category:'Shelf', type:'wallshelf[/flip]', door:'default', height:30, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.WOS3036.', description:'Shelf 30" W x 36" H x 12" D', category:'Shelf', type:'wallshelf[/flip]', door:'default', height:36, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.WOS3042.', description:'Shelf 30" W x 42" H x 12" D', category:'Shelf', type:'wallshelf[/flip]', door:'default', height:42, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.WP1584.', description:'Pantry 15" W x 84" H x 24" D', category:'Pantry', type:'pantrycabinet', door:'default', height:84, width:15, depth:24, base_height:0});
cab_def.push({sku:'8.WP1590.', description:'Pantry 15" W x 90" H x 24" D', category:'Pantry', type:'pantrycabinet', door:'default', height:90, width:15, depth:24, base_height:0});
cab_def.push({sku:'8.WP1596.', description:'Pantry 15" W x 96" H x 24" D', category:'Pantry', type:'pantrycabinet', door:'default', height:96, width:15, depth:24, base_height:0});
cab_def.push({sku:'8.WP1836T.', description:'Pantry 18" W x 36" H x 24" D', category:'Pantry', type:'x', door:'default', height:36, width:18, depth:24, base_height:0});
cab_def.push({sku:'8.WP1842T.', description:'Pantry 18" W x 42" H x 24" D', category:'Pantry', type:'x', door:'default', height:42, width:18, depth:24, base_height:0});
cab_def.push({sku:'8.WP1854B.', description:'Pantry 18" W x 54" H x 24" D', category:'Pantry', type:'x', door:'default', height:54, width:18, depth:24, base_height:0});
cab_def.push({sku:'8.WP1884.', description:'Pantry 18" W x 84" H x 24" D', category:'Pantry', type:'pantrycabinet', door:'default', height:84, width:18, depth:24, base_height:0});
cab_def.push({sku:'8.WP1884RT.', description:'Pantry 18" W x 84" H x 24" D', category:'Pantry', type:'pantrycabinet', door:'default', height:84, width:18, depth:24, base_height:0});
cab_def.push({sku:'8.WP1890.', description:'Pantry 18" W x 90" H x 24" D', category:'Pantry', type:'pantrycabinet', door:'default', height:90, width:18, depth:24, base_height:0});
cab_def.push({sku:'8.WP1890RT.', description:'Pantry 18" W x 90" H x 24" D', category:'Pantry', type:'pantrycabinet', door:'default', height:90, width:18, depth:24, base_height:0});
cab_def.push({sku:'8.WP1896.', description:'Pantry 18" W x 96" H x 24" D', category:'Pantry', type:'pantrycabinet', door:'default', height:96, width:18, depth:24, base_height:0});
cab_def.push({sku:'8.WP1896RT.', description:'Pantry 18" W x 96" H x 24" D', category:'Pantry', type:'pantrycabinet', door:'default', height:96, width:18, depth:24, base_height:0});
cab_def.push({sku:'8.WP2484.', description:'Pantry 24" W x 84" H x 24" D', category:'Pantry', type:'pantrycabinet', door:'default', height:84, width:24, depth:24, base_height:0});
cab_def.push({sku:'8.WP248412.', description:'Pantry 24" W x 84" H x 12" D', category:'Pantry', type:'pantrycabinet', door:'default', height:84, width:24, depth:12, base_height:0});
cab_def.push({sku:'8.WP2484B.', description:'Pantry 24" W x 84" H x 24" D', category:'Pantry', type:'pantrycabinet', door:'default', height:84, width:24, depth:24, base_height:0});
cab_def.push({sku:'8.WP2484RT.', description:'Pantry 24" W x 84" H x 24" D', category:'Pantry', type:'pantrycabinet', door:'default', height:84, width:24, depth:24, base_height:0});
cab_def.push({sku:'8.WP2490.', description:'Pantry 24" W x 90" H x 24" D', category:'Pantry', type:'pantrycabinet', door:'default', height:90, width:24, depth:24, base_height:0});
cab_def.push({sku:'8.WP249012.', description:'Pantry 24" W x 90" H x 12" D', category:'Pantry', type:'pantrycabinet', door:'default', height:90, width:24, depth:12, base_height:0});
cab_def.push({sku:'8.WP2490B.', description:'Pantry 24" W x 90" H x 24" D', category:'Pantry', type:'pantrycabinet', door:'default', height:90, width:24, depth:24, base_height:0});
cab_def.push({sku:'8.WP2490RT.', description:'Pantry 24" W x 90" H x 24" D', category:'Pantry', type:'pantrycabinet', door:'default', height:90, width:24, depth:24, base_height:0});
cab_def.push({sku:'8.WP2496.', description:'Pantry 24" W x 96" H x 24" D', category:'Pantry', type:'pantrycabinet', door:'default', height:96, width:24, depth:24, base_height:0});
cab_def.push({sku:'8.WP249612.', description:'Pantry 24" W x 96" H x 12" D', category:'Pantry', type:'pantrycabinet', door:'default', height:96, width:24, depth:12, base_height:0});
cab_def.push({sku:'8.WP2496B.', description:'Pantry 24" W x 96" H x 24" D', category:'Pantry', type:'pantrycabinet', door:'default', height:96, width:24, depth:24, base_height:0});
cab_def.push({sku:'8.WP2496RT.', description:'Pantry 24" W x 96" H x 24" D', category:'Pantry', type:'pantrycabinet', door:'default', height:96, width:24, depth:24, base_height:0});
cab_def.push({sku:'8.WP3084.', description:'Pantry 30" W x 84" H x 24" D', category:'Pantry', type:'pantrycabinet', door:'default', height:84, width:30, depth:24, base_height:0});
cab_def.push({sku:'8.WP3090.', description:'Pantry 30" W x 90" H x 24" D', category:'Pantry', type:'pantrycabinet', door:'default', height:90, width:30, depth:24, base_height:0});
cab_def.push({sku:'8.WP3096.', description:'Pantry 30" W x 96" H x 24" D', category:'Pantry', type:'pantrycabinet', door:'default', height:96, width:30, depth:24, base_height:0});
cab_def.push({sku:'8.WPC2430.', description:'Wall Square Corner 24" W x 30" H x 24" D', category:'Wall Square Corner', type:'x', door:'default', height:30, width:24, depth:24, base_height:54});
cab_def.push({sku:'8.WPC2436.', description:'Wall Square Corner 24" W x 36" H x 24" D', category:'Wall Square Corner', type:'x', door:'default', height:36, width:24, depth:24, base_height:54});
cab_def.push({sku:'8.WPC2442.', description:'Wall Square Corner 24" W x 42" H x 24" D', category:'Wall Square Corner', type:'x', door:'default', height:42, width:24, depth:24, base_height:54});
cab_def.push({sku:'8.WR3015.', description:'Wine Rack 30" W x 15" H x 12" D', category:'Wine Rack', type:'winerack[/vertical]', door:'default', height:15, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.WR3018.', description:'Wine Rack 30" W x 18" H x 12" D', category:'Wine Rack', type:'winerack[/vertical]', door:'default', height:18, width:30, depth:12, base_height:54});
cab_def.push({sku:'8.WR3612.', description:'Wine Rack 36" W x 12" H x 12" D', category:'Wine Rack', type:'winerack[/vertical]', door:'default', height:12, width:36, depth:12, base_height:54});
cab_def.push({sku:'8.WR3615.', description:'Wine Rack 36" W x 15" H x 12" D', category:'Wine Rack', type:'winerack[/vertical]', door:'default', height:15, width:36, depth:12, base_height:54});
cab_def.push({sku:'8.WR3618.', description:'Wine Rack 36" W x 18" H x 12" D', category:'Wine Rack', type:'winerack[/vertical]', door:'default', height:18, width:36, depth:12, base_height:54});
cab_def.push({sku:'8.WS30.', description:'Shelf 6" W x 30" H x 12" D', category:'Shelf', type:'wallshelf', door:'default', height:30, width:6, depth:12, base_height:54});
cab_def.push({sku:'8.WS30L.', description:'Shelf 6" W x 30" H x 12" D', category:'Shelf', type:'wallshelf', door:'default', height:30, width:6, depth:12, base_height:54});
cab_def.push({sku:'8.WS30R.', description:'Shelf 6" W x 30" H x 12" D', category:'Shelf', type:'wallshelfflip', door:'default', height:30, width:6, depth:12, base_height:54});
cab_def.push({sku:'8.WS36.', description:'Shelf 6" W x 36" H x 12" D', category:'Shelf', type:'wallshelf', door:'default', height:36, width:6, depth:12, base_height:54});
cab_def.push({sku:'8.WS36L.', description:'Shelf 6" W x 36" H x 12" D', category:'Shelf', type:'wallshelf', door:'default', height:36, width:6, depth:12, base_height:54});
cab_def.push({sku:'8.WS36R.', description:'Shelf 6" W x 36" H x 12" D', category:'Shelf', type:'wallshelfflip', door:'default', height:36, width:6, depth:12, base_height:54});
cab_def.push({sku:'8.WS42.', description:'Shelf 6" W x 42" H x 12" D', category:'Shelf', type:'wallshelf', door:'default', height:42, width:6, depth:12, base_height:54});
cab_def.push({sku:'8.WS42L.', description:'Shelf 6" W x 42" H x 12" D', category:'Shelf', type:'wallshelf', door:'default', height:42, width:6, depth:12, base_height:54});
cab_def.push({sku:'8.WS42R.', description:'Shelf 6" W x 42" H x 12" D', category:'Shelf', type:'wallshelfflip', door:'default', height:42, width:6, depth:12, base_height:54});
cab_def.push({sku:'8.FS330.', description:'Wall Filler 3" W x 30" L', category:'Filler', type:'filler', door:'default', height:30, width:3, depth:0.75, base_height:54});
cab_def.push({sku:'8.FS630.', description:'Wall Filler 6" W x 30" L', category:'Filler', type:'filler', door:'default', height:30, width:6, depth:0.75, base_height:54});
cab_def.push({sku:'8.FS384.', description:'Tall Filler 3" W x 84" L', category:'Filler', type:'filler', door:'default', height:84, width:3, depth:0.75, base_height:0});
cab_def.push({sku:'8.FS696.', description:'Tall Filler 6" W x 96" L', category:'Filler', type:'filler', door:'default', height:96, width:6, depth:0.75, base_height:0});
cab_def.push({sku:'8.FS330F.', description:'Fluted Filler 3" W x 30" L', category:'Filler', type:'filler', door:'default', height:30, width:3, depth:0.75, base_height:54});
cab_def.push({sku:'8.FS336F.', description:'Fluted Filler 3" W x 36" L', category:'Filler', type:'filler', door:'default', height:36, width:3, depth:0.75, base_height:54});
cab_def.push({sku:'8.FS342.', description:'Wall Filler 3" W x 42" L', category:'Filler', type:'filler', door:'default', height:42, width:3, depth:0.75, base_height:54});
cab_def.push({sku:'8.FS342F.', description:'Fluted Filler 3" W x 42" L', category:'Filler', type:'filler', door:'default', height:42, width:3, depth:0.75, base_height:54});

