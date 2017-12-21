// Copyright (c) 2017 Uber Technologies, Inc.
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
var SentryServer = require('sentry-logger/test/lib/sentry-server.js');

var captureStdio = require('./lib/capture-stdio.js');
var Logger = require('../index.js');

test('transformed level affects choice of streams', function t(assert) {
    var server = SentryServer(function listener(arg) {
        assert.equal(
            arg.message,
            'level-transform.js: error',
            'only "error" logged to sentry'
        );
        server.close();
        assert.end();
    });

    var logger = Logger({
        meta: {},
        backends: Logger.defaultBackends({
            console: true,
            sentry: { id: server.dsn }
        }),
        transforms: [levelTransformer]
    });

    assert.ok(captureStdio('info: info', function log() {
        logger.error('info');
    }), '"info" error logged at info level');
    assert.ok(captureStdio('error: error', function log() {
        logger.error('error');
    }), '"error" error logged at error level');

    function levelTransformer(entry) {
        entry.level = entry.message;
        return entry;
    }
});
