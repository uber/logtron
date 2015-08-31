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

test('writing a buffer object (console)', function t(assert) {
    var logger = ConsoleLogger({
        raw: true
    });

    var meta = allocMeta();

    assert.ok(captureStdio(
        '{"someKey":"hi","some":{"nestedKey":"oh hi"},' +
            '"level":"info","message":"cool story"}',
        function log() {
            logger.info('cool story', meta, function cb(err) {
                assert.ifError(err);

                logger.destroy();
                assert.end();
            });
        }));
});

test('writing a buffer object (disk)', function t(assert) {
    var logger = FileLogger({
        json: true
    });

    var meta = allocMeta();

    logger.info('cool story', meta, function log(err) {
        assert.ifError(err);

        logger.readFile(function onFile(err2, buf) {
            assert.ifError(err2);

            assert.notEqual(
                buf.indexOf(
                    '{"someKey":"hi","some":{"nestedKey":"oh hi"},' +
                    '"level":"info","message":"cool story"'
                ),
                -1
            );

            logger.destroy();
            assert.end();
        });
    });
});

function allocMeta() {
    var meta = {};
    meta.someKey = 'hi';
    meta.some = {
        nestedKey: 'oh hi'
    };

    return meta;
}
