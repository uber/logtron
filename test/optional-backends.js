var test = require('tape');

var Logger = require('../logger.js');

test('optional backend', function (assert) {
    assert.doesNotThrow(function () {
        Logger({
            meta: {},
            backends: {
                console: null
            }
        });
    });

    assert.end();
});
