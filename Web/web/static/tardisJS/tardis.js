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
    this.options = {
        width:  "100%",
        height: "400px",
        editable: false, // make the events draggable
        eventMargin: 15,
        showButtonNew: false,
        style: "box",
        orientation:"vertical",
        showNavigation:true,
        showCustomTime:true
    };

    this.initTimeline();
    this.initMap();
};

links.Tardis.prototype.timeline = {};
links.Tardis.prototype.map = {};
links.Tardis.prototype.data = {};
links.Tardis.prototype.options = {};
links.Tardis.prototype.markers = {};
links.Tardis.prototype.circles = {};

// Called when the Visualization API is loaded.
links.Tardis.prototype.initTimeline = function() {
    links.Tardis.prototype.data = new google.visualization.DataTable();
    links.Tardis.prototype.timeline = new links.Timeline(document.getElementById('mytimeline'));

    var data = links.Tardis.prototype.data,
        timeline = links.Tardis.prototype.timeline;
    data.addColumn('datetime', 'start');
    data.addColumn('datetime', 'end');
    data.addColumn('string', 'content');

    data.addRows([
        [new Date(2013,7,23), , '<div>Conversation</div>'],
        [new Date(2013,7,23,23,0,0), , '<div>Mail from boss</div>'],
        [new Date(2013,7,24,16,0,0), , 'Report'],
        [new Date(2013,7,28), , '<div>Memo</div>'],
        [new Date(2013,7,29), , '<div>Phone call</div>'],
        [new Date(2013,8,4,12,00,00), , '<div>Report</div>']
    ]);
    // Instantiate our timeline object.
    google.visualization.events.addListener(timeline, 'rangechanged', this.onrangechanged);
    google.visualization.events.addListener(timeline, 'select', this.onselect);

    // Draw our timeline with the created data and options
    timeline.draw(data, this.options);
};

links.Tardis.prototype.setView = function (id, location) {
    var map = this.map,
        markers = this.markers;

    if (markers[id]) {
        console.log(markers[id]);
        markers[id].openPopup();
        map.setView([location[0], location[1]],map.getZoom());
    }
};

links.Tardis.prototype.initMap = function initMap() {
    var messages = [],
        players = [],
        rituals = [],
        ranges = [],
        marker,
        color;
    var elements = $("#init-data").data("json");

    for (var i in elements) {
        var element = elements[i],
            result = links.Tardis.heroesIcon(element);

        if (result != null) {
            marker = result[0];
            color = result[1];
            switch (element["type"]) {
                case "message":
                    messages.push(marker);
                    break;
                case "player":
                    players.push(marker);
                    break;
                case "ritual":
                    rituals.push(marker);
                    break;
            }
            if (element["nearby_distance"]) {
                var circle = L.circle(marker.getLatLng(), element["nearby_distance"], {
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.5
                });
                ranges.push(circle);
            }
            this.markers[element["id"]] = marker;
        }
    }
    var messages   = L.layerGroup(messages),
        players  = L.layerGroup(players),
        rituals = L.layerGroup(rituals),
        ranges = L.layerGroup(ranges);

    this.map = L.map('map', {
        layers : [messages, players, rituals, ranges]
    }).setView([59.329444, 18.068611], 13);
    var map = this.map;


    map.on('popupopen', function(e){
        var marker = e.popup._source,
            circles = tardis.circles;
        if (circles["last"]) map.removeLayer(circles["last"]);
        var nearby_distance = $(marker._popup._content).data("nearby_distance");
        if (nearby_distance != "undefined") {
           var latlng = marker.getLatLng();
           var circle = L.circle([latlng["lat"],latlng["lng"]], nearby_distance, {
                color: 'black',
                fillColor: 'black',
                fillOpacity: 0.5
            }).addTo(map);
            circles["last"] = circle;
        }
    });
    map.on('popupclose', function(e){
        if (tardis.circles["last"]) map.removeLayer(tardis.circles["last"]);
    });

    // add an OpenStreetMap tile layer
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    var overlayMaps = {
        "Messages":messages,
        "Players": players,
        "Rituals": rituals,
        "Ranges" : ranges
    };
    L.control.layers(null,overlayMaps).addTo(map);
};

links.Tardis.heroesIcon = function (element) {
    var icon,
        element_type,
        location,
        id,
        color = null;

    if (element["last_known_location"] == undefined || element["last_known_location"]["longitude"] == "") return null;
    location = [element["last_known_location"]["latitude"],element["last_known_location"]["longitude"]];
    id = element["id"];
    element_type = element["type"];

    switch (element_type) {
        case "ritual":
            var subtype = element["parent_name"];
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
            break;
        case "player":
            var subtype = element["team"];
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
                    return null;
            };
            break;
    };

    var icon = L.icon({
        iconUrl:"/img/"+ icon,
        shadowUrl:"/img/marker-shadow.png",
        iconSize:     [25, 41], // size of the icon
        shadowSize:   [41, 41], // size of the shadow
        iconAnchor:   [12, 41], // point of the icon which will correspond to marker's location
        shadowAnchor: [12, 41],  // the same for the shadow
        popupAnchor:  [0, -41] // point from which the popup should open relative to the iconAnchor
    });
    var marker = L.marker(location, {icon:icon}).bindPopup("<span data-nearby_distance='"+ element["nearby_distance"] + "' onclick='Show(\""+id+"\")'><strong>[ "+id+" ]</strong> "+ element["name"] +"</span>");
    marker.on('click', function (a) {
    });
    return [marker, color];
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


// Make a callback function for the select item
links.Tardis.prototype.onrangechanged = function (range) {
    console.log(links.Tardis.dateFormat(range.start) + " "+ links.Tardis.dateFormat(range.end));
};

links.Tardis.prototype.onselect = function(params) {
    var row = links.Tardis.prototype.getSelectedRow();

    if (row != undefined) {
        console.log(links.Tardis.prototype.data.getValue(row,2));
    }
    else {
        console.log("no item selected");
    }
};

links.Tardis.prototype.trigger = function (event) {

};