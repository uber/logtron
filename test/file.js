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

var path = require('path');
var os = require('os');
var fs = require('fs');
var uuid = require('uuid');
var test = require('tape');
var dateFormat = require('date-format');
var rimraf = require('rimraf');

var captureStdio = require('./lib/capture-stdio.js');
var Logger = require('../logger.js');
var DiskBackend = require('../backends/disk.js');
var FileBackend = require('../backends/file.js');
var ConsoleBackend = require('../backends/console.js');

test('disk logging', function (assert) {
    var loc = path.join(os.tmpDir(), uuid());

    var logger = Logger({
        meta: {
            team: 'rt',
            project: 'foobar'
        },
        backends: {
            disk: DiskBackend({
                folder: loc
            })
        }
    });

    assert.ok(logger);
    assert.equal(typeof logger.info, 'function');

    logger.info('some message', {
        some: 'object'
    }, function (err) {
        assert.ifError(err);

        var fileUri = 'rt-foobar.log-' +
            dateFormat('yyyyMMdd');

        fs.readdir(loc, function (err, files) {
            assert.ifError(err);

            assert.deepEqual(files, [fileUri]);

            fs.readFile(path.join(loc, fileUri), function (err, buf) {
                assert.ifError(err);

                buf = String(buf);
                assert.ok(buf.indexOf('some message') !== -1);
                assert.ok(buf.indexOf('some=object') !== -1);

                rimraf(loc, assert.end);
            });
        });
    });
});

test('file logging', function (assert) {
    var loc = path.join(os.tmpDir(), uuid());

    var logger = Logger({
        meta: {
            team: 'rt',
            project: 'foobar'
        },
        backends: {
            file: FileBackend({
                fileName: path.join(loc, 'rt-foobar.log')
            })
        }
    });

    assert.ok(logger);
    assert.equal(typeof logger.info, 'function');

    logger.info('some message', {
        some: 'object'
    }, function (err) {
        assert.ifError(err);

        var fileUri = 'rt-foobar.log';

        fs.readdir(loc, function (err, files) {
            assert.ifError(err);

            assert.deepEqual(files, [fileUri]);

            fs.readFile(path.join(loc, fileUri), function (err, buf) {
                assert.ifError(err);

                var entry = JSON.parse(buf);
                assert.equal(entry.message, 'some message');
                assert.equal(entry.some, 'object');

                rimraf(loc, assert.end);
            });
        });
    });
});


test('works with multiple backends', function (assert) {
    var loc = path.join(os.tmpDir(), uuid());

    var logger = Logger({
        meta: {
            team: 'rt',
            project: 'foobar'
        },
        backends: {
            disk: DiskBackend({
                folder: loc
            }),
            console: ConsoleBackend()
        }
    });

    assert.ok(captureStdio('info: hello foo=bar', function () {
        logger.info('hello', { foo: 'bar' }, onlog);
    }));

    function onlog(err) {
        assert.ifError(err);

        var fileUri = path.join(loc, 'rt-foobar.log-' +
            dateFormat('yyyyMMdd'));

        fs.readFile(fileUri, function (err, buf) {
            assert.ifError(err);

            buf = String(buf);

            assert.ok(buf.indexOf('hello') !== -1);
            assert.ok(buf.indexOf('foo=bar') !== -1);

            rimraf(loc, assert.end);
        });
    }
});
