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
