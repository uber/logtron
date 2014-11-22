var test = require('tape');

var defaultLevels = require('../default-levels.js');
var Logger = require('../logger.js');

test('stats for each log level are emitted when statsd client is provided', function (assert) {
    assert.plan(Object.keys(defaultLevels).length);

    Object.keys(defaultLevels)
        .forEach(function (levelName) {
            var logger = new Logger({
                meta: {},
                backends: {},
                statsd: {
                    increment: function (key) {
                        assert.equal(key, 'logtron.logged.' + levelName);
                    }
                }
            });

            logger[levelName]();
        });

    assert.end();
});
