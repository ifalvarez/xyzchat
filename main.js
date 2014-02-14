var io = require('socket.io').listen(7777);
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
	socket.send('Welcome to the XYZ chat server\n');
	socket.send('Login Name?\n');

	socket.on('message', function(msg) {
		onData(socket, msg);
	});

	socket.on('disconnect', function() {
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
			socket.send("Join a room first using /join or see a list of the active rooms with /rooms\n");
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
		socket.send('Sorry name taken\n');
		socket.send('Login name?\n');
	}else{
		user.nickname = nickname;
		user.status = READY;
		socket.send('Welcome ' + nickname + '!\n');
	}
}

/*
 * Executes a /xxx command
 */
function executeCommand(socket, command){
	var args = command.split(" ");
	switch(args[0]){
		case '/quit':
			if (socket.user.room){
				leaveRoom(socket.user);
			}
			socket.send('BYE\n');
			socket.emit('end');
			break;
		case '/rooms':
			socket.send('Active rooms are:\n');
			__.each(rooms, function (room){
				socket.send('* ' + room.name + ' (' + room.users.length + ')\n');
			});
			socket.send("end of list.\n");
			break;
		case '/join':
			if (args[1]) {
				joinRoom(args[1], socket.user);
			}else {
				socket.send("Specify a room to join. e.g: /join games\n");
			}
			break;
		case '/leave':
			leaveRoom(socket.user);
			break;
		default:
			socket.send('Unrecognized command\n');
	}
}

/*
 * Sends a message to all the users in a room. 
 */
function sendMessage(room, message){
	__.each(room.users, function(user){
		user.socket.send(message + '\n');
	});
}

/*
 * Sends a message to all the users in a room except the sender. 
 */
function sendMessageFiltered(room, message, sender){
	__.each(room.users, function(user){
		if(sender != user){
			user.socket.send(message + '\n');
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
	user.socket.send("entering room: " + roomName + '\n');
	__.each(user.room.users, function(iuser){
		user.socket.send("* " + iuser.nickname);
		if (iuser == user){
			user.socket.send(" (** this is you)");
		}
		user.socket.send("\n");
	});
	user.socket.send("end of list.\n");
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
	user.socket.send("* user has left " + room.name + ": " + user.nickname + " (** this is you)\n");
}

io.sockets.on('connection', newSocket);