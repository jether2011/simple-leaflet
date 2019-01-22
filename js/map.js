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
    baseLayers['Google-Satellite'].addTo(this.map);
    
    var options = {
        sortLayers : true,
        collapsed : true
    }
    
    let layers = ["yearly_deforestation_2013_2018", "accumulated_deforestation_1988_2012", "hydrography", "no_forest", "cloud", "brazilian_legal_amazon"
        , "estados", "prodes_cerrado_2000_2017_uf_mun", "limite_cerrado", "municipios_2017", "cerrado_mosaics"];
    
    let host = "http://terrabrasilis.dpi.inpe.br/geoserver/gwc/service/wms";    
    let amz_workspace = "prodes-amz";
    let cerrado_workspace = "prodes-cerrado";
    
    /**
     * Prodes AMZ
     */
    var forest = L.tileLayer.wms(host, {
        layers: amz_workspace + ':forest',
        format: 'image/png',
        transparent: true,
        tiled: true
    }); 
    
    var yearly_deforestation_2013_2018 = L.tileLayer.wms(host, {
        layers: amz_workspace + ':' + layers[0],
        format: 'image/png',
        transparent: true,
        tiled: true
    });

    var accumulated_deforestation_1988_2012 = L.tileLayer.wms(host, {
        layers: amz_workspace + ':' + layers[1],
        format: 'image/png',
        transparent: true,
        tiled: true
    });

    var hydrography = L.tileLayer.wms(host, {
        layers: amz_workspace + ':' + layers[2],
        format: 'image/png',
        transparent: true,
        tiled: true
    });

    var no_forest = L.tileLayer.wms(host, {
        layers: amz_workspace + ':' + layers[3],
        format: 'image/png',
        transparent: true,
        tiled: true
    });

    var cloud = L.tileLayer.wms(host, {
        layers: amz_workspace + ':' + layers[4],
        format: 'image/png',
        transparent: true,
        tiled: true
    });

    var brazilian_legal_amazon = L.tileLayer.wms(host, {
        layers: amz_workspace + ':' + layers[5],
        format: 'image/png',
        transparent: true,
        tiled: true
    });

    /**
     * Prodes Cerrado
     */
    var estados = L.tileLayer.wms(host, {
        layers: cerrado_workspace + ':' + layers[6],
        format: 'image/png',
        transparent: true,
        tiled: true
    });

    var prodes_cerrado_2000_2017_uf_mun = L.tileLayer.wms(host, {
        layers: cerrado_workspace + ':' + layers[7],
        format: 'image/png',
        transparent: true,
        tiled: true
    });

    var limite_cerrado = L.tileLayer.wms(host, {
        layers: cerrado_workspace + ':' + layers[8],
        format: 'image/png',
        transparent: true,
        tiled: true
    });

    var municipios_2017 = L.tileLayer.wms(host, {
        layers: cerrado_workspace + ':' + layers[9],
        format: 'image/png',
        transparent: true,
        tiled: true
    });

    var cerrado_mosaics = L.tileLayer.wms(host, {
        layers: cerrado_workspace + ':' + layers[10],
        format: 'image/png',
        transparent: true,
        tiled: true
    });

    /**
     * Bacia Miranda
     */    
    var miranda_mapeamento = L.tileLayer.wms(host, {
        layers: 'miranda:mapeamento',
        format: 'image/png',
        transparent: true,
        tiled: true
    });

    /**
     * Overlayers
     */
    var overlayers = {
        // AMZ
        'Forest 2016/2017': forest,
        'AMZ Yearly Deforestation': yearly_deforestation_2013_2018,
        'Deforestation Mask': accumulated_deforestation_1988_2012,
        'Hydrography': hydrography,
        'No Forest': no_forest,
        'Cloud': cloud,
        'Legal Amazon': brazilian_legal_amazon,

        // Cerrado
        'States': estados,
        'Cerrado Yearly Deforestation': prodes_cerrado_2000_2017_uf_mun,
        'Biome Border': limite_cerrado,
        'Counties': municipios_2017, 
        'Cerrado Mosaics': cerrado_mosaics,

        // Bacia Miranda
        'Mapeamento Miranda': miranda_mapeamento
    }

    // overlayers['AMZ Yearly Deforestation'].addTo(this.map);
    // overlayers['Deforestation Mask'].addTo(this.map);
    // overlayers['Forest 2016/2017'].addTo(this.map);
    // overlayers['Cerrado Yearly Deforestation'].addTo(this.map);
    // overlayers['Biome Border'].addTo(this.map);
    
    for (const key in overlayers) {     
        if ('Cerrado Mosaics' === key) continue;   
        overlayers[key].addTo(this.map);        
    }

    /**
     * Add Baselayers and Overlayers to map
     */
    L.control.layers(baseLayers, overlayers, options).addTo(map);

    /**
     * Scale tool
     */
    L.control.scale().addTo(map);
}