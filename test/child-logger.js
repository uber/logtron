
var test = require('tape');

var captureStdio = require('./lib/capture-stdio.js');

var Logger = require('../logger.js');
var ConsoleBackend = require('../backends/console.js');

function createLogger() {
    return Logger({
        meta: {},
        backends: {
            console: ConsoleBackend()
        },
        transforms: [
            pathPrefixTransform
        ]
    });
}

function pathPrefixTransform(entry) {
    return new entry.constructor(
        entry.level,
        entry.path + ': ' + entry.message,
        entry.meta,
        entry.path
    );
}

test('root logger paths', function (assert) {
    var logger = createLogger();

    assert.ok(captureStdio('info: /: hello who=world', function () {
        logger.info('hello', { who: 'world' });
    }));

    assert.end();
});

test('child logger path', function (assert) {
    var logger = createLogger();
    var childLogger = logger.createChild('child', {info: true});

    assert.ok(captureStdio('info: /child: hello who=world', function () {
        childLogger.info('hello', { who: 'world' });
    }));

    assert.end();
});

test('child logger path', function (assert) {
    var logger = createLogger();
    var childLogger = logger.createChild('child');
    var grandchildLogger = childLogger.createChild('child');

    assert.ok(captureStdio('info: /child/child: hello who=world', function () {
        grandchildLogger.info('hello', { who: 'world' });
    }));

    assert.end();
});

