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

var Logger = require('../logger.js');

test('returns error to callback', function (assert) {
    var logger = createLogger();

    logger.info('hello', {
        some: 'value'
    }, function (err) {
        assert.equal(err.message, 'write failed');
        assert.equal(err.errors[0].message, 'write failed');
        assert.equal(err.errors[0].streamName, 'disk');
        assert.equal(err.type, 'ValidationError');

        assert.end();
    });
});

test('error to emitter', function (assert) {
    var logger = createLogger();

    logger.on('error', function (err) {
        assert.equal(err.message, 'write failed');
        assert.equal(err.errors[0].message, 'write failed');
        assert.equal(err.errors[0].streamName, 'disk');
        assert.equal(err.type, 'ValidationError');

        assert.end();
    });

    logger.info('hello', {
        some: 'value'
    });
});

function createLogger() {
    return Logger({
        meta: {},
        backends: {
            disk: ErrorBackend()
        }
    });
}

function ErrorBackend() {
    return {
        createStream: function () {
            return {
                write: function (chunk, cb) {
                    cb(new Error('write failed'));
                },
                _writableState: {}
            };
        }
    };
}
