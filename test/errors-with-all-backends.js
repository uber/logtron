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

var captureStdio = require('./lib/capture-stdio.js');
var FatLogger = require('./lib/fat-logger.js');

test('can error(message, { err: err })', function t(assert) {
    var kafkaMessages = [];
    var sentryMessages = [];
    var logger = FatLogger({
        raw: true,
        json: true,
        kafkaListener: kafkaListener,
        sentryListener: sentryListener
    });

    var streams = logger._streamsByLevel.error;
    assert.ok(streams[3].name === 'sentry');
    // insert sentry as the first stream
    streams.unshift(streams.pop());
    assert.ok(streams[0].name === 'sentry');

    var consoleBuf = captureStdio(null, function logError() {
        logger.error('some message', {
            err: new Error('hello'),
            other: 'key'
        }, function delay() {
            // delay by 1000ms for sentry
            setTimeout(onLogged, 1000);
        });
    }, {
        raw: true
    });

    function onLogged() {
        assert.equal(consoleBuf.length, 1);
        var consoleObj = JSON.parse(consoleBuf[0]);

        // console.log('consoleObj', consoleObj);

        assert.ok(consoleObj.err);
        assert.ok(consoleObj.err.stack);
        assert.equal(consoleObj.err.message, 'hello');
        assert.equal(consoleObj.other, 'key');
        assert.equal(consoleObj.message, 'some message');


        assert.equal(kafkaMessages.length, 1);
        var payload = kafkaMessages[0].messages[0].payload;

        // console.log('p', payload);

        assert.ok(payload.fields.err);
        assert.ok(payload.fields.err.stack);
        assert.equal(payload.fields.err.message, 'hello');
        assert.equal(payload.fields.other, 'key');
        assert.equal(payload.msg, 'some message');

        assert.equal(sentryMessages.length, 1);
        var sentryMsg = sentryMessages[0];

        // console.log('what.', sentryMsg);

        assert.equal(sentryMsg.extra.other, 'key');
        assert.equal(sentryMsg.extra.originalMessage,
            'some message');
        assert.equal(sentryMsg.message,
            'Error: errors-with-all-backends.js: hello');
        var stackTrace = sentryMsg['sentry.interfaces.Stacktrace'];
        assert.ok(stackTrace.frames.length);

        logger.readFile(function onFile(err, file) {
            assert.ifError(err);

            var lines = file.split('\n')
                .filter(Boolean)
                .map(JSON.parse);

            assert.equal(lines.length, 1);
            var diskObj = lines[0];

            assert.ok(diskObj.err);
            assert.ok(diskObj.err.stack);
            assert.equal(diskObj.err.message, 'hello');
            assert.equal(diskObj.other, 'key');
            assert.equal(diskObj.message, 'some message');

            logger.destroy();
            assert.end();
        });
    }

    function kafkaListener(err, msg) {
        assert.ifError(err, 'no unexpected server error');
        kafkaMessages.push(msg);
    }

    function sentryListener(msg) {
        sentryMessages.push(msg);
    }
});

test('does no crash when error is not configurable', function t(assert) {
    var kafkaMessages = [];
    var sentryMessages = [];
    var logger = FatLogger({
        raw: true,
        json: true,
        kafkaListener: kafkaListener,
        sentryListener: sentryListener
    });

    var error = new Error('hello');
    Object.seal(error);

    assert.doesNotThrow(function log() {
        logger.error('some message', {
            err: error,
        }, function delay() {
            // delay by 100ms for sentry
            setTimeout(onLogged, 100);
        });
    });

    function onLogged() {
        logger.destroy();
        assert.end();
    }

    function kafkaListener(err, msg) {
        assert.ifError(err, 'no unexpected server error');
        kafkaMessages.push(msg);
    }

    function sentryListener(msg) {
        sentryMessages.push(msg);
    }
});
