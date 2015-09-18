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

var Buffer = require('buffer').Buffer;
var test = require('tape');

var captureStdio = require('./lib/capture-stdio.js');
var ConsoleLogger = require('./lib/console-logger.js');
var FileLogger = require('./lib/file-logger.js');
var SentryLogger = require('./lib/sentry-logger.js');
var KafkaLogger = require('./lib/kafka-logger.js');

test('writing a buffer object (console)', function t(assert) {
    var logger = ConsoleLogger();

    var meta = allocBufferMeta();

    assert.ok(captureStdio('info: cool story buf=b2ggaGk', function log() {
        logger.info('cool story', meta, function cb(err) {
            assert.ifError(err);

            logger.destroy();
            assert.end();
        });
    }));
});

test('writing a buffer object (disk)', function t(assert) {
    var logger = FileLogger();

    var meta = allocBufferMeta();

    logger.info('cool story', meta, function log(err) {
        assert.ifError(err);

        logger.readFile(function onFile(err, buf) {
            assert.ifError(err);

            assert.ok(buf.indexOf('info: cool story buf=b2ggaGk') !== -1);

            logger.destroy();
            assert.end();
        });
    });
});

test('writing a buffer object (sentry)', function t(assert) {
    var messages = [];
    var logger = SentryLogger(function listener(msg) {
        messages.push(msg);

        if (messages.length === 1) {
            onLogged();
        }
    });

    var meta = allocBufferMeta();

    logger.error('cool story', meta);

    function onLogged() {
        var msg = messages[0];

        assert.ok(msg.message.indexOf('cool story') !== -1);

        logger.destroy();
        assert.end();
    }
});

test('writing a buffer object (kafka)', function t(assert) {
    var messages = [];
    var logger = KafkaLogger(function listener(err, msg) {
        assert.ifError(err, 'no unexpected server error');
        messages.push(msg);

        if (messages.length === 1) {
            onLogged();
        }
    });

    var meta = allocBufferMeta();

    logger.info('cool story', meta);

    function onLogged() {
        var msg = messages[0];

        var payload = msg.messages[0].payload;

        assert.ok(payload.msg.indexOf('cool story') !== -1);

        logger.destroy();
        assert.end();
    }
});

function allocBufferMeta() {
    var meta = {};
    meta.buf = new Buffer('oh hi');
    meta.ohWhat = {
        someBuf: new Buffer('oh wat')
    };

    return meta;
}
