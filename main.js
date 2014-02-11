var net = require('net');
var __ = require('underscore');
 
var users = [];
var rooms = [{name: 'default', users: []}];

//User statuses
var READY = 1;
var GETTING_NICKNAME = 2;
 
/*
 * Callback called when a new user connets to a socket.
 */
function newSocket(socket) {
	var user = {socket: socket, status: GETTING_NICKNAME, nickname: "Guest"};
	users.push(user);
	socket.user = user;
	socket.write('Welcome to the XYZ chat server\n');
	socket.write('Login Name?\n');

	socket.on('data', function(data) {
		data = cleanInput(data);
		onData(socket, data);
	});

	socket.on('end', function() {
		var user = socket.user;
		delete user.socket;
		delete socket.user;
		users.splice(users.indexOf(user), 1);
	});
}

/*
 * Callback called when data is received from a socket
 */
function onData(socket, data) {
	var user = socket.user;

	// if getting nickname
	if (user.status == GETTING_NICKNAME){
		assignNickname(socket, data);
	} 
	// if a command is given
	else if(data[0] === '/'){
		executeCommand(socket, data);
	} 
	// else send text to the room
	else{
		sendMessage(user.room, user.nickname + ": " + data );
	}
	
}

/*
 * Checks if a nickname is used. Assign it if its not, asks again if it is.
 */
function assignNickname(socket, nickname){
	var user = socket.user;
	var isNameUsed = __.reduce(users, function (memo, iuser){
		return memo || iuser.nickname == nickname;
	}, false);
	if(isNameUsed){
		socket.write('Sorry name taken\n');
		socket.write('Login name?\n');
	}else{
		user.nickname = nickname;
		joinRoom('default', user);
		user.status = READY;
		socket.write('Welcome ' + nickname + '!\n');
	}
}

/*
 * Executes a /xxx command
 */
function executeCommand(socket, command){
	switch(command){
		case '/quit':
			socket.end('BYE\n');
			break;
		case '/rooms':
			socket.write('Active rooms are:\n');
			__.each(rooms, function (room){
				socket.write('* ' + room.name + ' (' + room.users.length + ')');
			});
			break;
		default:
			socket.write('Unrecognized command\n');
	}
}

/*
 * Sends a message to all the users in a room
 */
function sendMessage(room, message){
	__.each(room.users, function(user){
		user.socket.write(message + '\n');
	});
}

/*
 * Add the user to a chat room
 */
function joinRoom(roomName, user){
	if(!rooms[roomName]){
		rooms[roomName] = {name: roomName, users:[]};
	}
	user.room = rooms[roomName];
	user.room.users.push(user);
	user.socket.write("entering room: " + roomName + '\n');
	__.each(user.room.users, function(iuser){
		user.socket.write("* " + iuser.nickname);
		if (iuser == user){
			user.socket.write(" (** this is you)");
		}
		user.socket.write("\n");
	});
	user.socket.write("end of list.\n");
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