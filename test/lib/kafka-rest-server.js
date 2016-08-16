// Copyright (c) 2015 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

'use strict';

var http = require('http');

function kafkaServer(listener) {
    var restProxyPort = 10000 + Math.floor(Math.random() * 20000);
    var restProxyServer = http.createServer(function(req, res) {
        var url = 'localhost:' + restProxyPort;
        var messages = {};
        messages[url] = ['rt-foobarx', 'rt-foobar', 'rt-foo'];
        if (req.method === 'GET') {
            res.end(JSON.stringify(messages));
        } else if (req.method === 'POST') {
            var body = '';
            req.on('data', function (data) {
                if (req.headers['content-type'] ===
                    'application/vnd.kafka.binary.batch.v1'
                ) {
                    data = data.slice(8, data.length);
                }

                body += data;
            });
            req.on('end', function () {
                var payload = JSON.parse(body);

                var parts = req.url.split('/');
                var record = {
                    topic: parts[2],
                    messages: [{
                        payload: payload
                    }]
                };

                listener(null, record);
            });
            res.end();
        }
    }).listen(restProxyPort);

    // allow process to exit with keep-alive sockets
    restProxyServer.on('connection', function (socket) {
        socket.unref();
    });

    restProxyServer.port = restProxyPort;

    return restProxyServer;
}

module.exports = kafkaServer;
