var test = require('tape');

var Logger = require('../logger.js');

test('Supports backends without .destroy()', function (assert) {
    var backend = {
        createStream: function () {
            return {};
        }
    };

    var logger = Logger({
        meta: {},
        backends: {
            myBackend: backend
        }
    });

    assert.doesNotThrow(function () {
        logger.destroy();
    });

    assert.end();
});
