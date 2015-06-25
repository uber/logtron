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
var Entry = require('../entry.js');

function AddFoo(baseMeta) {
    return addFoo;

    function addFoo(entry) {
        var meta = entry.meta || {};

        if (!meta._foo && baseMeta.foo) {
            meta._foo = baseMeta.foo;
        }

        return new Entry(entry.level, entry.message, entry.meta, entry.path);
    }
}

test('writes extended meta to backends', function (assert) {
    var loc = path.join(os.tmpDir(), uuid());
    var pid = process.pid;
    var foo = 'foop';
    var host = os.hostname();

    var logger = Logger({
        meta: {
            team: 'rt',
            project: 'foobar',
            hostname: os.hostname(),
            pid: process.pid,
            foo: foo
        },
        basemetaTransforms: [AddFoo],
        backends: {
            disk: DiskBackend({
                folder: loc
            }),
            console: ConsoleBackend()
        }
    });

    assert.ok(captureStdio('_foo=' + foo, function () {
        logger.info('hello', { foo: 'bar' }, onlog);
    }));

    function onlog(err) {
        assert.ifError(err);

        assert.ok(captureStdio('_hostname=' + host, function () {
            logger.meta.foo = 'bar';
            foo = 'bar';
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
            assert.ok(buf.indexOf('_foo=' + foo) !== -1);
            assert.ok(buf.indexOf('_hostname=' + host) !== -1);

            rimraf(loc, assert.end);
        });
    }
});
