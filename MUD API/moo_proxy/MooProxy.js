var uuid = require('node-uuid'),
    net = require('net');


// ==================
// ==  Moo Proxy
// ==================
function MooProxy(host, port) {
	this.host = host;
	this.port = port;
	this.tokenToConnection = [];
	this.usernameToToken = [];
}

MooProxy.prototype = {
	get: function(id) {
		return  this.tokenToConnection[id] || nullMooProtocol;
	},
	logOut: function(response, id) {
		var element = this.get(id);

		element.delete(response);
		if (id in this.tokenToConnection) delete this.tokenToConnection[id];
	},
	openLogIn: function(response, token) {
		this.logIn(response, "Yojimbo", "yojimbo", token, undefined);
	},
	logIn: function(response, username, password, token, remember_token) {
		var usernameToToken = this.usernameToToken,
			token = token || usernameToToken[username+password] || uuid.v4(),
			tokenToConnection = this.tokenToConnection;

    	usernameToToken[username + password] = token;

	    var connection = tokenToConnection[token];
	    if (connection == undefined) {
	        connection = new MooProtocol(this.host, this.port, username, password, token);
	        tokenToConnection[token] = connection;
	    }
	    connection.keepAlive(response);
	},
	getUsers: function(response) {
		var result = [],
			tokenToSocket = this.tokenToConnection;

		for (var i in tokenToSocket) {
			if (tokenToSocket.hasOwnProperty(i)) {
				var connection = tokenToSocket[i];
				
				result.push({ user_id : i, email: connection.username});
			}
		}
	
		response.json({"users": result}, 201); 
	},
	sendPetition: function(request, response, petition, header) {
		var connection = this._getConnection(request);
    	connection.send(response, petition, header);
	},
	_getConnection: function(request) {
		var token = request.param("token");

    	return this.get(token);
	}

};

// ==================
// ==  EMPTY PROTOCOL
// ==================

var nullMooProtocol = new NullMooProtocol();

function NullMooProtocol() {
}

NullMooProtocol.prototype = {
	send: function (response, petition, header) {
		this._notAuth(response);
	},
	getUser: function(response, id) {
		this._notAuth(response);
	},
	delete: function(response) {
		this._notAuth(response);
	},
	keepAlive : function(response) {
		this._notAuth(response);
	},
	_notAuth: function(response) {
		response.json({"error": "User not authenticated"}, 401);
	}
};


// ==================
// ==  Moo PROTOCOL
// ==================

function MooProtocol(host, port, username, password, token) {
	this._mooSocket = undefined;
	this._host = host;
	this._port = port;
	this._token = token;
	this.username = username;
	this._password = password;
	this._pendingResponse = undefined;
}

function PendingResponse(response, data, header) {
    this.response = response;
    this.data = data;
	this.header = header;
}

MooProtocol.prototype = {
	keepAlive: function(response) {
		if (this._mooSocket == undefined) {
	        this._mooSocket = new net.Socket({type:'tcp4'});
	        mooSocket = this._mooSocket;

	        mooSocket.setEncoding('utf8');
			var that = this;

			mooSocket.on('data', function(data) { that.receive(data); });
	        mooSocket.on('close', function() { that.close(); });   
	        mooSocket.connect(this._port, this._host, function() { that.connect(); }); 
	        this._pendingResponse = new PendingResponse(response, undefined, "");

	        setTimeout(function() {
	            response.json({"error": "MUD not responding"}, 504);
	        }, 3000);
	    } else {
	       	response.json({
	       		user_id : this._token, 
	       		email: this.username, 
	       		"token" : this._token, 
	       		"remember_token" : this._token
	       	}, 201);
	    }
	},
	connect: function() {
		this._mooSocket.write('connect '+ this.username + ' '+ this._password + this._endl);
	},
	send: function(response, petition, header) {
	    this._pendingResponse = new PendingResponse(response, "", header);
	    this._mooSocket.write(petition + this._endl);
	},
	getUser: function(response, id) {
		response.json({user_id : id, "email" : this.username}, 201); 
	},
	receive: function(data) {
		var pendingResponse = this._pendingResponse,
			mooSocket = this._mooSocket,
			response = pendingResponse.response,
			token = this._token,
			endl = this._endl;

        if (data.indexOf("or has a different password.") != -1) {
            // WRONG USERNAME OR PASSWORD
            mooSocket.end();
            response.json({"error": "Wrong username and/or password"}, 401);
        } else if (data.indexOf("Last connected") != -1)  {
        	// CORRECT USERNAME
            response.cookie("token", token);
            response.json({ 
            	user_id : token, 
            	email: this.username, 
            	token : token, 
            	remember_token : token
            }, 201);
        } else if (pendingResponse != undefined && pendingResponse.data != undefined) {
            if (pendingResponse.data == "") {
                if (data.indexOf("=>") == 0) {
                    // CORRECT RESPONSE
                    pendingResponse.data += (data.substring("=> \"".length));
                } else {
                    // WRONG PETITION
                    pendingResponse.response.json({"error": "Wrong petition"}, 405);
                    this._pendingResponse = undefined;
                    return;
                }
            } else {
                pendingResponse.data += data;
            }
        }

        if (pendingResponse != undefined && pendingResponse.data != undefined && data.indexOf(endl) != -1) {
            var dataResponse = pendingResponse.data.replace(/\\\"/g, "\""),
				header = pendingResponse.header;
			
            dataResponse = dataResponse.substr(0, dataResponse.lastIndexOf("\""));
            pendingResponse.response.json(JSON.parse('{"'+header+'":'+dataResponse+'}'));
            this._pendingResponse = undefined;
        }
	},
	close: function() {
		this._mooSocket = undefined;
	},
	delete: function(response) {
        this._mooSocket.end();
        response.json({}, 202);
	},
	_endl: "\r\n",
};


module.exports = MooProxy;