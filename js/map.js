var map;
var latitude = -55.685277;
var longitude = -10.3;
var host_api = "http://terrabrasilis2.dpi.inpe.br:13003/api/v1";

let baseLayers = {};
let overLayers = {};

$( document ).ready(function() {
    $("body").loading();

    loadMapOnly();	
});

function loadMapOnly() {
    map = L.map('map', {
        scrollWheelZoom: true,
        fullscreenControl: {
            pseudoFullscreen: false
        },
    }).setView([longitude, latitude], 5);

    loadBaseLayers();
}

function loadBaseLayers() {
    let api = this.host_api + "/vision/name/desforestation/all";
    $.ajax({
        url: api,
        async: true,        
    }).done(function (data) { 
        let layers = new Array();

        data.forEach(e => {
            e.vision.layers.forEach(l => {
                if(l.baselayer)
                    layers.push(l);
            });

            e.visions.forEach(e => {
                e.layers.forEach(l => {
                    if(l.baselayer)
                        layers.push(l);
                });                
            });
        });

        // console.log(layers);

        layers.forEach(l => {
            let domains = new Array();
            l.subdomains.forEach(s => {
                domains.push(s.name);
            });

            let name = l.title;
            let layer = L.tileLayer(l.datasource.host, {
                maxZoom: 20,                
                attribution: l.attribution,
                subdomains: domains
            });

            if (l.active)
                map.addLayer(layer);

            // console.log(name);
            // console.log(layer);
            baseLayers[name] = layer;            
        });

        baseLayers['Empty'] = L.tileLayer(''); 
        //console.log(baseLayers);
        loadMapControllers();
    });
} 

function loadMapControllers() {
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

    /**
     * Stop the animation
     */
    $('body').loading('stop');
}