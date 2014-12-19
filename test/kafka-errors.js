'use strict';

var test = require('tape');

var KafkaLogger = require('./lib/kafka-logger.js');

test('can .error("message", new Error())', function (assert) {
    var logger = KafkaLogger(function (msg) {
        var obj = msg.messages[0].payload;

        assert.notEqual(obj.msg.indexOf('hello'), -1);
        assert.notEqual(
            obj.msg.indexOf('"stack":"Error: lulz'), -1);
        assert.notEqual(obj.msg.indexOf('"message":"lulz"'), -1);

        logger.destroy();
        assert.end();
    });

    logger.error('hello', new Error('lulz'));
});

test('can error("message", { error: Error() })', function (assert) {
    var logger = KafkaLogger(function (msg) {
        var obj = msg.messages[0].payload;

        assert.notEqual(obj.msg.indexOf('some message'), -1);
        assert.notEqual(
            obj.msg.indexOf('"stack":"Error: some error'), -1);
        assert.notEqual(
            obj.msg.indexOf('"message":"some error"'), -1);
        assert.notEqual(obj.msg.indexOf('"other":"key"'), -1);

        logger.destroy();
        assert.end();
    });

    logger.error('some message', {
        error: new Error('some error'),
        other: 'key'
    });
});

test('can error(msg, { someKey: Error() })', function (assert) {
    var logger = KafkaLogger(function (msg) {
        var obj = msg.messages[0].payload;

        assert.notEqual(obj.msg.indexOf('some message'), -1);
        assert.notEqual(
            obj.msg.indexOf('"stack":"Error: some error'), -1);
        assert.notEqual(
            obj.msg.indexOf('"message":"some error"'), -1);
        assert.notEqual(obj.msg.indexOf('"other":"key"'), -1);

        logger.destroy();
        assert.end();
    });

    logger.error('some message', {
        someKey: new Error('some error'),
        other: 'key'
    });
});
