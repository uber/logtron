var test = require('tape');

var captureStdio = require('./lib/capture-stdio.js');
var ConsoleLogger = require('./lib/console-logger.js');

test('can .error("message", new Error())', function (assert) {
    var logger = ConsoleLogger();

    assert.ok(captureStdio('error: hello',
        function logError() {
            logger.error('hello', new Error('lulz'));
        }));

    assert.ok(captureStdio('message=lulz',
        function logError() {
            logger.error('hello', new Error('lulz'));
        }));

    assert.ok(captureStdio('stack=Error: lulz',
        function logError() {
            logger.error('hello', new Error('lulz'));
        }));

    assert.end();
});

test('can error("message", { error: Error() })', function (assert) {
    var logger = ConsoleLogger();

    assert.ok(captureStdio('error: some message',
        function logError() {
            logger.error('some message', {
                error: new Error('some error'),
                other: 'key'
            });
        }));

    assert.ok(captureStdio('message=some error',
        function logError() {
            logger.error('some message', {
                error: new Error('some error'),
                other: 'key'
            });
        }));

    assert.ok(captureStdio('stack=Error: some error',
        function logError() {
            logger.error('some message', {
                error: new Error('some error'),
                other: 'key'
            });
        }));

    assert.end();
});

test('can error(msg, { someKey: Error() })', function (assert) {
    var logger = ConsoleLogger();

    assert.ok(captureStdio('error: some message',
        function logError() {
            logger.error('some message', {
                someKey: new Error('some error'),
                other: 'key'
            });
        }));

    assert.ok(captureStdio('message=some error',
        function logError() {
            logger.error('some message', {
                someKey: new Error('some error'),
                other: 'key'
            });
        }));

    assert.ok(captureStdio('stack=Error: some error',
        function logError() {
            logger.error('some message', {
                someKey: new Error('some error'),
                other: 'key'
            });
        }));

    assert.end();
});
