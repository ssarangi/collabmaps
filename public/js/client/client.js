var username = prompt("Please enter your name", "Jane Doe");
var socket = io();
socket.emit("user_connected", username);

$("#form").submit(function() {
    $("#messages").append($('<li>').text("You: " + $("#m").val()));
    socket.emit("chat_message", username + ": " + $("#m").val());
    $("#m").val('');
    return false;
});

var map = null;

var unique_id = 0;

///////////////////////////////// Helper methods for Map /////////////////////////
function draw_marker(map, id, lng, lat, title) {
    map.addSource(id, {
        "type": "geojson",
        "data": {
            "type": "Feature",
            "geometry": {
                    "type": "Point",
                    "coordinates": [lng, lat]
            },
            "properties": {
                "title": title,
                "marker-symbol": "monument"
            }
        }
    });
    
    map.addLayer({
        "id": id,
        "type": "symbol",
        "source": id,
        "layout": {
            "icon-image": "{marker-symbol}-15",
            "text-field": "{title}",
            "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
            "text-offset": [0, 0.6],
            "text-anchor": "top"
        }
    });
}

//////////////////////////////// Socket connections //////////////////////////////
socket.on('user_location', function(user_data) {
            var username = user_data["username"];
            var id = user_data["id"];
            var lng = user_data["lng"];
            var lat = user_data["lat"];
            draw_marker(map, id, lng, lat, username);
});

//////////////////////////////// Current Location ////////////////////////////////
var get_location = function() {
    var geolocation = null;
    var c_pos = null;

    if (window.navigator && window.navigator.geolocation) {
        geolocation = window.navigator.geolocation;

        var positionOptions = {
            enableHighAccuracy: true,
            timeout: 10 * 1000, // 10 seconds
            maximumAge: 30 * 1000 // 30 seconds
        };

        function success(position) {
            console.log(position);
            c_pos = position.coords;
            mapboxgl.accessToken = 'pk.eyJ1Ijoic3NhcmFuZ2kxMjMiLCJhIjoiY2ltOWpmeno4MDNwNHRubTZobW50Y2ljZiJ9.yidy_pQjADEQ8vD7j_m1hw';
            if (!mapboxgl.supported()) {
                alert('Your browser does not support Mapbox GL');
            } else {
                map = new mapboxgl.Map({
                    container: 'map', // container id
                    style: 'mapbox://styles/mapbox/streets-v8', //stylesheet location
                    center: [c_pos.longitude, c_pos.latitude], // starting position
                    zoom: 12 // starting zoom
                });
                
                map.on('click', function (e) {
                    var id = username + "_" + unique_id;
                    socket.emit("user_location", {"username": username, "id": id, "lng": e.lngLat["lng"], "lat": e.lngLat["lat"]});
                    draw_marker(map, id, e.lngLat["lng"], e.lngLat["lat"], username);
                    unique_id += 1;
                });
            }
        }

        function error(positionError) {
            console.log(positionError.message);
        }

        if (geolocation) {
            geolocation.getCurrentPosition(success, error, positionOptions);
        }

    } else {
        alert("Getting Geolocation is prevented on your browser");
    }

    return c_pos;
}


// socket.on('chat message', function(msg) {
//     var s = $("#text").val();
//     $("#text").val(msg);
// });

// socket.on('user_connected', function(user) {
//   $("#text").append($('<li style="background:red">').text(user + " joined the chat")); 
// });

////////////////////////////// Maps Portion //////////////////////////////////////
var current_pos = get_location();

// mapboxgl.accessToken = 'pk.eyJ1Ijoic3NhcmFuZ2kxMjMiLCJhIjoiY2ltOWpmeno4MDNwNHRubTZobW50Y2ljZiJ9.yidy_pQjADEQ8vD7j_m1hw';

// var map = new mapboxgl.Map({
//     container: 'map', // container id
//     style: 'mapbox://styles/mapbox/streets-v8', //stylesheet location
//     center: [-74.50, 40], // starting position
//     zoom: 9 // starting zoom
// });

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
                if (users[i] != null) {
                    sendMessage(users[i].name + " in chat");
                    draw_marker(map, users[i].id, users[i].lng, users[i].lat, users[i].name);
                }
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