'use strict';

var test = require('tape');

var captureStdio = require('./lib/capture-stdio.js');
var ConsoleLogger = require('./lib/console-logger.js');
var FileLogger = require('./lib/file-logger.js');
var SentryLogger = require('./lib/sentry-logger.js');
var KafkaLogger = require('./lib/kafka-logger.js');

test('writing a circular object (console)', function t(assert) {
    var logger = ConsoleLogger();

    var circular = allocCircularLol();

    assert.ok(captureStdio('info: cool story', function log() {
        logger.info('cool story', circular, function (err) {
            assert.ifError(err);

            logger.destroy();
            assert.end();
        });
    }));
});

test('writing a circular object (disk)', function t(assert) {
    var logger = FileLogger();

    var circular = allocCircularLol();

    logger.info('cool story', circular, function log(err) {
        assert.ifError(err);

        logger.readFile(function (err, buf) {
            assert.ifError(err);

            assert.ok(buf.indexOf('info: cool story') !== -1);

            logger.destroy();
            assert.end();
        });
    });
});

test('writing a circular object (sentry)', function t(assert) {
    var messages = [];
    var logger = SentryLogger(function listener(msg) {
        messages.push(msg);

        if (messages.length === 1) {
            onLogged();
        }
    });

    var circular = allocCircularLol();

    logger.error('cool story', circular);

    function onLogged() {
        var msg = messages[0];

        assert.ok(msg.message.indexOf('cool story') !== -1);

        logger.destroy();
        assert.end();
    }
});

test('writing a circular object (kafka)', function t(assert) {
    var messages = [];
    var logger = KafkaLogger(function listener(msg) {
        messages.push(msg);

        if (messages.length === 1) {
            onLogged();
        }
    });

    var circular = allocCircularLol();

    logger.info('cool story', circular);

    function onLogged() {
        var msg = messages[0];

        var payload = msg.messages[0].payload;

        assert.ok(payload.msg.indexOf('cool story') !== -1);

        logger.destroy();
        assert.end();
    }
});

function allocCircularLol() {
    var circular = {};
    circular.lol = 'lol';
    circular.circular = circular;
    circular.pwnt = {};
    circular.pwnt.circular = circular;

    return circular;
}
