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
var test = require('tape');
var KafkaServer = require(
    'kafka-logger/test/lib/kafka-server.js');

var Logger = require('../logger.js');
var KafkaBackend = require('../backends/kafka.js');

test('kafka logging', function (assert) {
    var server = KafkaServer(function onMessage(msg) {
        assert.equal(msg.topic, 'rt-foobar');

        var obj = msg.messages[0].payload;

        assert.equal(obj.level, 'info');
        assert.ok(obj.msg.indexOf('writing to kafka') !== -1);

        server.close();
        logger.destroy();
        assert.end();
    });

    var logger = Logger({
        meta: {
            team: 'rt',
            project: 'foobar'
        },
        backends: {
            kafka: KafkaBackend({
                leafHost: 'localhost',
                leafPort: server.port
            })
        }
    });

    logger.info('writing to kafka');
});
