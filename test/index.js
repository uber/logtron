var test = require('tape');

var Logger = require('../logger.js');

require('./backend-without-destroy.js');
require('./console-errors.js');
require('./console.js');
require('./errors-in-backend.js');
require('./file-errors.js');
require('./file.js');
require('./instrument.js');
require('./kafka-errors.js');
require('./kafka.js');
require('./optional-backends.js');
require('./pid-and-host.js');
require('./sentry-errors.js');
require('./sentry.js');
require('./throws-assertions.js');

test('removing levels', function (assert) {
    var logger = Logger({
        backends: {},
        meta: {},
        levels: {
            trace: null
        }
    });

    assert.equal(logger.trace, undefined);

    assert.end();
});

setInterval(function () {
    var handles = process._getActiveHandles();
    console.log('handles', handles.length, handles[0]);
}, 10000).unref();
