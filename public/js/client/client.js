var username = prompt("Please enter your name", "Jane Doe");
var socket = io();
socket.emit("user_connected", username);

$("#form").submit(function() {
    $("#messages").append($('<li>').text("You: " + $("#m").val()));
    socket.emit("chat_message", username + ": " + $("#m").val());
    $("#m").val('');
    return false;
});

// socket.on('chat message', function(msg) {
//     var s = $("#text").val();
//     $("#text").val(msg);
// });

// socket.on('user_connected', function(user) {
//   $("#text").append($('<li style="background:red">').text(user + " joined the chat")); 
// });

////////////////////////////// Maps Portion //////////////////////////////////////

mapboxgl.accessToken = 'pk.eyJ1Ijoic3NhcmFuZ2kxMjMiLCJhIjoiY2ltOWpmeno4MDNwNHRubTZobW50Y2ljZiJ9.yidy_pQjADEQ8vD7j_m1hw';

var map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/mapbox/streets-v8', //stylesheet location
    center: [-74.50, 40], // starting position
    zoom: 9 // starting zoom
});

//////////////////////////// Chat Check ///////////////////////////////////////////
(function () {
    var Message;
    Message = function (arg) {
        this.text = arg.text, this.message_side = arg.message_side;
        this.draw = function (_this) {
            return function () {
                var $message;
                $message = $($('.message_template').clone().html());
                $message.addClass(_this.message_side).find('.text').html(_this.text);
                $('.messages').append($message);
                return setTimeout(function () {
                    return $message.addClass('appeared');
                }, 0);
            };
        }(this);
        return this;
    };
    
    $(function () {
        var getMessageText, message_side, sendMessage;
        message_side = 'right';
        
        getMessageText = function () {
            var $message_input;
            $message_input = $('.message_input');
            return $message_input.val();
        };
        
        sendMessage = function (text) {
            var $messages, message;
            if (text.trim() === '') {
                return;
            }
            
            $('.message_input').val('');
            $messages = $('.messages');
            message_side = message_side === 'left' ? 'right' : 'left';
            message = new Message({
                text: text,
                message_side: message_side
            });
            message.draw();
            return $messages.animate({ scrollTop: $messages.prop('scrollHeight') }, 300);
        };
        
        $('.send_message').click(function (e) {
            var text = getMessageText();
            socket.emit("chat_message", username + ": " + text);
            return sendMessage(text);
        });
        
        $('.message_input').keyup(function (e) {
            if (e.which === 13) {
                var text = getMessageText();
                socket.emit("chat_message", username + ": " + text);
                return sendMessage(text);
            }
        });
        
        socket.on('chat message', function(msg) {
            sendMessage(msg);
        });
        
        socket.on('user_connected', function(user) {
            sendMessage(user + " joined the chat");
        });
        
        socket.on('user_disconnected', function(user) {
            sendMessage(user + " disconnected from chat"); 
        });
        
        socket.on('current_users', function(users) {
            for (var i = 0; i < users.length; i++) {
                sendMessage(users[i] + " in chat");
            }
        });
        
        // sendMessage('Hello Philip! :)');
        
        // setTimeout(function () {
        //     return sendMessage('Hi Sandy! How are you?');
        // }, 1000);
        
        // return setTimeout(function () {
        //     return sendMessage('I\'m fine, thank you!');
        // }, 2000);
    });
}.call(this));