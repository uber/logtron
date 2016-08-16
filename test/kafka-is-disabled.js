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
var KafkaServer = require(
    './lib/kafka-rest-server.js');

var Logger = require('../index.js');

test('kafka is disabled', function (assert) {
    var server = KafkaServer(function onMessage(err, msg) {
        assert.ifError(err, 'no unexpected server error');
        server.emit('message', msg);
    });

    var isDisabledFlag = false;
    var logger = Logger({
        meta: {
            team: 'rt',
            project: 'foobar'
        },
        backends: Logger.defaultBackends({
            kafka: {
                proxyHost: 'localhost',
                proxyPort: server.port
            }
        }, {
            isKafkaDisabled: function isDisabled() {
                return isDisabledFlag;
            }
        })
    });

    logger.info('writing to kafka');
    server.once('message', function (msg) {
        assert.ok(msg);

        isDisabledFlag = true;
        logger.info('writing to kafka', {});
        server.on('message', failure);

        setTimeout(function onTimeout() {
            isDisabledFlag = false;
            server.removeListener('message', failure);

            logger.info('writing to kafka', {});
            server.once('message', function (msg) {
                assert.ok(msg);

                logger.destroy();
                server.close();
                assert.end();
            });
        }, 1000);

        function failure(msg) {
            assert.ok(false, 'unexpected message');
        }
    });
});
