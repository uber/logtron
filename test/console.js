var test = require('tape');

var captureStdio = require('./lib/capture-stdio.js');
var ConsoleLogger = require('./lib/console-logger.js');

test('console logging', function (assert) {
    var logger = ConsoleLogger();

    assert.ok(logger);

    assert.ok(captureStdio('info: hello foo=bar', function () {
        logger.info('hello', { foo: 'bar' });
    }));

    assert.end();
});
