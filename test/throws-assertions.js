var test = require('tape');

var Logger = require('../logger.js');

test('Logger() throws', function (assert) {
    var error = tryCatch(function () {
        Logger();
    });

    assert.ok(error);
    assert.equal(error.type, 'rt-logger.options.required');

    assert.end();
});

test('Logger({ meta: null }) throws', function (assert) {
    var error = tryCatch(function () {
        Logger({ meta: null });
    });

    assert.ok(error);
    assert.equal(error.type, 'rt-logger.options.meta.required');

    assert.end();
});

test('Logger({ meta: {}, backends: null }) throws', function (assert) {
    var error = tryCatch(function () {
        Logger({ meta: {}, backends: null });
    });

    assert.ok(error);
    assert.equal(error.type,
        'rt-logger.options.backends.required');

    assert.end();
});

function tryCatch(fn) {
    try {
        fn();
        return null;
    } catch (err) {
        return err;
    }
}
