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
var path = require('path');
var os = require('os');
var uuid = require('uuid');
var fs = require('fs');
var dateFormat = require('date-format');
var rimraf = require('rimraf');

var captureStdio = require('./lib/capture-stdio.js');
var Logger = require('../logger.js');
var DiskBackend = require('../backends/disk.js');
var ConsoleBackend = require('../backends/console.js');

test('writes pid and host to backends', function (assert) {
    var loc = path.join(os.tmpDir(), uuid());
    var pid = process.pid;
    var host = os.hostname();

    var logger = Logger({
        meta: {
            team: 'rt',
            project: 'foobar',
            hostname: os.hostname(),
            pid: process.pid
        },
        backends: {
            disk: DiskBackend({
                folder: loc
            }),
            console: ConsoleBackend()
        }
    });

    assert.ok(captureStdio('_pid=' + pid, function () {
        logger.info('hello', { foo: 'bar' }, onlog);
    }));

    function onlog(err) {
        assert.ifError(err);

        assert.ok(captureStdio('_hostname=' + host, function () {
            logger.info('hello', { foo: 'bar' }, onlog2);
        }));
    }

    function onlog2(err) {
        assert.ifError(err);

        var fileUri = path.join(loc, 'rt-foobar.log-' +
            dateFormat('yyyyMMdd'));

        fs.readFile(fileUri, function (err, buf) {
            assert.ifError(err);

            buf = String(buf);

            assert.ok(buf.indexOf('hello') !== -1);
            assert.ok(buf.indexOf('foo=bar') !== -1);
            assert.ok(buf.indexOf('_pid=' + pid) !== -1);
            assert.ok(buf.indexOf('_hostname=' + host) !== -1);

            rimraf(loc, assert.end);
        });
    }
});
