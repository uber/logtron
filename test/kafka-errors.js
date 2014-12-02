'use strict';

var test = require('tape');

var KafkaLogger = require('./lib/full-fat-kafka-logger.js');

test('can .error("message", new Error())', function (assert) {
    KafkaLogger(function (err, logger) {
        if (err) {
            return assert.end(err);
        }

        if (!logger) {
            assert.ok(true, 'skipping kafka test');
            return assert.end();
        }

        logger.readStream(function (chunk) {
            var msg = chunk.msg;

            assert.notEqual(msg.indexOf('hello'), -1);
            assert.notEqual(
                msg.indexOf('"stack":"Error: lulz'), -1);
            assert.notEqual(msg.indexOf('"message":"lulz"'), -1);

            logger.destroy();
            assert.end();
        });

        logger.error('hello', new Error('lulz'));
    });
});

test('can error("message", { error: Error() })', function (assert) {
    KafkaLogger(function (err, logger) {
        if (err) {
            return assert.end(err);
        }

        if (!logger) {
            assert.ok(true, 'skipping kafka test');
            return assert.end();
        }

        logger.readStream(function (chunk) {
            var msg = chunk.msg;

            assert.notEqual(msg.indexOf('some message'), -1);
            assert.notEqual(
                msg.indexOf('"stack":"Error: some error'), -1);
            assert.notEqual(
                msg.indexOf('"message":"some error"'), -1);
            assert.notEqual(msg.indexOf('"other":"key"'), -1);

            logger.destroy();
            assert.end();
        });

        logger.error('some message', {
            error: new Error('some error'),
            other: 'key'
        });
    });
});

test('can error(msg, { someKey: Error() })', function (assert) {
    KafkaLogger(function (err, logger) {
        if (err) {
            return assert.end(err);
        }

        if (!logger) {
            assert.ok(true, 'skipping kafka test');
            return assert.end();
        }

        logger.readStream(function (chunk) {
            var msg = chunk.msg;

            assert.notEqual(msg.indexOf('some message'), -1);
            assert.notEqual(
                msg.indexOf('"stack":"Error: some error'), -1);
            assert.notEqual(
                msg.indexOf('"message":"some error"'), -1);
            assert.notEqual(msg.indexOf('"other":"key"'), -1);

            logger.destroy();
            assert.end();
        });

        logger.error('some message', {
            someKey: new Error('some error'),
            other: 'key'
        });
    });
});
