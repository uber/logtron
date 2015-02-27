'use strict';

var test = require('tape');

var KafkaLogger = require('./lib/kafka-logger.js');

test('can .error("message", new Error())', function (assert) {
    var logger = KafkaLogger(function (msg) {
        var obj = msg.messages[0].payload;

        assert.notEqual(obj.msg.indexOf('hello'), -1);
        assert.notEqual(
            obj.fields.stack.indexOf('Error: lulz'), -1);
        assert.equal(obj.fields.message, 'lulz');

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
            obj.fields.error.stack.indexOf('Error: some error'), -1);
        assert.equal(obj.fields.error.message, 'some error');
        assert.equal(obj.fields.other, 'key');

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
            obj.fields.someKey.stack.indexOf('Error: some error'), -1);
        assert.equal(obj.fields.someKey.message, 'some error');
        assert.equal(obj.fields.other, 'key');

        logger.destroy();
        assert.end();
    });

    logger.error('some message', {
        someKey: new Error('some error'),
        other: 'key'
    });
});
