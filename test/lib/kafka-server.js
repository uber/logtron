'use strict';

var parseMessage = require('./kafka-message.js');

module.exports = KafkaServer;

function KafkaServer(listener) {
    var net = require('net');

    var server = net.createServer();
    server.on('connection', onConnection);
    var PORT = 10000 + Math.floor(Math.random() * 20000);

    server.listen(PORT);
    server.port = PORT;

    return server;

    function onConnection(socket) {
        socket.on('data', onMessage);

        function onMessage(buf) {
            var messages = parseMessage(buf);

            messages.forEach(listener);
        }
    }
}
