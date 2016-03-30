var express = require('express');
var app  = express();
var http = require('http').Server(app);
var io   = require('socket.io')(http); 

var port = process.env.PORT || 8080;
var ip = process.env.IP || "127.0.0.1";

app.use(express.static('public'));

app.get('/', function(req, res) {
    res.sendFile(__dirname + "/html/index.html");
});

io.on('connection', function(socket) {
    console.log('a user connected');
    
    socket.on('disconnect', function() {
        console.log('user disconnected');
    });
    
    socket.on('user_connected', function(username) {
        socket.broadcast.emit('user_connected', username);
    })
    
    socket.on('chat_message', function(msg) {
       socket.broadcast.emit('chat message', msg);
    });
})

http.listen(port, ip, function() {
    console.log("listening on " + ip + ":" + port);
});