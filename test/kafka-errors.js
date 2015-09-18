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

var KafkaLogger = require('./lib/kafka-logger.js');

test('can .error("message", new Error())', function (assert) {
    var logger = KafkaLogger(function (err, msg) {
        assert.ifError(err, 'no unexpected server error');
        var obj = msg.messages[0].payload;

        assert.notEqual(obj.msg.indexOf('hello'), -1);
        assert.notEqual(
            obj.fields.stack.indexOf('Error: lulz'), -1);
        assert.equal(obj.fields.message, 'lulz');

        logger.destroy();
        assert.end();
    });

    logger.error('hello', new Error('lulz'));
});

test('can error("message", { error: Error() })', function (assert) {
    var logger = KafkaLogger(function (err, msg) {
        assert.ifError(err, 'no unexpected server error');
        var obj = msg.messages[0].payload;

        assert.notEqual(obj.msg.indexOf('some message'), -1);
        assert.notEqual(
            obj.fields.error.stack.indexOf('Error: some error'), -1);
        assert.equal(obj.fields.error.message, 'some error');
        assert.equal(obj.fields.other, 'key');

        logger.destroy();
        assert.end();
    });

    logger.error('some message', {
        error: new Error('some error'),
        other: 'key'
    });
});

test('can error(msg, { someKey: Error() })', function (assert) {
    var logger = KafkaLogger(function (err, msg) {
        assert.ifError(err, 'no unexpected server error');
        var obj = msg.messages[0].payload;

        assert.notEqual(obj.msg.indexOf('some message'), -1);
        assert.notEqual(
            obj.fields.someKey.stack.indexOf('Error: some error'), -1);
        assert.equal(obj.fields.someKey.message, 'some error');
        assert.equal(obj.fields.other, 'key');

        logger.destroy();
        assert.end();
    });

    logger.error('some message', {
        someKey: new Error('some error'),
        other: 'key'
    });
});
