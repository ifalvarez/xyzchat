var net = require('net');
var io = require('socket.io-client');

/*
 * Callback called when a new user connets to a socket.
 */
function newSocket(socket) {
	console.log("new telnet client");
	socket.webSocket = io.connect('http://localhost:7777', {'force new connection': true});
	socket.on('data', function(data) {
		data = cleanInput(data);
		socket.webSocket.send(data);
	});

	socket.webSocket.on('message', function(data) {
		var toWrite = "";
		if (data.isPrivate) {
			toWrite = toWrite + "Private from ";
		}
		if (data.sender) {
			toWrite = toWrite + data.sender + ": ";
		}
		toWrite = toWrite + data.message + "\n";
		socket.write(toWrite);
	});
	socket.webSocket.on('end', function(msg) {
		socket.end();
	});
}

/*
 * Cleans the input of carriage return, newline
 */
function cleanInput(data) {
	return data.toString().replace(/(\r\n|\n|\r)/gm,"").trim();
}

// Create a new server and provide a callback for when a connection occurs
var server = net.createServer(newSocket);
 
// Listen on port
server.listen(9399);