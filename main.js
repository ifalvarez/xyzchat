var net = require('net');
var __ = require('underscore');
 
var users = [];
var rooms = [];

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
		if (user.room){
			sendMessage(user.room, user.nickname + ": " + data );
		}else{
			socket.write("Join a room first using /join or see a list of the active rooms with /rooms\n");
		}		
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
		user.status = READY;
		socket.write('Welcome ' + nickname + '!\n');
	}
}

/*
 * Executes a /xxx command
 */
function executeCommand(socket, command){
	var args = command.split(" ");
	switch(args[0]){
		case '/quit':
			socket.end('BYE\n');
			break;
		case '/rooms':
			socket.write('Active rooms are:\n');
			__.each(rooms, function (room){
				socket.write('* ' + room.name + ' (' + room.users.length + ')\n');
			});
			socket.write("end of list.\n");
			break;
		case '/join':
			if (args[1]) {
				joinRoom(args[1], socket.user);
			}else {
				socket.write("Specify a room to join. e.g: /join games\n");
			}
			break;
		case '/leave':
			leaveRoom(socket.user);
			break;
		default:
			socket.write('Unrecognized command\n');
	}
}

/*
 * Sends a message to all the users in a room. 
 */
function sendMessage(room, message){
	__.each(room.users, function(user){
		user.socket.write(message + '\n');
	});
}

/*
 * Sends a message to all the users in a room except the sender. 
 */
function sendMessageFiltered(room, message, sender){
	__.each(room.users, function(user){
		if(sender != user){
			user.socket.write(message + '\n');
		}
	});
}

/*
 * Add the user to a chat room
 */
function joinRoom(roomName, user){
	var room = __.find(rooms, function (iroom){return iroom.name == roomName;});
	if(!room){
		room = {name: roomName, users:[]};
		rooms.push(room);
	}
	user.room = room;
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
	sendMessageFiltered(room, "* new user joined " + roomName + ": " + user.nickname, user);
}

/*
 * Remove the user from a chat room
 */
function leaveRoom(user){
	var room = user.room;
	room.users.splice(room.users.indexOf(user), 1);
	if (room.users.length == 0){
		rooms.splice(rooms.indexOf(room), 1);
	}
	user.room = null;
	sendMessageFiltered(room, "* user has left " + room.name + ": " + user.nickname);
	user.socket.write("* user has left " + room.name + ": " + user.nickname + " (** this is you)\n");
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
server.listen(80);