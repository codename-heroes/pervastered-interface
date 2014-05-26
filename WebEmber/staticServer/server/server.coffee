# DEPENDENCIES
# ============
express = require "express"
http = require "http"
port = process.env.PORT || 8001
server = module.exports = express()

# SERVER CONFIGURATION
# ====================
server.configure ->
	server.use express["static"] __dirname + '/../../'

	server.use express.errorHandler 
		dumpExceptions: true
		showStack: true

	server.use express.bodyParser()
	server.use server.router

	return


# SERVER
# ======

# Start Node.js server
http.createServer(server).listen port
console.log ("started server on", port)