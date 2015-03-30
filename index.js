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
    initLayerpicker();
    initState();
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


	// set up the map and remove the default zoomControl
	MAP = L.map('map', {
	    zoomControl: false,
        // layers: [streets, forest2000]   
		layers: [streets]	
	});

    // init wms layers
    var url = 'http://128.199.43.143:8080/geoserver/pyramids/wms';
    var format = 'image/png';
    var version = '1.1.0';
    MAP.overlays = {};
    MAP.overlays['forest1990']     = L.tileLayer.wms(url, { layers: 'pyramids:for1990fix', version:version, format: format, transparent: true, opacity:1});
    MAP.overlays['forest2000']     = L.tileLayer.wms(url, { layers: 'pyramids:for2000fix', version:version, format: format, transparent: true, opacity:1});
    MAP.overlays['forest2010']     = L.tileLayer.wms(url, { layers: 'pyramids:for2010fix', version:version, format: format, transparent: true, opacity:1});
    MAP.overlays['carbon']         = L.tileLayer.wms(url, { layers: 'carbon', format: format, transparency: true, opacity:1});

	// add the custom zoom home control, defined below
	new L.Control.zoomHome().addTo(MAP);



	// set up layer control
	// var baseMaps = {
	//     "Streets": streets,
	//     "Satellite": satellite
	// };
	// var overlayMaps = {
	//     // "Forest 2000": forest2000
	// };
	// L.control.layers(baseMaps, overlayMaps).addTo(MAP);
}

function initState() {
    // all set, go
    // set the initial view, and resize the map
    zoomHome();
    // trigger overlays
    $('#map input[name="overlays"]').removeAttr('checked','checked').trigger('change');
    $('#map div[data-overlay="forest2010"] input[name="overlays"]').prop('checked','checked').trigger('change');
    
    resizeMap();
}

function initLayerpicker() {
    //
    // non-control map controls (layerpicker)
    //
    // first off, a stop-propagation on the layerpicker DIVs
    // so clicks and drags on themj do not propagate downward and onto the map
    $('div#layerpicker').each(function () {
        L.DomEvent.on(this,'mousedown',L.DomEvent.stop);
        // L.DomEvent.on(this,'touchstart',L.DomEvent.stop);
    });

    // map layer controls: layer visibility checkboxes
    // these toggle the map layer but of course the UI elements for the layer such as the opacity sliders, legend swatches, basically every DIV that's a sibling of the checkbox's LABEL element
    $('div#layerpicker input[name="overlays"]').change(function () {
        var which   = $(this).closest('div[data-overlay]').attr('data-overlay');
        var layer   = MAP.overlays[which];
        var divs    = $(this).closest('label').siblings().not('span.glyphicon');
        var viz     = $(this).is(':checked');

        if (viz) {
            MAP.addLayer(layer);
            divs.show();
        } else {
            MAP.removeLayer(layer);
            divs.hide();
        }
    });

    // map layer controls: opacity sliders, possible legends, etc.
    // again with magical self-configuring behavior: the DIV's data-overlay specifies the layer name, the div.map has the map loaded into it, data-default specifies starting value, ...
    $('div#layerpicker div.opacity_slider').each(function () {
        // get the magical default
        var value = $(this).attr('data-default');

        // set up the slider, preset to this value
        // tip: this is applied in initState() since the sliders could hypothetically be modified by loaded state
        // tip: do not use the 'stop' event since it cannot be triggered programatically; use 'change' instead
        $(this).slider({
            min:0, max:100, value:value, range:'min',
            change: function (event,ui) {
                var which   = $(this).closest('div[data-overlay]').attr('data-overlay');
                var opacity = 0.01 * ui.value;
                var layer   = MAP.overlays[which];
                layer.setOpacity(opacity);
            }
        });
    });

    // and stop propagation on sliders
    $('div#layerpicker').each(function () {
        // L.DomEvent.on(this,'mousedown',L.DomEvent.stop);
        L.DomEvent.on(this,'touchstart',L.DomEvent.stop);
        L.DomEvent.on(this,'touchmove',L.DomEvent.stop);
        L.DomEvent.on(this,'touchend',L.DomEvent.stop);
    });

    // close layerpicker on click 'x'
    $('div#layerpicker button.close').on('click', function(){
        $(this).parent().hide();
    })

    // open layerpicker on click layer-opener
    $('div#layer-opener').on('click', function(){
        $(this).next('.layerpicker').show();
    })


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


