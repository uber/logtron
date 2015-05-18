'use strict';

var test = require('tape');
var path = require('path');
var os = require('os');
var uuid = require('uuid');
var fs = require('fs');
var rimraf = require('rimraf');
var SentryServer = require(
    'sentry-logger/test/lib/sentry-server.js');
var KafkaServer = require(
    'kafka-logger/test/lib/kafka-server.js');

var defaultLevels = require('../default-levels.js');
var captureStdio = require('./lib/capture-stdio.js');
var Logger = require('../index.js');

test('Logger is a function', function t(assert) {
    assert.equal(typeof Logger, 'function');

    assert.end();
});

test('has defaultBackends method', function t(assert) {
    assert.equal(typeof Logger.defaultBackends, 'function');

    assert.end();
});

test('empty defaultBackends', function t(assert) {
    var backends = Logger.defaultBackends();

    assert.deepEqual(Object.keys(backends), [
        '_isDefaultBackends',
        'file',
        'disk',
        'kafka',
        'console',
        'sentry',
        'access'
    ]);
    assert.equal(backends._isDefaultBackends, true);
    assert.equal(backends.disk, null);
    assert.equal(backends.kafka, null);
    assert.equal(backends.console, null);
    assert.equal(backends.sentry, null);
    assert.equal(backends.access, null);

    assert.end();
});

test('logger without backends', function t(assert) {
    assert.throws(function throwIt() {
        Logger();
    }, /Must call Logger with opts argument/);

    assert.end();
});

test('console logging without defaultBackends', function t(assert) {
    var logger = Logger({
        meta: {},
        backends: {
            console: Logger.Console()
        }
    });

    assert.ok(logger);

    assert.ok(captureStdio('info: hello foo=bar', function log() {
        logger.info('hello', { foo: 'bar' });
    }));

    logger.destroy();
    assert.end();
});

test('console logging', function t(assert) {
    var logger = Logger({
        meta: {},
        backends: Logger.defaultBackends({
            console: true
        })
    });

    assert.ok(logger);

    assert.ok(captureStdio('info: hello foo=bar', function log() {
        logger.info('hello', { foo: 'bar' });
    }));

    logger.destroy();
    assert.end();
});

test('disk logging', function t(assert) {
    var loc = path.join(os.tmpDir(), uuid());

    var logger = Logger({
        meta: { team: 'rt', project: 'foo' },
        backends: Logger.defaultBackends({
            logFolder: loc
        })
    });

    var fileUri = 'rt-foo.log';

    logger.info('some message', {
        some: 'object'
    }, onLogged);

    function onLogged(err) {
        assert.ifError(err);

        fs.readdir(loc, onDir);
    }

    function onDir(err, files) {
        assert.ifError(err);

        assert.deepEqual(files, [fileUri]);

        fs.readFile(path.join(loc, fileUri), onFile);
    }

    function onFile(err, buf) {
        assert.ifError(err);

        buf = String(buf);
        assert.ok(buf.indexOf('some message') !== -1);
        assert.ok(buf.indexOf('some=object') !== -1);

        rimraf(loc, assert.end);
    }
});

test('access logging', function t(assert) {
    var loc = path.join(os.tmpDir(), uuid());

    var logger = Logger({
        meta: { team: 'rt', project: 'foo' },
        backends: Logger.defaultBackends({
            console: true,
            access: { logFolder: loc }
        })
    });

    assert.ok(captureStdio('info: hello foo=bar', function log() {
        logger.info('hello', { foo: 'bar' });
    }));

    assert.ok(captureStdio('access: line one fooOne=bar',
        function log() {
            logger.access('line one', { fooOne: 'bar' });
        }));

    var fileUri = 'rt-foo.log';

    assert.ok(captureStdio('access: line two', function log() {
        logger.access('line two', { fooTwo: 'bar'}, onLogged);
    }));

    function onLogged(err) {
        assert.ifError(err);

        fs.readdir(loc, onDir);
    }

    function onDir(err, files) {
        assert.ifError(err);

        assert.deepEqual(files, [fileUri]);

        fs.readFile(path.join(loc, fileUri), onFile);
    }

    function onFile(err, buf) {
        assert.ifError(err);

        buf = String(buf);
        assert.ok(buf.indexOf('access: line one') !== -1);
        assert.ok(buf.indexOf('fooOne=bar') !== -1);

        assert.ok(buf.indexOf('access: line two') !== -1);
        assert.ok(buf.indexOf('fooTwo=bar') !== -1);

        assert.ok(buf.indexOf('info: hello') === -1);
        assert.ok(buf.indexOf('foo=bar') === -1);

        rimraf(loc, assert.end);
    }
});

test('sentry logging', function t(assert) {
    var messages = [];
    var server = SentryServer(function listener(arg) {
        messages.push(arg);

        if (messages.length === 1) {
            onLogged();
        }
    });

    var logger = Logger({
        meta: {},
        backends: Logger.defaultBackends({
            sentry: { id: server.dsn }
        })
    });

    logger.info('hello');
    logger.error('sad');

    function onLogged() {
        assert.equal(messages.length, 1);
        var message = messages[0];

        assert.equal(message.message, 'default-backends.js: sad');
        assert.equal(typeof message.extra.stack, 'string');

        server.close();
        assert.end();
    }
});

test('kafka logging', function t(assert) {
    var messages = [];
    var server = KafkaServer(function listener(msg) {
        messages.push(msg);

        if (messages.length === 2) {
            onLogged();
        }
    });

    var logger = Logger({
        meta: {
            team: 'rt',
            project: 'foo'
        },
        backends: Logger.defaultBackends({
            kafka: {
                leafHost: 'localhost',
                leafPort: server.port
            }
        })
    });

    logger.info('hello', {});
    logger.info('hi', {});

    function onLogged() {
        var message = messages[0];

        assert.equal(message.topic, 'rt-foo');
        assert.equal(messages.length, 2);

        var payload = message.messages[0].payload;

        assert.equal(payload.level, 'info');
        assert.equal(payload.msg, 'hello');

        logger.destroy();
        server.close();
        assert.end();
    }
});

test('default levels have not been altered', function t(assert) {
    assert.ok(!('transforms' in defaultLevels.trace));
    assert.end();
});
