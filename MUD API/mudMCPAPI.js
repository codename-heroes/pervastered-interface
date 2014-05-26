function Connection() {
    this.username = undefined;
    this.password = undefined;
    this.socket = undefined;
    this.token = undefined;
}

function PendingResponse(response, data, header) {
    this.response = response;
    this.data = data;
	this.header = header;
}

var CODENAME_HEROES_RPC = "#$#codename-heroes-rpc ";

/**
 * API
 */
var express = require('express'),
	params = require('express-params'),
	uuid = require('node-uuid'),
	io = require('socket.io-client'),
    sleep = require('sleep'),
    net = require('net');
var app = express();
params.extend(app);
var usernameToToken = [];
var tokenToSocket = [];
var pendingResponses = [];
var host = "localhost";//'ec2-46-51-150-16.eu-west-1.compute.amazonaws.com'
var port = 7778;// for Victor server
var endl = "\r\n";
app.configure(function () {
    app.use(express.bodyParser());
	app.use(express.cookieParser());
	
	app.all('*', function(req, res, next) {
	  res.header('Access-Control-Allow-Origin', req.headers.origin || "*");
	  res.header('Access-Control-Allow-Credentials', "true");
	  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,HEAD,DELETE,OPTIONS');
	  res.header('Access-Control-Allow-Headers', 'content-Type,x-requested-with');
	  next();
	 });
});


function CheckConnection(response, connection) {
    if (connection.socket == undefined) {
        var mooSocket= new net.Socket({type:'tcp4'});
        mooSocket.setEncoding('utf8');
        connection.socket = mooSocket;
		connection.auth_key = new Date().getTime();

        mooSocket.connect(port, host, function(){
           mooSocket.write('connect '+ connection.username +' '+ connection.password + endl);
		});
		
        mooSocket.on('data', function(data) {
            var pendingResponse = pendingResponses[connection.token];
			if (data.indexOf("mcp version: 2.1 to: 2.1 ") != -1) {
				mooSocket.write('#$#mcp authentication-key: '+ connection.auth_key +' version: 1.0 to: 2.1' + endl);
				mooSocket.write('#$#mcp-negotiate-can '+ connection.auth_key +' package: codename-heroes min-version: 1.0 max-version: 1.0' + endl);
				mooSocket.write('#$#mcp-negotiate-end '+ connection.auth_key + endl);
			}
			
            if (data.indexOf("or has a different password.") != -1) {
                // WRONG USERNAME OR PASSWORD
                mooSocket.end();
                response.json({"error": "Wrong username and/or password"}, 401);
            } else if (data.indexOf("Last connected") != -1)  {
                response.cookie("token",connection.token);
                response.json({ user_id : connection.token, email: connection.username ,token : connection.token, remember_token : connection.token}, 201);
            } else if (pendingResponse != undefined) {
                if (pendingResponse.data == "") {
                    if (data.indexOf("=>") == 0) {
                        // CORRECT RESPONSE
                        pendingResponse.data += (data.substring("=> \"".length));
                    } else {
                        // WRONG PETITION
                        pendingResponse.response.json({"error": data}, 405);
                        pendingResponses[connection.token] = undefined;
                        return;
                    } 
                } else {
		    pendingResponse.data += data;
                }
            }

            if (pendingResponse != undefined && data.indexOf(endl) != -1) {
                var dataResponse = pendingResponse.data.replace(/\\\"/g, "\"");
		var header = pendingResponse.header;	

                dataResponse = dataResponse.substr(0, dataResponse.lastIndexOf("\""));
                pendingResponse.response.json(JSON.parse('{"'+header+'":'+dataResponse+'}'));
                pendingResponses[connection.token] = undefined;
            }
        });

        mooSocket.on('close', function() {
			if (connection) {
				var conn = tokenToSocket[connection.token];
				if (conn) conn.socket = undefined;
			}
        });

        setTimeout(function() {
            response.json({"error":"MUD not responding"}, 504);
        }, 3000);
    } else {
        return true;
    }
}

app.options("/auth", function (request, response) {
	response.send("Pervastered API\n", { "Allow": "POST, DELETE", "Content-Type": "text/plain"}, 200);
});

app.get("/auth2", function(request, response) {
	var token = request.param("token");
	
	if (tokenToSocket[token] == undefined) {
		var connection = new Connection();
        connection.username = "Yojimbo";
        connection.password = "yojimbo";
        connection.token = token;
		
		tokenToSocket[token] = connection;
	}
	
	
	if (CheckConnection(response, tokenToSocket[token])) {
		response.json({"token" : token}, 201);
	}
});

app.get("/test", function(request, response) {
   var result = [];
   var i;
   for(i in tokenToSocket) {
      var obj = {};
      obj.username = tokenToSocket[i].username;
      obj.token = tokenToSocket[i].token;
      result.push(obj);
   }

   response.json({"connected": result}, 201);
});
app.post('/auth', function (request, response) {
	var username = request.body.email;
	var password = request.body.password;
	
	var token;
	if (username == undefined) {
		token = request.body.remember_token;
	} else {
		token = usernameToToken[username+password];
	}
	
	if (token == undefined) {
		token = uuid.v4();
        usernameToToken[username+password] = token;
	}

    var connection = tokenToSocket[token];
    if (connection == undefined) {
        connection = new Connection();
        connection.username = username;
        connection.password = password;
        connection.token = token;
        tokenToSocket[token] = connection;
    }

    if (CheckConnection(response, connection)) {
		response.json({user_id : token, email: connection.username, "token" : token, "remember_token" : token}, 201);
    }
});

app.delete('/auth', function (request, response) {
    var token = request.param("token");
    if (token != undefined) {
        var connection = tokenToSocket[token];
        if (connection != undefined) {
            connection.socket.end();
            tokenToSocket[token] = undefined;
            response.json({}, 202);
        }
    }

    response.json({"error": "User not previously authenticated"}, 401);
});


function GetConnection(request) {
    var token = request.param("token");
    if (token != undefined) {
        return tokenToSocket[token];
    }
    return undefined;
}

function SendPetition(request, response, petition, header) {
    var connection = GetConnection(request);
    
    if (connection == undefined) {
         response.json({"error": "User not authenticated"}, 401);
         return;
    }
    pendingResponses[connection.token] = new PendingResponse(response, "", header);
    connection.socket.write(petition + endl);
}

function SendMCPPetition(request, response, petition, header) {
	var connection = GetConnection(request);
    
    if (connection == undefined) {
         response.json({"error": "User not authenticated"}, 401);
         return;
    }
    pendingResponses[connection.token] = new PendingResponse(response, "", header);
	var timeStamp = new Date().getTime();	
	var mudRPCCall = CODENAME_HEROES_RPC + connection.auth_key + " ts: " +  timeStamp + " command: \"" + petition +"\"";
	connection.socket.write(mudRPCCall + endl);
}

app.get('/users/:id', function (request, response) {
    var id = request.params.id,
		connection = tokenToSocket[id],
		token = request.param("token");
		
	if (connection) {
		response.json({user_id : id, "email" : connection.username}, 201); 
	} else {
		response.json({"error": "User not authenticated"}, 401);
	}
});

app.get('/users', function (request, response) {
    var token = request.param("token"),
		connection = tokenToSocket[token];
		
	if (connection) {
		var result = [];
		for (var i in tokenToSocket) {
			if (tokenToSocket.hasOwnProperty(i)) {
				var connection = tokenToSocket[i];
				
				result.push({user_id : i, email: connection.username});
			}
		}
	
		response.json({"users": result}, 201); 
	} else {
		response.json({"error": "User not authenticated"}, 401);
	}
});

/**
 * HTTP GET /tasks
 * Returns: the list of tasks in JSON format
 */
app.get('/players', function (request, response) {
	SendPetition(request, response, "; $hero_utils:list_users(1)", "players");
});
/**
 * HTTP GET /players/:id
 * Param: :id is the unique identifier of the player you want to retrieve
 * Returns: the player with the specified :id in a JSON format
 * Error: 404 HTTP code if the player doesn't exists
 */
app.get('/players/:id', function (request, response) {
    var id = fixId(request.params.id);
    SendPetition(request, response, "; $hero_utils:user_info("+ id +",1)", "player");
});

app.options('/players', function (request, response) {
	response.send("Pervastered API\n", { "Allow": "GET, OPTIONS", "Content-Type": "text/plain"}, 200);
});



/**
 * HTTP GET /players/:id
 * Param: :id is the unique identifier of the player you want to retrieve
 * Returns: the player with the specified :id in a JSON format
 * Error: 404 HTTP code if the player doesn't exists
 */
app.get('/quests', function (request, response) {
    SendPetition(request, response, "; $hero_utils:list_quests()", "quests");
});

/**
 * HTTP GET /players/:id
 * Param: :id is the unique identifier of the player you want to retrieve
 * Returns: the player with the specified :id in a JSON format
 * Error: 404 HTTP code if the player doesn't exists
 */
app.get('/quests/:id', function (request, response) {
    var id = fixId(request.params.id);
    SendPetition(request, response, "; $hero_utils:quest_info("+ id +",1)", "quest");
});
/**
 * HTTP GET /players/:id
 * Param: :id is the unique identifier of the player you want to retrieve
 * Returns: the player with the specified :id in a JSON format
 * Error: 404 HTTP code if the player doesn't exists
 */
app.get('/rituals', function (request, response) {
    SendPetition(request, response, "; $hero_utils:list_rituals(1)", "rituals");
});

/**
 * HTTP GET /players/:id
 * Param: :id is the unique identifier of the player you want to retrieve
 * Returns: the player with the specified :id in a JSON format
 * Error: 404 HTTP code if the player doesn't exists
 */
app.get('/rituals/:id/invoke', function (request, response) {
    var id = fixId(request.params.id);
    SendPetition(request, response, "; $hero_utils:ritual_invoke(" + id + ")", ""); 
});

/**
 * HTTP GET /players/:id
 * Param: :id is the unique identifier of the player you want to retrieve 
 * Returns: the player with the specified :id in a JSON format
 * Error: 404 HTTP code if the player doesn't exists
 */
app.get('/rituals/:id', function (request, response) {
    var id = fixId(request.params.id);
    SendPetition(request, response, "; $hero_utils:ritual_info("+ id +",1)", "ritual");
});

/**
 * HTTP GET /players/:id
 * Param: :id is the unique identifier of the player you want to retrieve
 * Returns: the player with the specified :id in a JSON format
 * Error: 404 HTTP code if the player doesn't exists
 */
app.get('/messages', function (request, response) {
    SendPetition(request, response, "; $hero_utils:list_messages(1)", "messages");
});

/**
 * HTTP GET /players/:id
 * Param: :id is the unique identifier of the player you want to retrieve
 * Returns: the player with the specified :id in a JSON format
 * Error: 404 HTTP code if the player doesn't exists
 */
app.get('/messages/:id', function (request, response) {
    var id = fixId(request.params.id);
    SendPetition(request, response, "; $hero_utils:message_info("+ id +",1)", "message");
});

app.get('/mcp/test', function (request, response) {
    SendMCPPetition(request, response, "test", "RPCcall");
});

function fixId(id) {
	if (id.indexOf("#") != 0) {
		id = "#" + id;
	}
	
	return id;
}

app.listen(8092); //to port on which the express server listen
