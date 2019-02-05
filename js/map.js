var map;
var latitude = -55.685277;
var longitude = -10.3;
var host_api = "http://terrabrasilis2.dpi.inpe.br:13003/api/v1";

let baseLayers = {};
let overLayers = {};
let timeConfigLayers = [];// store the default configurations for construct the TimeDimension layers when its needed.
let overLayersTD = {};// The created instances of the TimeDimension layers

let generalZIndex=0;
let layerControl;

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
        }
        //timeDimension: true
    }).setView([longitude, latitude], 5);
    //map.on('overlayremove', onRemoveOverlay);
    //map.on('overlayadd', onAddOverlay);
    map.on('layeradd', onLayerAdd);
    map.on('layerremove', onLayerRemove);

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

            var leafletLayer=createLeafletLayerFromConfig(l);

            if(l.capabilitiesUrl && l.capabilitiesUrl!="") {
                // Show one button to enable/disable the TimerControl over map.
                console.log("The layer "+l.name+" have time dimension.");
                timeConfigLayers.push(l);
            }

            overLayers[l.title] = leafletLayer;

            if (l.active)
                overLayers[l.title].addTo(map);
        });

        loadMapControllers();
    });
}

function createLeafletLayerFromConfig(layerConfig) {
    let url = layerConfig.datasource.host.replace("ows", "gwc/service/wms");

    generalZIndex++;

    return L.tileLayer.wms(url, {
        layers: layerConfig.workspace + ':' + layerConfig.name,
        format: 'image/png',
        transparent: true,
        tiled: true,
        zIndex: generalZIndex,
        attribution: 'INPE/OBT/DPI/TerraBrasilis'
    });
}

function createTimeDimensionLayerFromConfig(layerConfig) {
    var tdOptions={
        timeDimension: ctrlTimer.timeDimension,
        requestTimeFromCapabilities: true,
        getCapabilitiesUrl: layerConfig.datasource.host.replace("ows", layerConfig.workspace + "/" + layerConfig.name+"/ows"),
        setDefaultTime: true,
        getCapabilitiesLayerName: layerConfig.name,
        wmsVersion: "1.3.0"
        // getCapabilitiesParams: {
        //     updateSequence:1
        // }
    };

    return L.timeDimension.layer.wms(overLayers[layerConfig.title],tdOptions);
}
/**
 * Create TimeDimension Layer if it not exists and add it to map.
 * Before add TimeDimension to map, removes the default Leaflef Layer from the map.
 * 
 * @param {string} layerName, the layer name
 */
function addLayerTimeDimension(layerName) {

    var hasTimeLayer=getTimeLayer(layerName);

    if(hasTimeLayer) {
        
        overLayers[hasTimeLayer.title].removeFrom(map);// Removing the default Leaflef Layer from the map.

        if(!overLayersTD[hasTimeLayer.title]){
            overLayersTD[hasTimeLayer.title] = createTimeDimensionLayerFromConfig(hasTimeLayer);
        }
        overLayersTD[hasTimeLayer.title].addTo(map);// Adding TimeDimension Layer to the map.
    }
    return hasTimeLayer;
}

function addLeafletLayer(layerName) {
    var hasTimeLayer=getTimeLayer(layerName);

    if(hasTimeLayer) {

        // remove old layer from layerControl
        layerControl.removeLayer(overLayers[hasTimeLayer.title]);

        // create and add new leaflet layer into map and layerControl
        var leafletLayer=createLeafletLayerFromConfig(hasTimeLayer);
        leafletLayer.addTo(map);
        layerControl.addOverlay(leafletLayer,hasTimeLayer.title);
        overLayers[hasTimeLayer.title] = leafletLayer;
    }
}

function onOffTimeDimension(layerName) {
    if(ctrlTimer.control && ctrlTimer.layer==layerName) {
        removeTimerControl();
        addLeafletLayer(layerName);
    }else{
        removeTimerControl();
        if(ctrlTimer.layer!=layerName) {
            addLeafletLayer(ctrlTimer.layer);
        }
        addTimerControl(layerName);
    }
}

function removeTimerControl() {
    if(ctrlTimer.control){
        var l = getTimeLayer(ctrlTimer.layer);
        if(l){
            ctrlTimer.control.remove(map);
            overLayersTD[l.title].removeFrom(map);
        }
    }
}

function addTimerControl(layerName) {

    if(!ctrlTimer.timeDimension){
        ctrlTimer.timeDimension = new L.TimeDimension();
    }
    
    var options={
        timeDimension: ctrlTimer.timeDimension,
        limitSliders: false,
        formatDate: {
            formatMatcher: {year:'numeric',month:'numeric',day:'numeric'},
            locale: 'pt-BR'
        }
    };
    
    ctrlTimer.control=L.control.timeDimension(options).addTo(map);
    ctrlTimer.layer=layerName;
    if(addLayerTimeDimension(layerName)){
        console.log("Enable TimeDimension support to the "+layerName+" Layer.");
    }else{
        console.log("Failure TimeDimension support to the "+layerName+" Layer.");
    }
}

/*
function onRemoveOverlay(event) {
    if(event.layer && event.layer.options && event.layer.options.layers)
    {
        var l = getTimeLayer(event.layer.options.layers);
        if(l && overLayers[l.title]) overLayers[l.title].removeFrom(map);
    }
}

function onAddOverlay(event) {
    if(event.layer && event.layer.options && event.layer.options.layers)
    {
        var l = getTimeLayer(event.layer.options.layers);
        if(l && overLayers[l.title]) overLayers[l.title].addTo(map);
    }
    
}
*/

/**
 * When one layer is removed from map by click on layerControl
 * @param {*} event 
 */
function onLayerRemove(event) {
    if(event.layer && event.layer.wmsParams
        && event.layer.wmsParams.layers
        && (!event.layer.wmsParams.time || event.layer.wmsParams.time==="") )
    {
        var ln=(event.layer.wmsParams.layers.indexOf(':')>0)?(event.layer.wmsParams.layers.split(':')[1]):(event.layer.wmsParams.layers);
        if($('#btn_time_'+ln)){
            $('#btn_time_'+ln).addClass('time-hidden');// hide the TimeDimension button
        }
    }
}

function onLayerAdd(event) {
    if(event.layer && event.layer.wmsParams
        && event.layer.wmsParams.layers
        && (!event.layer.wmsParams.time || event.layer.wmsParams.time==="") )
    {
        var ln=(event.layer.wmsParams.layers.indexOf(':')>0)?(event.layer.wmsParams.layers.split(':')[1]):(event.layer.wmsParams.layers);
        if($('#btn_time_'+ln)){
            $('#btn_time_'+ln).removeClass('time-hidden');// show the TimeDimension button
        }
    }
    
}

function getTimeLayer(layerName) {
    if(layerName) {
        if(layerName.indexOf(':')>0){
            layerName=layerName.split(':')[1];
        }
        return timeConfigLayers.find(function(layer){
            if(layer.name==layerName) {
                return layer;
            }
        });
    }
    return null;
}

function loadMapControllers() {
    var options = {
        sortLayers : true,
        collapsed : true
    }
    
    /**
     * Add Baselayers and Overlayers to map
     */
    layerControl=L.control.layers(baseLayers, overLayers, options).addTo(map);

    /**
     * Scale tool
     */
    L.control.scale().addTo(map);


    /**
     * Stop the animation
     */
    $('body').loading('stop');
}
