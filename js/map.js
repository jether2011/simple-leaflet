var map;
var latitude = -55.685277;
var longitude = -10.3;
var host_api = "http://terrabrasilis.dpi.inpe.br/business/api/v1";

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
        let baselayers = new Array();
        let overlayers = new Array();

        data.forEach(e => {
            e.vision.layers.forEach(l => {
                if(l.baselayer)
                    baselayers.push(l);
                else
                    overlayers.push(l);
            });

            e.visions.forEach(e => {
                e.layers.forEach(l => {
                    if(l.baselayer)
                        baselayers.push(l);
                    else
                        overlayers.push(l);
                });                
            });
        });

        baselayers.forEach(l => {
            let domains = new Array();
            l.subdomains.forEach(s => {
                domains.push(s.name);
            });

            baseLayers[l.title] = L.tileLayer(l.datasource.host, {
                maxZoom: 20,                
                attribution: l.attribution,
                subdomains: domains
            });
            
            if (l.active)
                baseLayers[l.title].addTo(map);          
        });
        baseLayers['Empty'] = L.tileLayer(''); 

        overlayers.forEach(l => {
            let url = l.datasource.host.replace("ows", "gwc/service/wms");

            overLayers[l.title] = L.tileLayer.wms(url, {
                layers: l.workspace + ':' + l.name,
                format: 'image/png',
                transparent: true,
                tiled: true
            });

            if (l.active)
                overLayers[l.title].addTo(map); 
        });

        loadMapControllers();
    });
} 

function loadMapControllers() {
    var options = {
        sortLayers : true,
        collapsed : true
    }
    
    /**
     * Add Baselayers and Overlayers to map
     */
    L.control.layers(baseLayers, overLayers, options).addTo(map);

    /**
     * Scale tool
     */
    L.control.scale().addTo(map);

    /**
     * Stop the animation
     */
    $('body').loading('stop');
}