/*********************
/ Global declarations
/********************/
var MAP;
var LAT = -19.11;
var LNG = 46.702;
var INITZOOM = 6;

// resize window to 100% height
$(window).resize(function(){ 
    resizeMap(); 
})

/*******************************
/ Functions called on doc ready
/******************************/
$(document).ready(function(){
	initMap();
})

/*******************************
/ Init functions
/******************************/
function initMap() {
	// init basemaps
	var streets = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	    maxZoom: 18
	});
	var satellite = new L.Google();

	// init forest cover layer
    var url = 'http://104.236.18.180:8080/geoserver/data/wms';
	var forest2000 = L.tileLayer.wms(url,{
	    layers: 'fick',
	    format: 'image/png',
	    transparent: true,    
	    opacity: 0.7       
	});

	// set up the map and remove the default zoomControl
	MAP = L.map('map', {
	    zoomControl: false,
		layers: [streets, forest2000]	
	});

	// add the custom zoom home control, defined below
	new L.Control.zoomHome().addTo(MAP);

	// set the initial view, and resize the map
	zoomHome();
	resizeMap();

	// set up layer control
	var baseMaps = {
	    "Streets": streets,
	    "Satellite": satellite
	};
	var overlayMaps = {
	    "Forest 2000": forest2000
	};
	L.control.layers(baseMaps, overlayMaps).addTo(MAP);
}

/*******************************
/ Named functions
/******************************/
function resizeMap() {
    var w = $(window).width();
    var h = $(window).height();
    $('#map').width(w).height(h);
    MAP.invalidateSize();
}

function zoomHome() {
    MAP.setView([LAT, LNG], INITZOOM);
}


/*******************************
/ Leaflet extensions
/******************************/
// custom zoom bar control that includes a Zoom Home function
L.Control.zoomHome = L.Control.extend({
    options: {
        position: 'topleft',
        zoomInText: '+',
        zoomInTitle: 'Zoom in',
        zoomOutText: '-',
        zoomOutTitle: 'Zoom out',
        zoomHomeText: '<i class="fa fa-home" style="line-height:1.65;"></i>',
        zoomHomeTitle: 'Zoom home'
    },

    onAdd: function (map) {
        var controlName = 'gin-control-zoom',
            container = L.DomUtil.create('div', controlName + ' leaflet-bar'),
            options = this.options;

        this._zoomInButton = this._createButton(options.zoomInText, options.zoomInTitle,
        controlName + '-in', container, this._zoomIn);
        this._zoomHomeButton = this._createButton(options.zoomHomeText, options.zoomHomeTitle,
        controlName + '-home', container, this._zoomHome);
        this._zoomOutButton = this._createButton(options.zoomOutText, options.zoomOutTitle,
        controlName + '-out', container, this._zoomOut);

        this._updateDisabled();
        map.on('zoomend zoomlevelschange', this._updateDisabled, this);

        return container;
    },

    onRemove: function (map) {
        map.off('zoomend zoomlevelschange', this._updateDisabled, this);
    },

    _zoomIn: function (e) {
        this._map.zoomIn(e.shiftKey ? 3 : 1);
    },

    _zoomOut: function (e) {
        this._map.zoomOut(e.shiftKey ? 3 : 1);
    },

    _zoomHome: function (e) {
        // debugger;
        zoomHome();
    },

    _createButton: function (html, title, className, container, fn) {
        var link = L.DomUtil.create('a', className, container);
        link.innerHTML = html;
        link.href = '#';
        link.title = title;

        L.DomEvent.on(link, 'mousedown dblclick', L.DomEvent.stopPropagation)
            .on(link, 'click', L.DomEvent.stop)
            .on(link, 'click', fn, this)
            .on(link, 'click', this._refocusOnMap, this);

        return link;
    },

    _updateDisabled: function () {
        var map = this._map,
            className = 'leaflet-disabled';

        L.DomUtil.removeClass(this._zoomInButton, className);
        L.DomUtil.removeClass(this._zoomOutButton, className);

        if (map._zoom === map.getMinZoom()) {
            L.DomUtil.addClass(this._zoomOutButton, className);
        }
        if (map._zoom === map.getMaxZoom()) {
            L.DomUtil.addClass(this._zoomInButton, className);
        }
    }
});


// });


