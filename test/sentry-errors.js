var test = require('tape');

var SentryLogger = require('./lib/sentry-logger');

test('can .error("message", new Error())', function (assert) {
    var logger = SentryLogger(function (result) {
        assert.equal(result.message,
            'Error: sentry-errors.js: no u');

        assert.equal(result.culprit,
            'sentry-errors at logError');

        assert.deepEqual(result['sentry.interfaces.Exception'], {
            type: 'Error',
            value: 'sentry-errors.js: no u'
        });
        assert.ok(result['sentry.interfaces.Stacktrace']);

        logger.destroy();
        assert.end();
    });

    function logError() {
        logger.error('hello world', new Error('no u'));
    }

    logError();
});

test('has originalMessage for .error(str, errObj)', function (assert) {
    var logger = SentryLogger(function (result) {
        assert.equal(result.extra.originalMessage,
            'original message');

        logger.destroy();
        assert.end();
    });

    function logError() {
        logger.error('original message',
            new Error('some error'));
    }

    logError();
});

test('.error(str, metaObj) has a stack extra', function (assert) {
    var logger = SentryLogger(function (result) {
        assert.equal(result.extra.oh, 'hi');
        assert.ok(result.extra.stack);

        assert.equal(result.message,
            'sentry-errors.js: some message');

        logger.destroy();
        assert.end();
    });

    function logError() {
        logger.error('some message', { oh: 'hi' });
    }

    logError();
});

test('respects tags defined in logger', function (assert) {
    var logger = SentryLogger({
        defaultTags: {
            regionName: 'hello'
        }
    }, function (result) {
        assert.equal(result.tags.regionName, 'hello');

        logger.destroy();
        assert.end();
    });

    function logError() {
        logger.error('some message', new Error('some error'));
    }

    logError();
});

test('can error("message", { error: Error() })', function (assert) {
    var logger = SentryLogger(function (result) {
        assert.equal(result.extra.other, 'key');
        assert.equal(result.extra.originalMessage, 'some message');

        assert.equal(result.message,
            'Error: sentry-errors.js: some error');

        assert.equal(result.culprit,
            'sentry-errors at logError');

        assert.deepEqual(result['sentry.interfaces.Exception'], {
            type: 'Error',
            value: 'sentry-errors.js: some error'
        });
        assert.ok(result['sentry.interfaces.Stacktrace']);

        logger.destroy();
        assert.end();
    });

    function logError() {
        logger.error('some message', {
            error: new Error('some error'),
            other: 'key'
        });
    }

    logError();
});

test('can error(msg, { someKey: Error() })', function (assert) {
    var logger = SentryLogger(function (result) {
        assert.equal(result.extra.other, 'key');
        assert.equal(result.extra.originalMessage, 'some message');

        assert.equal(result.message,
            'Error: sentry-errors.js: some error');

        assert.equal(result.culprit,
            'sentry-errors at logError');

        assert.deepEqual(result['sentry.interfaces.Exception'], {
            type: 'Error',
            value: 'sentry-errors.js: some error'
        });
        assert.ok(result['sentry.interfaces.Stacktrace']);
        assert.equal(result.extra.arbitraryKey, undefined);

        logger.destroy();
        assert.end();
    });

    function logError() {
        logger.error('some message', {
            arbitraryKey: new Error('some error'),
            other: 'key'
        });
    }

    logError();
});
