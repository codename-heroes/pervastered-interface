

function handler(req, res) {
	fs.readFile(__dirname + '/index.html',
	function(err, data) {
		if (err) {
			res.writeHead(500);
			return res.end('Error loading index.html');
		}

		res.writeHead(200);
		res.end(data);
	});
}


var app = require('http').createServer(handler)
	, io = require('socket.io').listen(app, { log: false })
	, fs = require('fs')
	, net = require('net')

app.listen(process.argv[2]);


var host = process.argv[3];
var port = process.argv[4];

var endl = '\r\n';


io.sockets.on('connection',function(proxySocket) {

	var mooSocket= new net.Socket({type:'tcp4'});
	mooSocket.setEncoding('utf8');
	var closed = false;

	// connection to MOO server
	//
	mooSocket.connect(port, host, function() { //'connect' listener
		proxySocket.emit('id',proxySocket.id);
	});

	mooSocket.on('data', function(data) {
		// cut off trailing endl
		var re = /\r\n$/;
		data= data.replace(re, "");

		var arr= String(data).split('\r\n');
		
		for (var i=0; i<arr.length; ++i)
		{
			if (-1 == arr[i].search(/^#\$#/))
				proxySocket.emit('moo',arr[i]);
			else
				proxySocket.emit('mcp',arr[i].substr(3));
		}
	});

	mooSocket.on('close', function(data) {
		console.log("CLOSE");
		ended = true;
		proxySocket.disconnect();
	});	
	
	// event handlers for proxySocket
	//
	proxySocket.on('usrpwd', function(data) {
		mooSocket.write('connect '+ data.usr +' '+ data.pwd + endl);
	});
	proxySocket.on('mcp', function(data) {
		mooSocket.write('#$#'+ data + endl);
	});
	
	proxySocket.on('msg', function(data) {
		mooSocket.write(data + endl);
	});
	
	proxySocket.on('disconnect', function() {
		console.log('disconnect' + ended);

		// currenly only supporting ONE simultaneous user
		// would need an array of mooSockets instead
		// We don't really need to close the moo socket. reconnect?
		//
		if (!ended) {
			mooSocket.end();
			mooSocket= new net.Socket({type:'tcp4'});
			mooSocket.setEncoding('utf8');
		}
	});
});
