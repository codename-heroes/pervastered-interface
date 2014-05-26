// ========================
//  Codename : Heroes API 
//          v0.2
// ========================
var portAPI = 8090;


// ========================
//  Server initialization
// ========================
var host = 'ec2-46-51-150-16.eu-west-1.compute.amazonaws.com';
    port = 7777;

// modules
var express = require('express'),
	params = require('express-params'),
    WebSocketServer = require('ws').Server,
    http = require('http'),
    wampio = require('wamp.io'),
    MooProxy = require('./moo_proxy/MooProxy.js');

// app configuration
var app = express();
    params.extend(app);
    proxy = new MooProxy(host, port);

app.configure(function () {
    app.set('port', portAPI);
    app.use(express.bodyParser());
	app.use(express.cookieParser());
	
    // We allow cross domain petitions
	app.all('*', function(req, res, next) {
	  res.header('Access-Control-Allow-Origin', req.headers.origin || "*");
	  res.header('Access-Control-Allow-Credentials', "true");
	  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,HEAD,DELETE,OPTIONS');
	  res.header('Access-Control-Allow-Headers', 'content-Type,x-requested-with');
	  next();
	});
});



// ========================
//  Utils
// ========================

function fixId(id) {
    if (id.indexOf("#") != 0) {
        id = "#" + id;
    }
    
    return id;
}

// ========================
//  Auth
// ========================

app.options("/auth", function (request, response) {
	response.send("Pervastered API\n", { "Allow": "POST, DELETE", "Content-Type": "text/plain"}, 200);
});

app.get("/auth2", function(request, response) {
	var token = request.param("token");

    proxy.openLogIn(response, token);
});

app.post('/auth', function (request, response) {
	var username = request.body.email,
	   password = request.body.password,
       remember_token = request.body.remember_token,
	   token = request.body.token;

    proxy.logIn(response, username, password, token, remember_token);
});

app.delete('/auth', function (request, response) {
    var token = request.param("token");

    proxy.logOut(response, token);
});


// ========================
//  Users
// ========================

app.get('/users/:id', function (request, response) {
    var id = request.params.id,
		token = request.param("token"),
        connection = proxy.get(token);

	connection.getUser(response, id);
});

app.get('/users', function (request, response) {
    var token = request.param("token");

    proxy.getUsers(response);
});

// ========================
//  Players
// ========================

app.get('/players', function (request, response) {
	proxy.sendPetition(request, response, "; $hero_utils:list_users(1)", "players");
});

app.get('/players/:id', function (request, response) {
    var id = fixId(request.params.id);
    proxy.sendPetition(request, response, "; $hero_utils:user_info(" + id + ",1)", "player");
});

app.options('/players', function (request, response) {
	response.send("Pervastered API\n", { "Allow": "GET, OPTIONS", "Content-Type": "text/plain"}, 200);
});

// ========================
//  Quests
// ========================

app.get('/quests', function (request, response) {
    proxy.sendPetition(request, response, "; $hero_utils:list_quests()", "quests");
});

app.get('/quests/:id', function (request, response) {
    var id = fixId(request.params.id);
    proxy.sendPetition(request, response, "; $hero_utils:quest_info(" + id + ",1)", "quest");
});

app.options('/quests', function (request, response) {
    response.send("Pervastered API\n", { "Allow": "GET, OPTIONS", "Content-Type": "text/plain"}, 200);
});

// ========================
//  Rituals
// ========================

app.get('/rituals', function (request, response) {
    proxy.sendPetition(request, response, "; $hero_utils:list_rituals(1)", "rituals");
});

app.get('/rituals/:id', function (request, response) {
    var id = fixId(request.params.id);
    proxy.sendPetition(request, response, "; $hero_utils:ritual_info(" + id + ",1)", "ritual");
});

app.options('/rituals', function (request, response) {
    response.send("Pervastered API\n", { "Allow": "GET, OPTIONS", "Content-Type": "text/plain"}, 200);
});

// ========================
//  Messages
// ========================


app.get('/messages', function (request, response) {
    proxy.sendPetition(request, response, "; $hero_utils:list_messages(1)", "messages");
});

app.get('/messages/:id', function (request, response) {
    var id = fixId(request.params.id);
    proxy.sendPetition(request, response, "; $hero_utils:message_info(" + id + ",1)", "message");
});

app.options('/messages', function (request, response) {
    response.send("Pervastered API\n", { "Allow": "GET, OPTIONS", "Content-Type": "text/plain"}, 200);
});


// ========================
//  Server execution
// ========================
//app.listen(portAPI); //to port on which the express server listen
var server = http.createServer(app);
var wss = new WebSocketServer({server: server});
var wamp = wampio.attach(wss);


server.listen(app.get('port'), function() {
    console.log("Express server listening on port " + app.get('port'));
});