var io = require('socket.io').listen(7777);
var __ = require('underscore');
var util = require('util');
var User = require('./user.js');
var Room = require('./room.js');

 
var users = [];
var rooms = [];

 
/*
 * Callback called when a new user connets to a socket.
 */
function newSocket(socket) {
	var user = new User(socket);
	users.push(user);
	socket.user = user;
	socket.emit("message", {message: 'Welcome to the XYZ chat server\nLogin Name?'});

	socket.on('message', function(msg) {
		onData(socket, msg);
	});

	socket.on('disconnect', function() {
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
	if (user.status == User.GETTING_NICKNAME){
		assignNickname(socket, data);
	} 
	// if a command is given
	else if(data[0] === '/'){
		executeCommand(socket, data);
	} 
	// else send text to the room
	else{
		if (user.room){
			user.room.sendMessage({message: data, sender: user.nickname} );
		}else{
			socket.emit("message", {message: "Join a room first using /join or see a list of the active rooms with /rooms"});
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
		socket.emit("message", {message: 'Sorry name taken\nLogin name?'});
	}else{
		user.nickname = nickname;
		user.status = User.READY;
		socket.emit("message", {message: 'Welcome ' + nickname + '!'});
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
			var toSend = "Active rooms are:\n";
			__.each(rooms, function (room){
				toSend = toSend + '* ' + room.name + ' (' + room.users.length + ')\n';
			});
			toSend = toSend + "end of list.";
			socket.emit("message", {message: toSend});
			break;

		// Join a chat room
		case '/join':
			if (args[1]) {
				joinRoom(args[1], socket.user);
			}else {
				socket.emit("message", {message: "Specify a room to join. e.g: /join games"});
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
				socket.emit("message", {message: "Specify a user and a message. e.g: /w Ivan hi man!"});
			}
			break;

		// Unrecognized command	
		default:
			socket.emit("message", {message: 'Unrecognized command'});
	}
}

/*
 * Sends a message to a single user. 
 */
function sendPrivateMessage(sender, targetNickname, message){
	var user = __.find(users, function(iuser){
		return targetNickname == iuser.nickname;
	});
	if (user){
		user.socket.emit("message", {message: message, sender: sender.nickname, isPrivate: true});
		sender.socket.emit("message", {message: "private to " + user.nickname + ": " + message});
	}else{
		sender.socket.emit("message", {message: "User " + targetNickname + " not found."});
	}
	
}

/*
 * Add the user to a chat room
 */
function joinRoom(roomName, user){
	if (user.room){
		leaveRoom(user);
	}
	var room = __.find(rooms, function (iroom){return iroom.name == roomName;});
	if(!room){
		room = new Room(roomName);
		rooms.push(room);
	}
	user.room = room;
	user.room.users.push(user);
	var toSend = "";
	toSend = toSend + "entering room: " + roomName + '\n';
	__.each(user.room.users, function(iuser){
		toSend = toSend + "* " + iuser.nickname;
		if (iuser == user){
			toSend = toSend + " (** this is you)\n";
		}else{
			toSend = toSend + "\n";
		}
	});
	toSend = toSend + "end of list.";
	user.socket.emit("message", {message: toSend});
	room.sendMessageFiltered({message: "* new user joined " + roomName + ": " + user.nickname}, user);
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
	room.sendMessageFiltered({message: "* user has left " + room.name + ": " + user.nickname});
	user.socket.emit("message", {message: "* user has left " + room.name + ": " + user.nickname + " (** this is you)"});
}

/*
 * Quit chat
 */
function quitChat(user){
	console.log("--------------QuitChat: "+ user.nickname);
	if (user.room){
		leaveRoom(user);
	}
	user.socket.emit("message", {message: 'BYE'});
	user.socket.emit('end');
	delete user.socket.user;
	users.splice(users.indexOf(user), 1);
	user.socket.disconnect();
	delete user.socket;
}


io.sockets.on('connection', newSocket);