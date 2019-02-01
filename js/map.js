var map;
var latitude = -55.685277;
var longitude = -10.3;
var host_api = "http://terrabrasilis2.dpi.inpe.br:13003/api/v1";

let baseLayers = {};
let overLayers = {};

// to control the enable or disable TimeDimension component
let ctrlTimer={control:null,layer:null};

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
        timeDimension: true
    }).setView([longitude, latitude], 5);
    map.on('overlayremove', onRemoveOverlay);
    //map.on('overlayadd', onAddOverlay);

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

            // Create and insert a new overlayer with temporal dimension enabled to test
            var lJson="{'id':'5c49f5901a21020001cd6637','name':'temporal_mosaic','title':'LANDSAT 2000/2018','description':'LANDSAT 2000/2018',"+
            "'attribution':'','workspace':'prodes-cerrado','capabilitiesUrl':'REQUEST=GetCapabilities&VERSION=1.3.0&SERVICE=wms','stackOrder':1,"+
            "'opacity':1,'baselayer':false,'active':false,'enabled':true,'created':'2019-01-24 17:27:43','datasource':{'id':'5c409e920e9b2a0b8424ef1b',"+
            "'name':'Prodes Cerrado','description':'Prodes Cerrado','host':'http://terrabrasilis.dpi.inpe.br/geoserver/ows','metadata':'','enabled':true,"+
            "'created':'2019-01-17 15:26:10','downloads':[],'tools':[]},'tools':[],'subdomains':[]}";
            var tdLayer=JSON.parse(lJson.replace(/'/g,'"'));
            overlayers.push(tdLayer);

            lJson="{'id':'5c49f5901a21020001cd6666','name':'prodes_cerrado_2000_2018_uf_mun','title':'Cerrado Yearly Deforestation - 2000/2018','description':'Cerrado Yearly Deforestation - 2000/2018',"+
            "'attribution':'','workspace':'prodes-cerrado','capabilitiesUrl':'REQUEST=GetCapabilities&VERSION=1.3.0&SERVICE=wms','stackOrder':2,"+
            "'opacity':1,'baselayer':false,'active':true,'enabled':true,'created':'2019-01-24 17:27:43','datasource':{'id':'5c409e920e9b2a0b8424eeeb',"+
            "'name':'Prodes Cerrado','description':'Prodes Cerrado','host':'http://terrabrasilis.dpi.inpe.br/geoserver/ows','metadata':'','enabled':true,"+
            "'created':'2019-01-17 15:26:10','downloads':[],'tools':[]},'tools':[],'subdomains':[]}";
            tdLayer=JSON.parse(lJson.replace(/'/g,'"'));
            overlayers.push(tdLayer);

            e.visions.forEach(e => {
                e.layers.forEach(l => {
                    l.active=false;
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

            //let url = (l.capabilitiesUrl && l.capabilitiesUrl!="")?(l.datasource.host):(l.datasource.host.replace("ows", "gwc/service/wms"));
            let url = l.datasource.host.replace("ows", "gwc/service/wms");

            var leafletLayer = L.tileLayer.wms(url, {
                layers: l.workspace + ':' + l.name,
                format: 'image/png',
                transparent: true,
                tiled: true,
                attribution: 'INPE/OBT/DPI/TerraBrasilis'
            });

            if(l.capabilitiesUrl && l.capabilitiesUrl!="") {
                var tdOptions={
                    requestTimeFromCapabilities: true,
                    getCapabilitiesUrl: l.datasource.host.replace("ows", l.workspace + "/" + l.name+"/ows"),
                    setDefaultTime: true,
                    getCapabilitiesLayerName: l.name,
                    wmsVersion: "1.3.0"
                    // getCapabilitiesParams: {
                    //     updateSequence:1
                    // }
                };
                overLayers[l.title] = L.timeDimension.layer.wms(leafletLayer,tdOptions);
                // If any layer have a Time Dimension so we add the timedimension component to the map
                // L.TimeDimension().addTo(map);
            }else{
                overLayers[l.title] = leafletLayer;
            }

            if (l.active)
                overLayers[l.title].addTo(map);
        });

        loadMapControllers();
    });
}

function onOffTimeDimension(layerName) {
    if(ctrlTimer.control && ctrlTimer.layer==layerName) {
        removeTimerControl(layerName);
    }else{
        addTimerControl(layerName);
    }
}

function removeTimerControl(layerName) {
    if(ctrlTimer.control && ctrlTimer.layer==layerName){
        ctrlTimer.control.remove(map);
        ctrlTimer.control=null;
        ctrlTimer.layer=null;
    }
}

function addTimerControl(layerName) {

    var options={
        limitSliders: false,
        formatDate: {
            formatMatcher: {year:'numeric',month:'numeric',day:'numeric'},
            locale: 'pt-BR'
        }
    };
    
    ctrlTimer.control=L.control.timeDimension(options).addTo(map);
    ctrlTimer.layer=layerName;
}

function onRemoveOverlay(event) {
    if(event.layer._baseLayer && event.layer._baseLayer.options && event.layer._baseLayer.options.layers)
        removeTimerControl(event.layer._baseLayer.options.layers);
}

function onAddOverlay(event) {
    if(event.layer._baseLayer && event.layer._baseLayer.options && event.layer._baseLayer.options.layers)
        addTimerControl(event.layer._baseLayer.options.layers);
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


    // if(hasTemporalLayers) {
    //     var options={
    //         formatDate: {
    //             formatMatcher: {year:'numeric',month:'numeric',day:'numeric'},
    //             locale: 'pt-BR'
    //         }
    //     };
    //     ctrlTimer=L.control.timeDimension(options).addTo(map);

    //     /*
    //     {
    //         timeInterval: "P1Y/"+(new Date()).toISOString(),
    //         period: "P1Y"
    //     }
    //     */
    // }

    /**
     * Stop the animation
     */
    $('body').loading('stop');
}
