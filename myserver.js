var oracledb = require('oracledb');
var websockets = require('socket.io'); // Use WebSockets
var http = require('http'); // Basic HTTP functionality
var path = require('path'); // Parse directory paths
var express = require('express'); // Provide static routing to pages
var port = 8080;
var app = setupExpress();

listen(function(socket)
{
// A new user has connected
// Use the socket to communicate with them
socket.on('query1', function()
{
  oracledb.getConnection(
    {
      user          : "kdalvi",
      password      : "DBMSsp17",
      connectString : "oracle.cise.ufl.edu/orcl"
    },
    function(err, connection)
    {
      if (err) {
        console.error(err.message);
        return;
      }
      connection.execute(
        "SELECT name, city " +
          "FROM branch " +
          "WHERE 2=2",
          {}, //no binds
        function(err, result)
        {
          if (err) {
            console.error(err.message);
            doRelease(connection);
            return;
          }
          console.log('Success');
          socket.emit('data_query1',result);
          doRelease(connection);
        });
    });
});
}, function(socket, notification) {});

// ------------------ ------------------------------------------------------------
function setupExpress()
{
	// HTML files located here
	var viewsDir = path.join(__dirname, 'views');
	// JS/CSS support located here
	// This becomes the root directory used by the HTML files
	var publicDir = path.join(__dirname, 'public');

	var app = express();
	app.use(express.static(publicDir));

	// Get the index page (only option)
	app.get('/', function(req, res)
	{
		res.sendFile('views/index.html', { root: '.' });
	});

	// Handle any misc errors by redirecting to a simple page and logging
	app.use(function(err, req, res, next)
	{
		console.log(err.stack);
		res.status(err.status || 500);

		res.sendFile('/views/error.html', { root: '.' });
	});

	return app;
}

// ------------------------------------------------------------------------------

function listen(user_callback, mbed_callback)
{
	// Prepare to keep track of all connected users and sockets
	var sockets = [];
	var server = http.Server(app);
	var io = websockets(server);

	// A new user has connected
	io.on('connection', function(socket)
	{
		// Track them
		sockets.push(socket);
		// Call the function you specified
		user_callback(socket);
	});

	// Begin waiting for connections
	server.listen(port, function()
	{
		// Use long polling, else all responses are async
	});
}

//---------------------------------------------------------------------

function doRelease(connection)
{
  connection.close(
    function(err) {
      if (err)
        console.error(err.message);
    });
}
