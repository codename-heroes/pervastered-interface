/**
 * @file tardis.js
 *
 * @brief
 *
 * @license
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy
 * of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 * Copyright (c) 2013- Victor Guerrero Corbi
 *
 * @author 	Victor Guerrero Corbi, <victor.guerrero@team-iso.com>
 * @date    2013-02-26
 * @version 0.02
 */

/*
 * TODO
 *
 */

if (typeof links === 'undefined') {
    links = {};
}

if (typeof google === 'undefined') {
    google = undefined;
}

// Internet Explorer 8 and older does not support Array.indexOf,
// so we define it here in that case
if(!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(obj){
        for(var i = 0; i < this.length; i++){
            if(this[i] == obj){
                return i;
            }
        }
        return -1;
    }
}

// Internet Explorer 8 and older does not support Array.forEach,
// so we define it here in that case
if (!Array.prototype.forEach) {
    Array.prototype.forEach = function(fn, scope) {
        for(var i = 0, len = this.length; i < len; ++i) {
            fn.call(scope || this, this[i], i, this);
        }
    }
}


links.Tardis = function(container) {
    // Initial view of Tardis is set to show 1 week before today
    var weekAgo = new Date("May 17, 2013 02:13:00"),
        weekAfter = new Date("May 23, 2013 02:13:00");


    //weekAgo.setDate(weekAgo.getDate() - 7);
    //weekAfter.setDate(weekAgo.getDate() + 3);
    this.options = {
        width:  "100%",
        height: "400px",
        editable: false, // make the events draggable
        eventMargin: 15,
        showButtonNew: false,
        style: "box",
        start: weekAgo,
        end: weekAfter,
        orientation:"vertical",
        showNavigation: true,
        showCustomTime: true,
        intervalMin: 10*60*1000, // milliseconds in 10 minute
        intervalMax: 6*30*24*60*60*1000, // milliseconds in 6 months
    };

    this.initTimeline();
    this.initMap();
};


// Tardis variables
links.Tardis.prototype.timeline = {};
links.Tardis.prototype.map = {};
links.Tardis.prototype.oms = {};
links.Tardis.prototype.data = {};
links.Tardis.prototype.options = {};
links.Tardis.prototype.ranges = {};
links.Tardis.prototype.markers = {};
links.Tardis.prototype.circles = {};
links.Tardis.prototype.layers = [];
links.Tardis.prototype.elements = {};
links.Tardis.prototype.mapMoving = false;
links.Tardis.prototype.events = [];
links.Tardis.prototype.currentRange = [undefined, undefined];
links.Tardis.prototype.visibleRange = [];
links.Tardis.prototype.openLabels = [];
links.Tardis.prototype.timelineUpdated = false;
links.Tardis.prototype.rangeVisibility = false;
links.Tardis.prototype.prevUpdate = new Date();
links.Tardis.prototype.paths = {};
links.Tardis.prototype.idToPath = undefined;
links.Tardis.prototype.heatmap = [];
links.Tardis.prototype.openLabels = [];
links.Tardis.prototype.idToEvents = {};
links.Tardis.prototype.idToColor = [];




// Tardis methods
// ---------------------------------------------------------------------------------------------

// ====================================
//      Initializers
// ====================================


links.Tardis.prototype.initTimeline = function() {
    links.Tardis.prototype.data = new google.visualization.DataTable();
    links.Tardis.prototype.timeline = new links.Timeline(document.getElementById('mytimeline'));

    var data = links.Tardis.prototype.data,
        timeline = links.Tardis.prototype.timeline;

    data.addColumn('datetime', 'start');
    data.addColumn('datetime', 'end');
    data.addColumn('string', 'content');

    // Instantiate our timeline object.
    google.visualization.events.addListener(timeline, 'rangechanged', this.onRangeChanged);
    google.visualization.events.addListener(timeline, 'select', this.onTimelineSelect);
    google.visualization.events.addListener(timeline, 'customrangechanged', this.onCustomRangeChanged);

    // Draw our timeline with the created data and options
    timeline.draw(data, this.options);
    var range = {
        "start": this.options["start"] , 
        "end": this.options["end"]
    };
    links.Tardis.prototype.onRangeChanged(range);

    // We set the interval to update the timeline
    window.setInterval( function() { 
        links.Tardis.prototype.updateTimeline();
    }, 5000);
};

links.Tardis.prototype._setMapListeners = function() {
    var map = links.Tardis.prototype.map;

    // add an OpenStreetMap tile layer
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // TO-DO popupopen and popupclose is old behaviour
    map.on('popupopen', function(e) {
        var marker = e.popup._source,
            circles = tardis.circles,
            nearby_distance = $(marker._popup._content).data("nearby_distance");

        if (circles["last"]) {
            map.removeLayer(circles["last"]);
        }

        if (nearby_distance != "undefined") {
            var latlng = marker._orig_latlng,
                circle = L.circle([latlng["lat"],latlng["lng"]], nearby_distance, {
                    color: 'black',
                    fillColor: 'black',
                    fillOpacity: 0.0
                }).addTo(map);

            circles["last"] = circle;
        }
    });

    map.on('popupclose', function(e){
        if (tardis.circles["last"]) map.removeLayer(tardis.circles["last"]);
    });

    map.on("movestart", function() {links.Tardis.prototype.mapMoving = true});
    map.on("moveend", function() {links.Tardis.prototype.mapMoving = false});

    map.on("overlayadd", function(e) {
        var layer = links.Tardis.prototype.mapLayers.getLayer(e.layer.name).layer,
            oms = links.Tardis.prototype.oms, 
            layers = layer._layers,
            overlays = links.Tardis.prototype.controller.get("overlaysOptions"),
            controlLayers = links.Tardis.prototype.mapLayers;

        // we add markers from oms
        for (var m in layers) {
            if (layers.hasOwnProperty(m)) {
                var marker = layers[m];
                if (marker.hasOwnProperty("_id")) {
                    oms.addMarker(marker);
                }
            }
        }

        if (e && e.layer.name == "Ranges") {
            links.Tardis.prototype.setRangeVisibility(true);
        }

        if (e.clicked)  links.Tardis.prototype.controller.send("addOverlay", e.layer.name);
    });

    map.on("overlayremove", function(e) {
        var layer = links.Tardis.prototype.mapLayers.getLayer(e.layer.name).layer,
            oms = links.Tardis.prototype.oms, 
            layers = layer._layers,
            overlays = links.Tardis.prototype.controller.get("overlaysOptions"),
            controlLayers = links.Tardis.prototype.mapLayers;

        // we remove markers from oms
        for (var m in layers) {
            if (layers.hasOwnProperty(m)) {
                var marker = layers[m];
                if (marker.hasOwnProperty("_id")) {
                    oms.removeMarker(marker);
                }
            }
        }  

        if (e && e.layer.name == "Ranges") {
            links.Tardis.prototype.setRangeVisibility(false);
        }

        if (e.clicked)  links.Tardis.prototype.controller.send("removeOverlay", e.layer.name);
    });

    map.on("load", function(e) {
        if (links.Tardis.prototype.controller) links.Tardis.prototype.controller.send("updateMapOverlays");
    });
};


links.Tardis.prototype._setOMSListeners = function() {
    var oms = links.Tardis.prototype.oms ;

    oms.addListener('spiderfy', function(markers) {
        for (var m = 0; m < markers.length; ++m) {
            var marker = markers[m];

            if (marker) {
                marker._spiderfied = true;
            }
        }
    });

    oms.addListener('unspiderfy', function(markers) {
       for (var m = 0; m < markers.length; ++m) {
            var marker = markers[m];

            if (marker) {
                marker._spiderfied = false;
                marker.setZIndexOffset(marker._zIndexOffsetOriginal);
            }
       }
    });

    oms.addListener("click", function(marker) {

        // WARNING TO-DO remove this to avoid coupling
        App.loadDetailedView(marker._id, marker._classType);
    });
};

links.Tardis.prototype.initMap = function initMap() {
    // variable declaration
    var marker,
        layers = links.Tardis.prototype.layers,
        color,
        self = links.Tardis.prototype;
    
    layers["message"] = L.layerGroup();
    layers["player"] = L.layerGroup();
    layers["ritual"] = L.layerGroup();
    layers["range"] = L.layerGroup();
    layers["paths"] = L.layerGroup();

    var messages = layers["message"],
        players  = layers["player"],
        rituals = layers["ritual"],
        ranges = layers["range"],
        paths = layers["paths"];

    messages.name = "Messages";
    players.name = "Players";
    rituals.name = "Rituals";
    paths.name = "Paths";
    ranges.name = "Ranges";

    // Heatpmap initialization
    var heatmapLayer = L.TileLayer.heatMap({
        radius: 20,
        opacity: 0.8,
        gradient: {
            0.45: "rgb(0,0,255)",
            0.55: "rgb(0,255,255)",
            0.65: "rgb(0,255,0)",
            0.95: "yellow",
            1.0: "rgb(255,0,0)"
        }
    });
    heatmapLayer.addData([]);
    layers["heatmap"] = heatmapLayer;


    // Map creation and we set it up in Stockholm
    self.map = L.map('map', {
        "layers" : [ messages, players, rituals, ranges, paths, heatmapLayer]
    }).setView([59.329444, 18.068611], 11);
    self._setMapListeners();

    // Overlay OMS plugin
    self.oms = new OverlappingMarkerSpiderfier(this.map);
    self._setOMSListeners();

    // Creation of overlay control
    self.mapLayers = L.control.layers(null,  {
        "Messages": messages,
        "Players": players,
        "Rituals": rituals,
        "Ranges" : ranges, 
        "Heatmap" : heatmapLayer,
        "Paths" : paths
    }).addTo(self.map);
};



links.Tardis.prototype.updateElements = function(elements) {
    links.Tardis.prototype.Markers.update(elements);
};

links.Tardis.prototype.setView = function (id, location) {
    var map = this.map,
        markers = this.markers;

    if (markers[id]) {
        markers[id].openPopup();
        map.setView([location[0], location[1]], map.getZoom());
    }
};

// ===============================
//  Markers
// ===============================

links.Tardis.prototype.focusMarker = function (id) {
    var map = this.map,
        marker = this.markers[id];


    if (marker) {
        links.Tardis.prototype.hideOpenLabels();
        var openLabels = links.Tardis.prototype.openLabels;
        
        openLabels[id] = marker;
        marker.openLabel(false);
        map.setView(marker.getLocation(), map.getZoom());
    }
};

links.Tardis.prototype.hideOpenLabels = function() {
    var openLabels = links.Tardis.prototype.openLabels,
        map = links.Tardis.prototype.map;

    for (var i in openLabels) {
        if (openLabels.hasOwnProperty(i)) {
            var marker = openLabels[i];

            // openLabels can contain also other methods 
            // so we have to make sure that i is not one of those
            if (marker) {
                marker.hideLabel();
            }
            
        }
    }

    links.Tardis.prototype.openLabels = [];
};

// ===============================
//  Overlays
// ===============================

links.Tardis.prototype.removeOverlay = function(overlay) {
    links.Tardis.prototype.mapLayers.removeOverlayFromMap(overlay);
}

links.Tardis.prototype.addOverlay = function(overlay) {
    links.Tardis.prototype.mapLayers.addOverlayToMap(overlay);
}

//========================================================================
//   Auxiliary functions
//========================================================================

links.Tardis.prototype.getClassType = function(id) {
    var element = links.Tardis.prototype.elements[id];

    if (element) {
        var store = element.store,
            clientId = element.clientId;

        return store.clientIdToType[clientId];
    }

    return undefined;
};

links.Tardis.prototype.renderView = function() {
    if  (links.Tardis.prototype.timeline.dom != undefined)  {
        $('#mytimeline').parent().html(links.Tardis.prototype.timeline.dom.container);
    }

    $("#map-container").html(links.Tardis.prototype.map._container);
};

// Format given date as "yyyy-mm-dd hh:ii:ss"
// @param datetime   A Date object.
links.Tardis.dateFormat = function dateFormat(date) {
    datetime =   date.getFullYear() + "-" +
        ((date.getMonth()   <  9) ? "0" : "") + (date.getMonth() + 1) + "-" +
        ((date.getDate()    < 10) ? "0" : "") +  date.getDate() + " " +
        ((date.getHours()   < 10) ? "0" : "") +  date.getHours() + ":" +
        ((date.getMinutes() < 10) ? "0" : "") +  date.getMinutes() + ":" +
        ((date.getSeconds() < 10) ? "0" : "") +  date.getSeconds()
    return datetime;
};

links.Tardis.prototype.getSelectedRow = function getSelectedRow() {
    var sel = links.Tardis.prototype.timeline.getSelection();
    if (sel.length) {
        if (sel[0].row != undefined) {
            var row = sel[0].row;
        }
    }
    return row;
};

links.Tardis.prototype.dateToString = function(date) {
    return date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":"+ date.getSeconds();
};

//========================================================================
//   Interactions
//========================================================================

// Make a callback function for the select item
links.Tardis.prototype.onRangeChanged = function (range) {
    links.Tardis.prototype.visibleRange = [range.start, range.end];    
};

links.Tardis.prototype.onCustomRangeChanged = function (range) {
    var dates = range.dates,
        self = links.Tardis.prototype;

    if (dates && dates.length > 0) {
        var endDate = self.dateToString(dates[dates.length-1]),
            startDate = self.dateToString(dates[0]);

        self.Events.getInDateRangeWithTag([startDate, endDate], "Position", function(positions) {
            links.Tardis.prototype.addPositions(positions);
        });
    }
};


links.Tardis.prototype.onMouseLeaveEvent = function (id) {
    var openLabels = links.Tardis.prototype.openLabels;
    if (openLabels == undefined || !openLabels.contains(id)) {
        links.Tardis.prototype.onMouseLeaveSummary(id);
    }
}


links.Tardis.prototype.onMouseEnterSummary = function(id, bounce) {
    var marker = links.Tardis.prototype.markers[id];

    if (marker && !links.Tardis.prototype.mapMoving) {
        // TO-DO commented lines below
        //if (marker._label == openLabel) return;
        marker.openLabel(bounce);
    }
}

links.Tardis.prototype.onMouseLeaveSummary = function(id) {
    var marker = links.Tardis.prototype.markers[id],
        openLabels = links.Tardis.prototype.openLabels;

    if (marker && !links.Tardis.prototype.mapMoving && openLabels[id] == undefined) {
        marker.hideLabel();
    }
}


links.Tardis.prototype.onTimelineSelect = function(params) {
    var row = links.Tardis.prototype.getSelectedRow(),
        openLabels = links.Tardis.prototype.openLabels;

    // We close the labels in the map that were open
    if (openLabels) {
        for (var i = 0; i < openLabels.length; ++i) {
            links.Tardis.prototype.onMouseLeaveSummary(openLabels[i]);
        }
        links.Tardis.prototype.openLabels = [];
    }

    // And open the labels involved with the selected event
    if (row != undefined) {
        var involved_objects = $(links.Tardis.prototype.data.getValue(row,2)).data("involved-objects");

        for (var j = 0; j < involved_objects.length; ++j) {
            var id = involved_objects[j];
            links.Tardis.prototype.onMouseEnterSummary(id);
        }
        // WARNING TO-DO the involved_objects bellow should be of the type MARKER!!!
        links.Tardis.prototype.openLabels = involved_objects;
    }
    else {
        console.log("no item selected");
    }
};


//========================================================================
//   Update timeline and adding functions
//========================================================================
links.Tardis.prototype.addPositions = function(positions) {
    links.Tardis.prototype.Paths.update(positions);
};


links.Tardis.prototype.addEvents = function(newEvents) {
    var events = links.Tardis.prototype.events,
        timeline = links.Tardis.prototype.timeline,
        valueAdded = false;

    for (var i=0; i < newEvents.length; ++i) {
        var event = newEvents[i];

        if (!events[event.id]) {
            valueAdded = true;
            events[event.id] = event;

            event.addToTimeline();
        }
    }

    if (valueAdded) {
        timeline.redraw();
    }
};


links.Tardis.prototype.updateTimeline = function() {
    if (!links.Tardis.prototype.timelineUpdated) {
        var start = links.Tardis.prototype.visibleRange[0],
            end = links.Tardis.prototype.visibleRange[1],
            currentRange = links.Tardis.prototype.currentRange,
            initialRange = currentRange[0],
            update = false,
            now = new Date(),
            self = links.Tardis.prototype;

        if (currentRange[0] == undefined || (currentRange[0] != start || currentRange[1] != end) || end > now) {
            if (currentRange[0] == start && end > now) {
                start = links.Tardis.prototype.prevUpdate;
                start.setMinutes(now.getMinutes() - 30);
                end.setMinutes(end.getMinutes() + 30);
            }
            self.prevUpdate = now;
            currentRange[0] = self.visibleRange[0];
            currentRange[1] = end;
            update = true;
        }


        var endDate = self.dateToString(end),
            startDate = self.dateToString(start);

        if (update) {
            self.timelineUpdated = true;
            self.Events.getInDateRangeWithTag([startDate, endDate], "Social", function(events) {
                    links.Tardis.prototype.timelineUpdated = false;
                    links.Tardis.prototype.addEvents(events);
                }, function() {
                    links.Tardis.prototype.timelineUpdated = false;
                }
            );
        }
    }
};


//========================================================================
//   Visibility related
//========================================================================
links.Tardis.prototype.highlight = function(ids) {
    var self = links.Tardis.prototype,
        markers = this.markers,
        timeline = self.timeline,
        timelineChanged = false,
        visibility;

    for (var id in markers) {
        visibility = (ids == undefined || ids[id]);
        timelineChanged = timelineChanged || self.setItemVisibility(id, visibility);
    }

    if (timelineChanged) {
        timeline.redraw();
    }
};

links.Tardis.prototype.setRangeVisibility = function(visible) {
    links.Tardis.prototype.rangeVisibility = visible;

    var ranges = links.Tardis.prototype.ranges,
        weight,
        fillOpacity;

    if (visible) {
        weight = 3;
        fillOpacity = 0.5;
    } else {
        weight = 0;
        fillOpacity = 0;
    }

    for (var i in ranges) {
        if (ranges.hasOwnProperty(i)) {
            var range = ranges[i];

            range.setStyle({
                weight: weight, 
                fillOpacity: fillOpacity
            });
        }
    }
};

links.Tardis.prototype.setItemVisibility = function(id, visible) {
    var self = links.Tardis.prototype;

    self.setMarkerVisibility(id, visible);
    self.setPathVisibility(id, visible);

    return self.setEventVisibility(id, visible);
};

links.Tardis.prototype.setMarkerVisibility = function(id, visible) {
    var marker = this.markers[id];
    if (marker) marker.setVisibility(visible);
};

links.Tardis.prototype.setPathVisibility = function(id, visible) {
    var path = links.Tardis.prototype.paths[id];
    if (path) path.setVisibility(visible);
};

links.Tardis.prototype.setEventVisibility = function(id, visible) {
    var eventList = links.Tardis.prototype.idToEvents[id],
        timelineChanged = false;

    if (eventList) {
        for (var i = 0; i < eventList.length; ++i) {
            timelineChanged = timelineChanged || eventList[i].setVisibility(visible);
        }
    }

    return timelineChanged;
};

//========================================================================
//
//   Tardis class definitions
//
//========================================================================

links.Tardis.prototype.Path = (function(path) {
    var _components = [];
    init(path);

    function init(path) {
        var self = links.Tardis.prototype,
            map = self.map,
            timeRange = self.timeline.getTimeRange(),
            pathColors = self.idToColor,
            markers = self.markers,
            id = path.id,
            datesPath = path.dates,
            path = path.positions,
            layer = self.layers["paths"],
            pathOptions = {
                color: 'red',
                weight: 0,
                opacity: 1,
                smoothFactor: 1,
                dashArray: "4, 2, 4",
            };

        // We assign color
        var color = pathColors[id];
        if (!color) {
            color = '#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6);
            pathColors[id] = color;
        }

        // Visibility of the path depends on the visibility of the marker 
        if (markers[id] && markers[id].getVisibility()) {
            opacity = 1;
            weight = 3;
        } else {
            opacity = 0;
            weight = 0;
        }

        pathOptions.weight = weight;
        pathOptions.color = color;

        // We draw paths
        if (path.length > 1) {
            var line = new L.Polyline(path, pathOptions),
                increment = 100/path.length,
                radiusSize = 2,
                timeRangeIt = 0;

            // We bind the Label of the path
            line.bindLabel(path._label);


            // We construct the line with the path positions
            for (var j = 0; j < path.length; ++j) {
                var latLng = path[j],
                    circle = L.circle(latLng, radiusSize, {"opacity": opacity}),
                    date = datesPath[j];


                // We add a circle at each position
                // this will help getting information about it
                circle._computedRadius = radiusSize;
                circle.bindLabel(date.toLocaleTimeString() + " " + date.toLocaleDateString());

                layer.addLayer(circle);
                _components.push(circle);
                

                // We add markers corresponding to the timeRange markers
                var isLastItem = (timeRangeIt < timeRange.length && j == path.length-1);

                // We iterete while the current timestamp in the path hasn't reached the timestamp in the
                // timestamp of the timerange
                while (date >= timeRange[timeRangeIt] || isLastItem) {
                    var previousJ = (j > 0 ? j-1 : j),
                        timeDelta = datesPath[j] - datesPath[previousJ],
                        previousLatLng = path[previousJ],
                        position,
                        a,
                        previousPoint,
                        currentPoint;

                    // Coeficient for bilinear interpolation
                    a = (isLastItem ? 1 : (timeDelta == 0? 0 : (date - timeRange[timeRangeIt])/timeDelta));

                    // Computation of new point interpolated from enclosing time lapse
                    previousPoint = map.project(previousLatLng);
                    currentPoint = map.project(latLng);
                    interpolatedPoint = previousPoint.add(currentPoint.subtract(previousPoint).multiplyBy(a));
                    position = map.unproject(interpolatedPoint);


                    // Markers that represent the time in the timeline
                    var icon = L.divIcon({
                            className : "leaflet-marker-background",
                            iconSize : [8, 8],
                            iconAnchor:   [8, 8],
                            html :"<div class='leaflet-marker-number'>" + timeRangeIt +"</div>"
                        }),
                        marker = L.marker(position, { 
                            "icon": icon, 
                            "opacity": opacity, 
                            zIndexOffset : 0
                        });

                    // We add the marker
                    layer.addLayer(marker);
                    _components.push(marker);

                    if (marker._icon != undefined) {
                        marker._icon.style.backgroundColor = pathOptions.color;
                        marker._icon.style.background = pathOptions.color;
                        marker._icon.style.borderColor = pathOptions.color;
                    }

                    timeRangeIt++;
                    if (isLastItem) break;
                }
            }

            layer.addLayer(line);
            _components.push(line);
            
            // Finally we add the arrowHeads
            var arrowOptions = {
                    patterns: [{
                        offset: 10 + '%', 
                        repeat: (200/path.length)+"%", 
                        offsetNumber: 10,
                        symbol: new L.Symbol.ArrowHead({ 
                            pixelSize: 10, 
                            polygon: false, 
                            pathOptions: {
                                "opacity": opacity, 
                                stroke: true, 
                                color: pathOptions.color
                            }
                        })
                    }]
                },
                arrowHead = L.polylineDecorator(line, arrowOptions);

            layer.addLayer(arrowHead);    
            _components.push(arrowHead);


            line.on('mouseover', function(event) {
                var self = this;
                if (this._pathInterval) window.clearInterval(this._pathInterval);

                this._pathInterval = window.setInterval(function() {
                    var patterns = self.options.patterns,
                        pattern = patterns[0];
                    
                    pattern.offsetNumber = (pattern.offsetNumber + 1)%100;
                    patterns[0].offset = pattern.offsetNumber;
                    self.setPatterns(patterns);
                }, 50);
            }, arrowHead);

            line.on('mouseout', function(event) {
                window.clearInterval(this._pathInterval);
            }, arrowHead);
        }
    }


    return {
        setVisibility: function _setVisibility(visible) {
            var path = this.items,
            pathWeight,
            pathRadius;

            if (visible) {
                pathWeight = 3;
                pathRadius = undefined;
                opacity = 1;
            } else {
                pathWeight = 0;
                pathRadius = 0;
                opacity = 0;
            }
            if (path != undefined) { // TO-DO quick fix
                for (var i = 0; i < path.length; ++i) {
                    var component = path[i];

                    // Circles of the positions in the path
                    if (component.setRadius) {
                        component.setRadius((pathRadius == undefined ? component._computedRadius: pathRadius));
                        component.setStyle({stroke: visible, fill: visible});
                    // lines 
                    } else if (component.setStyle) {
                        component.setStyle({weight: pathWeight});
                    // Markers indicating time range number
                    } else if (component.setOpacity) {
                        component.setOpacity(opacity);
                    // ArrowHeads
                    } else {
                        var pattern = component.options.patterns[0];
                        pattern.symbol.options.pathOptions.opacity = opacity;
                        component.setPatterns([pattern]);
                    }
                }
            }
        },


        remove: function () {
            var self = links.Tardis.prototype,
                layer = self.layers["paths"],
                components = _components;


            for (var i = 0; i < components.length; ++i) {
                layer.removeLayer(components[i]);
            }
        }
    };
});

links.Tardis.prototype.Markers = (function() {
    function _isValid(element) {
        // TO-DO Codename-Heroes logic should be removed
        var lastKnownLocation = element.get("last_known_location"),
            located = !(lastKnownLocation == undefined || lastKnownLocation["longitude"] == ""),
            delivered = (element.get("recipient_id") == element.get("location_id") || element.get("destination_id") == element.get("location_id")),
            decoded = element.get("decoded") == "1",
            subtype = element.get("parent_name"),
            elementType = element.get("type"),
            validRitual = elementType == "ritual" && (subtype == "mana well" || subtype == "deaddrop" || subtype == "Mana Drainer"),
            validElement = validRitual ||  elementType == "message" || elementType == "player";


        return validElement && located && (!delivered || !decoded);
    }

    function _addMarker(element) {
        var self = links.Tardis.prototype,
            element = element.type.find(element.id);
            markers = self.markers;

        if (_isValid(element)) {
            markers[element.id] = new self.Marker(element);
        }
        
    }

    function _updateMarker(element) {
        var self = links.Tardis.prototype,
            markers = self.markers,
            marker = markers[element["id"]],
            elements = self.elements;

        if (marker == undefined) {
            // We add as a marker just is hasn't been tracked before
            if (elements[element["id"]] == undefined) _addMarker(element);
        } else {
            var last_known_location = elements[element["id"]].get("last_known_location"),
                newLatLng = {
                    "lat": Number(last_known_location["latitude"]).toFixed(5), 
                    "lng": Number(last_known_location["longitude"]).toFixed(5)
                };

            marker.updateLocation(newLatLng);
        }
    }

    function _update(elements) {
        var self = links.Tardis.prototype,
            content = elements.get("content"),
            contentLength = content["length"]; 

        // TO-DO find why map is set eventhough it shouldn't
        if (contentLength > 0) {
            var element = content[0],
                layer = self.layers[element.type.find(element.id).get("type")],
                oms = self.oms,
                overlaysOptions = self.controller.get("overlaysOptions");

            if (overlaysOptions.indexOf(layer.name) == -1) {
                layer._map = null;
                for (var i in layer._layers) {
                    if (layer._layers.hasOwnProperty(i)) {
                        oms.removeMarker(layer._layers[i]);
                    }
                }

            } else {
                layer._map = self.map;
            }

            var rangeEnabled = overlaysOptions.indexOf("Ranges") != -1;
            if (!rangeEnabled) {
                self.layers["range"]._map = null;
            }
        }
        // End of bug fix 


        for(var i = 0; i < contentLength; ++i) {
            var elem = content[i];

            _updateMarker(elem);
        }
    }

    return {
        update: _update,
    }
})();

links.Tardis.prototype.Marker = (function(element) {
    var marker,
        color;

    init(element);

    function init(element) {
        var icon,
            element_type,
            location,
            id,
            color = null,
            self = links.Tardis.prototype,
            last_known_location = element.get("last_known_location"),
            zIndex = 0,
            elements = self.elements;


        elements[element.id] = element;
        location = [last_known_location["latitude"], last_known_location["longitude"]];
        id = element.get("id");
        element_type = element.get("type");

        switch (element_type) {
            case "ritual":
                var subtype = element.get("parent_name");

                switch (subtype){
                    case "mana well":
                        icon = "marker-mana-well.png";
                        color = "green";
                        break;
                    case "deaddrop":
                        icon = "marker-dropbox.png";
                        color = "blue";
                        break;
                    case "ActivityScanner":
                        return null;
                        break;
                    case "Mana Drainer":
                        icon = "marker-mana-drainer.png";
                        color = "black";
                        break;
                    default:
                        return null;
                };
                break;
            case "message":
                icon = "marker-messages.png";
                zIndex = -1;
                break;
            case "player":
                var subtype = element.get("team");
                switch (subtype){
                    case "hand_player":
                        icon = "marker-player-yellow.png";
                        color = "yellow";
                        break;
                    case "heart_player":
                        icon = "marker-player-red.png";
                        color = "red";
                        break;
                    case "head_player":
                        icon = "marker-player-blue.png";
                        color = "cyan";
                        break;
                    default:
                        icon = "marker-npc.png";
                        color = "green";
                        
                };
                break;
        };

        var icon = L.icon({
            iconUrl:"./img/"+ icon,
            shadowUrl:"./img/marker-shadow.png",
            iconSize:     [25, 41], // size of the icon
            shadowSize:   [41, 41], // size of the shadow
            iconAnchor:   [12, 41], // point of the icon which will correspond to marker's location
            shadowAnchor: [12, 41],  // the same for the shadow
            popupAnchor:  [0, -41], // point from which the popup should open relative to the iconAnchor
            labelAnchor: [0, -20]
        });

        marker = L.marker(location, {
            icon:icon, 
            bounceOnAdd:false, 
            bounceOnAddHeight: 30, 
            zIndexOffset: zIndex
         });
        // 
        marker._id = id;
        marker._nearbyDistance = element.get("nearby_distance"); 

        marker.bindLabel("[" + element.get("id") + "] " + element.get("name"), { noHide : true});
        marker._zIndexOffsetOriginal = zIndex;
        marker._id = id;
        marker._classType = element.get("class_type");
        marker.on("mouseover", function() {
            var label = this._label;

            label.setLatLng(marker.getLatLng());
            links.Tardis.prototype.map.showLabel(label);
        });
        marker.on("mouseout", function() {
            marker.hideLabel();
            links.Tardis.prototype.onMouseLeaveEvent(marker._id);
        });

        // We add the marker

        var oms = self.oms,
            element_type = element.get("type"),
            layers = self.layers;

        layers[element_type].addLayer(marker);
        oms.addMarker(marker);

        var nearby_distance = element.get("nearby_distance");
        if (nearby_distance) {
            // This is due to bounce.js changing their original position
            var location = element.get("last_known_location"),
                fillOpacity,
                weight;

            if (links.Tardis.prototype.rangeVisibility) {
                fillOpacity = 0.5;
                weight = 3;
            } else {
                fillOpacity = 0;
                weight = 0;
            }

            var circle = L.circle([location["latitude"] , location["longitude"]], nearby_distance, {
                color: color,
                fillColor: color,
                fillOpacity: fillOpacity,
                weight: weight,
            });
            layers[element_type].addLayer(circle);
            marker._circle = circle;
        }
    }

    function _hideLabel() {
        var tardis = links.Tardis,
            map = tardis.prototype.map,
            circles = tardis.prototype.circles;

        marker.hideLabel();

        // We remove the circle that shows current marker
        if (marker._circle) {
            map.removeLayer(marker._circle);
            marker._circle = undefined;
        }
    }


    function _openLabel(bounce) {
        var tardis = links.Tardis,
            map = tardis.prototype.map;

        if (bounce && marker._map) {
            marker.bounce(500, 60);
        }
        marker.showLabel();

        // We set a circle in the marker
        var nearbyDistance = marker._nearbyDistance;

        if (nearbyDistance != "undefined") {
            var latlng = marker._orig_latlng;

            if (latlng != undefined) { // TO-DO quick fix
                circle = L.circle([Number(latlng["lat"]).toFixed(5), Number(latlng["lng"]).toFixed(5)], nearbyDistance, {
                    color: 'black',
                    fillColor: 'black',
                    fillOpacity: 0.0
                }).addTo(map);

                marker._circle = circle;
            }
        }
    }


    function _getVisibility() {
        return marker.options.opacity == 1;
    }

    function _setVisibility(visible) {
        var markerOpacity,
            indexOffset = marker._zIndexOffsetOriginal,
            weight;

        if (visible) {
            markerOpacity = 1; 
            indexOffset += 1000;
            weight = 3;
        } else {
            markerOpacity = 0.2; 
            weight = 0;
        }

        marker.setOpacity(markerOpacity);
        marker.setZIndexOffset(indexOffset);
    }

    function _getLocation() {
        return marker.getLatLng();
    }

    function _updateLocation(newLatLng) {
        var prevLatLng = marker.getLatLng();

        if (((marker._spiderfied == undefined) || !marker._spiderfied ) && 
            (Math.abs(Number(prevLatLng["lat"]).toFixed(5) - Number(newLatLng["lat"]).toFixed(5)) > 0.001 ||  
            Math.abs(prevLatLng["lng"] - newLatLng["lng"]) > 0.001)) {
            
            marker.setLatLng(newLatLng);
            if (marker._circle) marker._circle.setLatLng(newLatLng);
        } 
    }

    function _openPopup() {
        marker.openPopup();
    }


    return {
        hideLabel: _hideLabel,
        openLabel: _openLabel,
        openPopup: _openPopup,
        getVisibility: _getVisibility,
        setVisibility: _setVisibility,
        updateLocation: _updateLocation,
        getLocation: _getLocation
    };
});

links.Tardis.prototype.Event = (function() {

    return {
        setVisibility: function _setVisibility(visible) {
            var eventDom = $("#event-" + this.id),
                timeline = links.Tardis.prototype.timeline,
                changed = false;

            if (!visible) {
                // if the item exists
                if (eventDom.length > 0) {
                    var item = timeline.getItemIndex(eventDom.get(0));

                    if (item) {
                        timeline.deleteItem(item, true);
                        changed = true;
                    }
                }
            } else {
                if (eventDom.length == 0) {
                    this.addToTimeline();
                    changed = true;
                }
            }

            return changed;
        },


        addToTimeline: function _addToTimeline() {
            links.Tardis.prototype.timeline.addItem(this.toTimelineItem(), true);
        },


        toTimelineItem: function _getTimelineItem() {
            if (this.item == undefined) {
                var involvedObjects = this.involvedObjects,
                    involvedObjectsString = [],
                    info = this.info,
                    idToEvents = links.Tardis.prototype.idToEvents;

                for (var j = 0; j < involvedObjects.length; ++j) {
                    var object = involvedObjects[j],
                        id = object.id;

                    involvedObjectsString.push("\""+ id + "\"");

                    // We must keep a relation mapping of id objects witht the events
                    // to speed up interactions of the other elements (the navigation bar)
                    // with the events
                    if (idToEvents[id] == undefined) {
                        idToEvents[id] = [];
                    }
                    idToEvents[id].push(this);

                    info = info.replace(id, "<b onmouseover='tardis.__proto__.onMouseEnterSummary(\""+ id 
                                        + "\", true);' onmouseout=' tardis.__proto__.onMouseLeaveEvent(\"" + id +"\")'>"+ id + "</b>");

                    this.item = {
                        'start': this.date,
                        'content': '<div data-involved-objects=\'['+ involvedObjectsString +']\' id="event-' + this.id + '">' + info + '</div>'
                    };
                }
            }

            return this.item;
        }
    };
});


links.Tardis.prototype.Paths = (function() {
    function _removePaths() {
        var paths = links.Tardis.prototype.paths;

        for (var i in paths) {
            if (paths.hasOwnProperty(i)) {
                paths[i].remove();
            }
        }

        links.Tardis.prototype.paths = {};
    }

    function _updatePaths(positions) {
        var paths = [],
            dates = [],
            self = links.Tardis.prototype,
            heatmapLayer = self.layers["heatmap"],
            heatmapEnabled = self.controller.get("overlaysOptions").indexOf("Heatmap") != -1,
            heatmapData = [];

        
        if (!heatmapEnabled) {
            heatmapLayer._map = null;
        }

        // We build paths out of the positions
        for (var i = 0; i < positions.length; ++i) {
            var pos = positions[i],
                object = pos.involvedObject,
                idObject = object.id;

            if (paths[idObject] == undefined) {
                paths[idObject] = [];
                dates[idObject] = [];
            }

            // We store the components
            var path = paths[idObject],
                date = dates[idObject];

            path.push(new L.LatLng(Number(pos.latitude).toFixed(5), Number(pos.longitude).toFixed(5)));
            path._label = "["+ idObject +"] " + object.name; 


            heatmapData.push({ 
                lat: pos.latitude, 
                lon: pos.longitude, 
                value: 1
            });

            date.push(pos.date);
        }

        // Add data to the heatmap
        // TO-DO it might happen that heatmap data is not properly removed
        // when new ranges are selected
        heatmapLayer.addData(heatmapData);
        
        if (heatmapEnabled) {
            heatmapLayer.redraw();
        }

        _draw(paths, dates);
    }

    function _draw(paths, dates) {
        var self = links.Tardis.prototype,
            map = self.map,
            layer = self.layers["paths"],
            pathsEnabled = self.controller.get("overlaysOptions").indexOf("Paths") != -1,
            Path = self.Path;

        // We remove previous paths
        _removePaths();

        // TO-DO bug that makes path enabled even though they shouldn't
        if (!pathsEnabled) {
            layer._map = null;
        }

        var newPaths = [];
        for (var i in paths) {
            if (paths.hasOwnProperty(i)) {
                var path = paths[i],
                    id = i,
                    datesPath = dates[id];

                // initialize the object if the path of the object didn't exist
                if (newPaths[id] == undefined) {
                    newPaths[id] = new Path({
                        'positions' : path,
                        'dates': datesPath,
                        'id': id
                    });
                }
            }
        }

        links.Tardis.prototype.paths = newPaths;
    }

    return {
        removeAll: _removePaths,
        update: _updatePaths,
    }
})();


links.Tardis.prototype.Events = (function() {
    // Wrapper with Logee object
    function _translateResponse(logeeEvents) {
        var events = logeeEvents["events"],
            tardisEvents = []
            Event = links.Tardis.prototype.Event;

        if (events) {
            for (var i = 0; i < events.length; ++i) {
                var logeeEvent = events[i],
                    logeeInvolvedObjects = logeeEvent["involved_objects"];

                tardisEvent = new Event();
                tardisEvent.id = logeeEvent["id"];
                tardisEvent.date = new Date(parseInt(logeeEvent["date"])*1000);
                tardisEvent.info = logeeEvent["info"];

                var involvedObjects = [];
                for (var j = 0; j < logeeInvolvedObjects.length; ++j) {
                    var object = logeeInvolvedObjects[j];

                    involvedObjects[j] = {
                        id: object["external_identifier"],
                        name: object["info"]
                    };
                }

                tardisEvent.involvedObjects = involvedObjects;
                tardisEvent.involvedObject = involvedObjects[0];

                // Specific parameters (TO-DO move to a Factory style creation)
                if (logeeEvent.type.name == "Social") {

                } else if (logeeEvent.type.name == "Position") {
                    var logeeInfoJSON = JSON.parse(tardisEvent.info);
                    tardisEvent.latitude = logeeInfoJSON.latitude;
                    tardisEvent.longitude = logeeInfoJSON.longitude;
                }

                // TARDIS EVENT API
                tardisEvents[i] = tardisEvent;
            }
        }

        return tardisEvents;
    }

    function _getEventsInDateRangeWithTag(dateRange, tag, doneCallback, failCallback) {
        $.ajax({    
           url: App.Config.Logee.API,
           type : "POST",
           dataType: "json",
           data: JSON.stringify({ 
                "filter" : {
                    "date_range": dateRange, 
                    "namespace": "Codename Heroes", 
                    "type": tag
                }
           }),
        }).done(function(response) {
            if (doneCallback) {
                doneCallback(_translateResponse(response));
            }
        }).fail(function(response) {
            if (failCallback) {
                failCallback(_translateResponse(response));
            }
        });
    }
    
    return {
        getInDateRangeWithTag : _getEventsInDateRangeWithTag 
    }
})();