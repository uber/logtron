var test = require('tape');

var captureStdio = require('./lib/capture-stdio.js');
var ConsoleLogger = require('./lib/console-logger.js');

test('console logging at access level', function (assert) {
    var logger = ConsoleLogger();

    assert.ok(logger);

    assert.ok(captureStdio('access: hello foo=bar', function () {
        logger.access('hello', { foo: 'bar' });
    }));

    assert.end();
});
