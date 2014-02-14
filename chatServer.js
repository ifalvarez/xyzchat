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
	console.log("new webSocket client");
	var user = {socket: socket, status: GETTING_NICKNAME, nickname: "Guest"};
	users.push(user);
	socket.user = user;
	socket.send('Welcome to the XYZ chat server');
	socket.send('Login Name?');

	socket.on('message', function(msg) {
		onData(socket, msg);
	});

	socket.on('disconnect', function() {
		console.log("--------------Disconnect");
		if (socket.user){
			quitChat(socket.user);
		}
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
			socket.send("Join a room first using /join or see a list of the active rooms with /rooms");
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
		socket.send('Sorry name taken');
		socket.send('Login name?');
	}else{
		user.nickname = nickname;
		user.status = READY;
		socket.send('Welcome ' + nickname + '!');
	}
}

/*
 * Executes a /xxx command
 */
function executeCommand(socket, command){
	var args = command.split(" ");
	switch(args[0]){
		// Quit the chat server
		case '/quit':
			quitChat(socket.user);
			break;

		// Lists the active rooms in the chat
		case '/rooms':
			socket.send('Active rooms are:');
			__.each(rooms, function (room){
				socket.send('* ' + room.name + ' (' + room.users.length + ')');
			});
			socket.send("end of list.");
			break;

		// Join a chat room
		case '/join':
			if (args[1]) {
				joinRoom(args[1], socket.user);
			}else {
				socket.send("Specify a room to join. e.g: /join games");
			}
			break;

		// Leave a chat room
		case '/leave':
			leaveRoom(socket.user);
			break;

		// Send a private message
		case '/w':
			if (args[1] && args[2]) {
				sendPrivateMessage(socket.user, args[1], args.slice(2).join(" "));
			}else {
				socket.send("Specify a user and a message. e.g: /w Ivan hi man!");
			}
			break;

		// Unrecognized command	
		default:
			socket.send('Unrecognized command');
	}
}

/*
 * Sends a message to all the users in a room. 
 */
function sendMessage(room, message){
	__.each(room.users, function(user){
		user.socket.send(message);
	});
}

/*
 * Sends a message to all the users in a room except the sender. 
 */
function sendMessageFiltered(room, message, sender){
	__.each(room.users, function(user){
		if(sender != user){
			user.socket.send(message);
		}
	});
}

/*
 * Sends a message to a single user. 
 */
function sendPrivateMessage(sender, targetNickname, message){
	var user = __.find(users, function(iuser){
		return targetNickname == iuser.nickname;
	});
	if (user){
		user.socket.send("private from " + sender.nickname + ": " + message);
		sender.socket.send("private to " + user.nickname + ": " + message);
	}else{
		sender.socket.send("User " + targetNickname + " not found.");
	}
	
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
	user.socket.send("entering room: " + roomName + '');
	__.each(user.room.users, function(iuser){
		var imsg = "* " + iuser.nickname;
		if (iuser == user){
			imsg = imsg + " (** this is you)";
		}
		user.socket.send(imsg);
	});
	user.socket.send("end of list.");
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
	user.socket.send("* user has left " + room.name + ": " + user.nickname + " (** this is you)");
}

/*
 * Quit chat
 */
function quitChat(user){
	console.log("--------------QuitChat: "+ user.nickname);
	if (user.room){
		leaveRoom(user);
	}
	user.socket.send('BYE');
	user.socket.emit('end');
	delete user.socket.user;
	users.splice(users.indexOf(user), 1);
	user.socket.disconnect();
	delete user.socket;
}


io.sockets.on('connection', newSocket);