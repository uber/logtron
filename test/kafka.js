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

var test = require('tape');

var http = require('http');
var KafkaServer = require('./lib/kafka-rest-server.js');

var Logger = require('../logger.js');
var KafkaBackend = require('../backends/kafka.js');

test('kafka logging', function (assert) {
    var logger;
    var server = KafkaServer(function onMessage(err, msg) {
        assert.ifError(err, 'no unexpected server error');

        assert.equal(msg.topic, 'rt-foobar');

        var obj = msg.messages[0].payload;

        assert.equal(obj.level, 'info');
        assert.ok(obj.msg.indexOf('writing to kafka') !== -1);

        server.close();
        logger.destroy();
        assert.end();
    });

    logger = Logger({
        meta: {
            team: 'rt',
            project: 'foobar'
        },
        backends: {
            kafka: KafkaBackend({
                proxyHost: 'localhost',
                proxyPort: server.port
            })
        }
    });

    logger.info('writing to kafka');
});

test('kafka logging with rest client', function(assert) {
    var count = 0;
    var restProxyPort = 10000 + Math.floor(Math.random() * 20000);
    var restProxyServer = http.createServer(function(req, res) {
        var url = 'localhost:' + restProxyPort;
        var messages = {};
        messages[url] = ['rt-foobarx'];
        if (req.method === 'GET') {
            res.end(JSON.stringify(messages));
        } else if (req.method === 'POST') {
            assert.ok(req.headers.timestamp);
            assert.equal(req.url, '/topics/rt-foobarx');
            var body = '';
            req.on('data', function (data) {
                body += data;
            });
            req.on('end', function () {
                assert.ok(body.indexOf('info') !== -1);
                assert.ok(body.indexOf('writing to kafka') !== -1);
            });
            count++;
            res.end();

            setTimeout(shutdown, 200);
        }
    }).listen(restProxyPort);
    // allow process to exit with keep-alive sockets
    restProxyServer.on('connection', function (socket) {
        socket.unref();
    });

    var logger = Logger({
        meta: {
            team: 'rt',
            project: 'foobarx'
        },
        backends: {
            kafka: KafkaBackend({
                proxyHost: 'localhost',
                proxyPort: restProxyPort,
                maxRetries: 3
            })
        }
    });

    setTimeout(function() {
        // wait for rest client init.
        logger.info('writing to kafka');
    }, 1000);

    function shutdown() {
        logger.close(function closed(err) {
            assert.ifError(err, 'no unexpected close error');
            assert.ok(true, 'logger closed');
        });
        setTimeout(function finish() {
            // wait for rest client to flush.
            assert.equal(count, 1);
            restProxyServer.close();
            logger.destroy();
            assert.end();
        }, 1000);
    }
});

test('logger -> close', function (assert) {
    var server = KafkaServer(function onMessage(err, msg) {
        assert.ifError(err, 'no unexpected server error');

        assert.equal(msg.topic, 'rt-foobar');

        var obj = msg.messages[0].payload;

        assert.equal(obj.level, 'info');
        assert.ok(obj.msg.indexOf('writing to kafka') !== -1);
    });

    var logger = Logger({
        meta: {
            team: 'rt',
            project: 'foobar'
        },
        backends: {
            kafka: KafkaBackend({
                proxyHost: 'localhost',
                proxyPort: server.port,
                maxRetries: 3
            })
        }
    });

    logger.info('writing to kafka'); // warmup
    setTimeout(runit, 100);

    function runit() {
        // for real
        logger.info('writing to kafka');
        logger.close(function closed(err) {
            assert.ifError(err, 'no unexpected close error');
            assert.ok(true, 'logger closed');
            finish();
        });
    }

    function finish() {
        server.close();
        logger.destroy();
        assert.end();
    }
});
