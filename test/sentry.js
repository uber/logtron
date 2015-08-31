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
var zlib = require('zlib');
var body = require('body');

var Logger = require('../logger.js');
var SentryBackend = require('../backends/sentry.js');

test('sentry logging', function (assert) {
    var PORT = 20000 + Math.round(Math.random() * 10000);
    var dsn = 'http://public:private@localhost:' + PORT + '/269';

    var server = http.createServer(function (req, res) {
        body(req, res, function (err, body) {
            assert.equal(req.method, 'POST');
            assert.equal(req.url, '/api/269/store/');
            assert.ok(req.headers['x-sentry-auth']);
            assert.ok(body.length > 0);

            var buf = new Buffer(body, 'base64');
            zlib.inflate(buf, function (err, str) {
                var json = JSON.parse(String(str));

                assert.equal(json.message, 'sentry.js: oh hi');
                server.close();
                res.end();
                assert.end();
            });
        });
    });
    server.listen(PORT);

    var logger = Logger({
        backends: {
            sentry: SentryBackend({ dsn: dsn })
        },
        meta: {}
    });

    assert.ok(logger);

    logger.error('oh hi');
});
