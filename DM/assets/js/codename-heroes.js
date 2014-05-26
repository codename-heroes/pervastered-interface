var SHADOW_Z_INDEX = 10;
var MARKER_Z_INDEX = 11;

var map, layer;   
var player_hash = {};
var username, password, host;
var servers = { "Development":"ec2-46-51-150-16.eu-west-1.compute.amazonaws.com:8777", "Main server": "ec2-46-51-150-16.eu-west-1.compute.amazonaws.com:8780"};
var webConsole;

// Get the size of an object
//
Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

function SignIn(){
	username = $("#username").val();
	password = $("#password").val();
	host = $("#server").val();

    var login = $("#logedIn-container");
    login.show();
    $("#signIn-container").addClass("animated bounceOut");

    InitMap();
    webConsole = new WebConsole(new MUDBinding(username, password, host));
};

function InitWebpage() {
	var select = $("#server");
	jQuery.each(servers, function(key, value) {
		select.append("<option value='"+value+"'>"+key+"</option>");
	});
};

function InitMap() 
{
	map = new OpenLayers.Map("mapdiv");
	map.addLayer(new OpenLayers.Layer.OSM());

    var styleMap = new OpenLayers.StyleMap({
        // Set the external graphic and background graphic images.
        externalGraphic: "img/marker-gold.png",
        backgroundGraphic: "img/marker_shadow.png",
        
        // Makes sure the background graphic is placed correctly relative
        // to the external graphic.
        backgroundXOffset: 0,
        backgroundYOffset: -7,
        
        // Set the z-indexes of both graphics to make sure the background
        // graphics stay in the background (shadows on top of markers looks
        // odd; let's not do that).
        graphicZIndex: MARKER_Z_INDEX,
        backgroundGraphicZIndex: SHADOW_Z_INDEX,
        
        pointRadius: 10,

		label: "${objid}\n\n"
    });
    
    layer = new OpenLayers.Layer.Vector('Points', {
        styleMap: styleMap
    });
	
    map.addLayer(layer);


	// set start centrepoint and zoom     
	var lonLat = new OpenLayers.LonLat(17.949785,59.404769) // Kista
		.transform(
			new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
			map.getProjectionObject() // to Spherical Mercator Projection
		);
	var zoom=12;
	map.setCenter(lonLat,zoom);  
}

function update_player(player,lng,lat) 
{
	console.log('[DEBUG]updating player: '+ player +' lng:'+ lng +' lat:'+ lat);

    layer.removeFeatures(layer.features);

    var latlng = new OpenLayers.Geometry.Point(lat,lng);
    var point = latlng.transform(
		new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
		map.getProjectionObject() // to Spherical Mercator Projection
	);
	
	var point_feature= new OpenLayers.Feature.Vector(point, null, null);
	point_feature.attributes= {
		objid: player
	};
	player_hash[player]= point_feature;
	
	var pointFeatures= [];
	
    for (key in player_hash) {
        if (player_hash.hasOwnProperty(key)) 
			pointFeatures.push(player_hash[key]);
    }

    layer.addFeatures(pointFeatures);
}

MUDBinding = function() {
    this.socket = io.connect(host);
    this.auth_key = undefined;
    this.message_types = ['moo', 'mcp'];
    this.receiver = MUDBinding.prototype.process_list_quests;

    var socket = this.socket,
        auth_key = this.auth_key;


    socket.on('debug',function(data) {
        console.log('[DEBUG]'+data);
    });

    socket.on('id',function(data) {
        console.log('[DEBUG]auth_key= '+data);
        auth_key = data;
    });

    socket.on('moo',funct n(data) {
        if (webConsole.console.receiver && data.indexOf("=>") == 0) {
            webConsole.console.receiver(data);
            webConsole.console.receiver = undefined;
        }
        console.log("[MOO] "+data);
        webConsole.receive('moo', data);
    });

    socket.on('mcp',function(data) {
        console.log('[MCP]'+ data);
        webConsole.receive('mcp', data);

        if ("mcp version: 2.1 to: 2.1 " == data) {
            socket.emit('mcp','mcp authentication-key: '+ auth_key +' version: 1.0 to: 2.1')
            socket.emit('mcp','mcp-negotiate-can '+ auth_key +' package: websocket-access min-version: 1.0 max-version: 1.0')
            socket.emit('mcp','mcp-negotiate-end '+ auth_key)
        }

        else if ("mcp send-connect" == data) {
            socket.emit('usrpwd', {usr: username, pwd: password});
        }

        // does data start with websocket-access...
        //
        else if (-1 != data.search(/^websocket-access-update_plyr_loc/)) {

            var tmparr= data.split(auth_key +' ');

            var tmpstr= tmparr[1];

            tmpstr= tmpstr.replace(/#[\d]*/,"\"$&\""); // replace #356 with "#356" (quotes)
            tmpstr= tmpstr.replace(/: /g,":");
            tmpstr= tmpstr.replace(/ /g,",");

            eval('var obj= {'+ tmpstr +'}');

            update_player(obj.player,obj.lng,obj.lat);
        }
    });
};

MUDBinding.prototype.send = function(content, receiver) {
    this.receiver = receiver;
    this.socket.emit('msg', content);
};

MUDBinding.prototype.receive = function() {

};

MUDBinding.prototype.execute = function(command) {
    switch (command) {
        case "ListQuests":
            this.send("; #297:list_quests()", this.process_list_quests);
            break;
        case "ListPlayers":
            break;
    };
};

MUDBinding.prototype.process_list_quests = function(response) {
   var response = this.to_JSON(response);

   return response;
};

MUDBinding.prototype.to_JSON = function(response) {
    var beginResult = response.indexOf("{");
    var endResult = response.lastIndexOf("}");
    var jsonResponse = response.substring(beginResult, endResult+1);
    jsonResponse = jsonResponse.replace(/{/g,'[').replace(/}/g,']');

    return JSON.parse(jsonResponse);
};


WebConsole = function(binding) {
    this.console = binding;
    this.console.receive = WebConsole.receive;
    this.consoleLog = $("#console-log");
    this.consoleDiv = $("#console");
    this.consoleMsg = $("#console-msg");
    this.consoleButton = $("#button-console");
    this.warningOptions = $("#options-warnings");
    this.warningDiv = $("#warnings-container");
    this.filterDiv = $("#console-filter");


    this.consoleMsg.keypress(function(event) {
        if (event.which == 13) { // enter
            webConsole.send('moo', $(this).val());
            event.preventDefault();
        }
    });

    for (var i in this.console.message_types) {
        var message_type = this.console.message_types[i];
        this.filterDiv.append(new WebConsoleFilter(message_type));
    }
};

WebConsole.prototype.send = function(message_type, message, receiver) {
    if (message_type == undefined) {
        message = this.consoleMsg.val();
    }

    this.console.send(message, receiver);
};

WebConsole.prototype.execute = function(command) {
    this.console.execute(command);
};


WebConsole.prototype.toggle = function() {
    var consoleDiv = this.consoleDiv,
        consoleButton = this.consoleButton;


    if (consoleDiv.hasClass("out")) {
        consoleDiv.toggleClass("bounceOutDown", false);
        consoleDiv.addClass("animated bounceInUp");
    } else {
        consoleDiv.toggleClass("bounceInUp", false);
        consoleDiv.addClass("animated bounceOutDown");
    }
    consoleButton.toggleClass("out");
    consoleDiv.toggleClass("out");
};

WebConsole.prototype.receive = function(message_type, message) {
    var style,
        warningOptions = this.warningOptions,
        warningDiv = this.warningDiv,
        consoleLog = this.consoleLog;

    if ($("#button-filter-"+message_type).hasClass("active")) {
        style = '';

        if (warningOptions.hasClass("active")) {
            var alertMsg = WebConsoleAlert(message_type, message);

            alertMsg.fadeIn("slow", function() {
                $(this).show(1000, function() {
                    $(this).fadeOut(2000, function() {
                        $(this).remove();
                    });
                });
            });
            warningDiv.prepend(alertMsg);
        }

    } else style = 'display:none';

    // TO-DO fix the class selection
    var classMessage = (message_type == 'moo'? 'info' : 'warning');

    consoleLog.append('<em class="'+ message_type +'-msg text-'+ classMessage +'" style="' + style + '"> [' + message_type + '] ' + message + "<br></em>");
    consoleLog.parent().animate({scrollTop:consoleLog.parent().height()});
};

WebConsoleAlert = function(message_type, message) {
    // TO-DO fix the class selection
    var classMessage = (message_type == 'moo'? 'info' : 'warning');
    return $("<div class='alert animated fadeIn alert-"+classMessage+"'><button type='button' class='close' data-dismiss='alert'>&times;</button> "+ message +"</div>");
};

WebConsoleFilter = function(message_type) {
    // TO-DO fix the class selection
    var classMessage = (message_type == 'moo'? 'info' : 'warning');

    return $('<button id="button-filter-'+message_type+'" class="btn active btn-'+ classMessage +'" onclick="$(this).toggleClass(\'active\');$(\'.'+message_type+'-msg\').toggle();">'+message_type+'</button>');
};

