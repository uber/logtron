var test = require('tape');

var Logger = require('../logger.js');

test('can instrument a logger', function (assert) {
    var logger = Logger({ meta: {}, backends: {} });

    assert.equal(typeof logger.instrument, 'function');

    assert.doesNotThrow(function () {
        logger.instrument();
    });

    assert.end();
});
