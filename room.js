var __ = require('underscore');

function Room(name) {
  this.name = name;
  this.users = [];
}

/*
 * Sends a message to all the users in a room. 
 */
Room.prototype.sendMessage = function sendMessage(message){
	__.each(this.users, function(user){
		user.socket.emit("message", message);
	});
}

/*
 * Sends a message to all the users in a room except the sender. 
 */
Room.prototype.sendMessageFiltered = function sendMessageFiltered(message, sender){
	__.each(this.users, function(user){
		if(sender != user){
			user.socket.emit("message", message);
		}
	});
}

module.exports = Room;