var express = require('express');
var app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server);

server.listen(8090);

// routing
app.get('/', function (req, res) {
  res.sendfile('index.html', function(){
  	console.log("Error serving index.html");
  });
});

app.use(express.static('public'));