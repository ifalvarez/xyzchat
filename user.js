
//User statuses
var READY = 1;
var GETTING_NICKNAME = 2;

function User(socket) {
  this.socket = socket;
  this.status = GETTING_NICKNAME;
  this.nickname = "Guest"; 
  this.room = null;
}

User.prototype.fooBar = function() {

};

Object.defineProperty(User, "READY", {
  enumerable: false,
  configurable: false,
  writable: false,
  value: READY
});

Object.defineProperty(User, "GETTING_NICKNAME", {
  enumerable: false,
  configurable: false,
  writable: false,
  value: GETTING_NICKNAME
});

module.exports = User;