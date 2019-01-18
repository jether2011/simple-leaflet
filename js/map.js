var map;
var latitude = -55.685277;
var longitude = -10.3;

$( document ).ready(function() {
	initMap();
});

function initMap() {
	map = L.map('map', {
        scrollWheelZoom: true,
        fullscreenControl: {
            pseudoFullscreen: false
        },
    }).setView([longitude, latitude], 5);
	
	var openStreetMapBlackAndWhite = L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,        
        minZoom: 4
    });

    var googleSat = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
        maxZoom: 20,
        subdomains:['mt0','mt1','mt2','mt3']
    });

    var googleHybrid = L.tileLayer('http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',{
        maxZoom: 20,
        subdomains:['mt0','mt1','mt2','mt3']
    });

    var googleStreets = L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',{
        maxZoom: 20,
        subdomains:['mt0','mt1','mt2','mt3']
    });

    var googleTerrain = L.tileLayer('http://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',{
        maxZoom: 20,
        subdomains:['mt0','mt1','mt2','mt3']
    });

    var OpenTopoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: 'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    });

    var baseLayers = {
        'OSM-Black' : openStreetMapBlackAndWhite,
        'Google-Satellite' : googleSat,
        'Google-Hybrid' : googleHybrid,
        'Google-Streets' : googleStreets,
        'Google-Terrain' : googleTerrain,
        'OpenTopoMap' : OpenTopoMap
    }    
    baseLayers['OSM-Black'].addTo(this.map);
    
    var options = {
        sortLayers : true,
        collapsed : false
    }
    
    var forest = L.tileLayer.wms("http://terrabrasilis.dpi.inpe.br/geoserver/gwc/service/wms", {
        layers: 'prodes-amz:forest',
        format: 'image/png',
        transparent: true,
        tiled: true
    });   
    var overlayers = {
        'Forest 2016/2017': forest
    }
    overlayers['Forest 2016/2017'].addTo(this.map);

    L.control.layers(baseLayers, overlayers, options).addTo(map);

    L.control.scale().addTo(map);
}