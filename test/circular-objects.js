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

var test = require('tape');

var captureStdio = require('./lib/capture-stdio.js');
var ConsoleLogger = require('./lib/console-logger.js');
var FileLogger = require('./lib/file-logger.js');
var SentryLogger = require('./lib/sentry-logger.js');
var KafkaLogger = require('./lib/kafka-logger.js');

test('writing a circular object (console)', function t(assert) {
    var logger = ConsoleLogger();

    var circular = allocCircularLol();

    assert.ok(captureStdio('info: cool story', function log() {
        logger.info('cool story', circular, function (err) {
            assert.ifError(err);

            logger.destroy();
            assert.end();
        });
    }));
});

test('writing a circular object (disk)', function t(assert) {
    var logger = FileLogger();

    var circular = allocCircularLol();

    logger.info('cool story', circular, function log(err) {
        assert.ifError(err);

        logger.readFile(function (err, buf) {
            assert.ifError(err);

            assert.ok(buf.indexOf('info: cool story') !== -1);

            logger.destroy();
            assert.end();
        });
    });
});

test('writing a circular object (sentry)', function t(assert) {
    var messages = [];
    var logger = SentryLogger(function listener(msg) {
        messages.push(msg);

        if (messages.length === 1) {
            onLogged();
        }
    });

    var circular = allocCircularLol();

    logger.error('cool story', circular);

    function onLogged() {
        var msg = messages[0];

        assert.ok(msg.message.indexOf('cool story') !== -1);

        logger.destroy();
        assert.end();
    }
});

test('writing a circular object (kafka)', function t(assert) {
    var messages = [];
    var logger = KafkaLogger(function listener(err, msg) {
        assert.ifError(err, 'no unexpected server error');
        messages.push(msg);

        if (messages.length === 1) {
            onLogged();
        }
    });

    var circular = allocCircularLol();

    logger.info('cool story', circular);

    function onLogged() {
        var msg = messages[0];

        var payload = msg.messages[0].payload;

        assert.ok(payload.msg.indexOf('cool story') !== -1);

        logger.destroy();
        assert.end();
    }
});

function allocCircularLol() {
    var circular = {};
    circular.lol = 'lol';
    circular.circular = circular;
    circular.pwnt = {};
    circular.pwnt.circular = circular;

    return circular;
}
