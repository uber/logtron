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
