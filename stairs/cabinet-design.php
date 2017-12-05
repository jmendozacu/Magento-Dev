<!DOCTYPE html><html><head><title>Cabinet Design Layout Tool</title><meta charset="utf-8"><style type="text/css">	#roundbar-grey {		clear:left;		float:left;		width:100%;		background:#B7B7B7 url(roundbar-grey.gif) 0 25% repeat;		font-family:Trebuchet MS, Helvetica, sans-serif;		border-bottom:1px solid #A8A8A8;		overflow:hidden;	}	#roundbar-grey ul {		clear:left;		float:left;		list-style:none;		margin:0;		padding:0;		position:relative;		left:50%;		text-align:center;	}	#roundbar-grey ul li {		display:block;		float:left;		list-style:none;		margin:0;		padding:0;		position:relative;		right:50%;	}	#roundbar-grey ul li.first {		border-left:1px solid #A8A8A8;	}	#roundbar-grey ul li.last {		border-right:1px solid #C8C8C8;	}	#roundbar-grey ul li a {		display:block;		margin:0;		padding:.4em .8em;		color:#000;		text-decoration:none;		border-left:1px solid #C8C8C8;		border-right:1px solid #A8A8A8;		line-height:1.3em;	}	#roundbar-grey ul li a span {		display:block;	}	#roundbar-grey ul li.active a {		background:url(roundbar-grey.gif) 0 75% repeat;		font-weight:bold;	}	#roundbar-grey ul li a:hover {		background:url(roundbar-grey.gif) 0 75% repeat;	}</style>
</head><body><?php 	require_once('../app/Mage.php');	umask(0);	Mage::app();?>
<div id="roundbar-grey">	<ul>		<li class="first"><a href="www.cshardware.com">Home</a></li>		<li class="active"><a href="#">Designer</a></li>		<li><a href="#">Help</a></li>		<li class="last"><a href="#">Contact Us</a></li>	</ul></div>

<div id="container" style="min-height:640px;width=720px;border:1px solid #aaa;"></div>Controls: Left mouse button to orbit, Right mouse button to pan, Middle mouse button to zoom.
<br><script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>	<script type="text/javascript" src="papaparse.min.js"></script>	<script type="text/javascript" src="three.min.js"></script>	<script type="text/javascript" src="cabinet-designer.js"></script>	<script type="text/javascript" src="orbitcontrols.js"></script>	<script type="text/javascript" src="UVsUtils.js"></script>	<script type="text/javascript" src="detector.js"></script>	<script type="text/javascript" src="ThreeCSG.js"></script>	<script src="jquery.mousewheel.min.js" type="text/javascript"></script>	<script src="underscore-min.js" type="text/javascript"></script>	<script src="raphael-min.js" type="text/javascript"></script>	<script src="raphael-zp.js" type="text/javascript"></script>	<script src="raphael.free_transform.min.js" type="text/javascript"></script>
<script type="text/javascript">	Papa.parse("http://www.cshardware.com/data/product.csv",		{ download: true,			header: true,			worker: true,			dynamicTyping: true,			/* This is where we capture data for cabinet products */			complete: function(results, parser) { console.log("Parsing complete:", results); }		});	</script><!--
<a href="javascript:(function(){var%20script=document.createElement('script');script.type='text/javascript';script.src='https://github.com/zz85/zz85-bookmarklets/raw/master/js/ThreeInspector.js';document.body.appendChild(script);})()">Three.js Inspector</a>--></body>
</html>