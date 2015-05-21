'use strict';

var test = require('tape');

var Logger = require('../logger.js');

require('./default-backends.js');
require('./circular-objects.js');
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
require('./stats.js');
require('./throws-assertions.js');
require('./access.js');
require('./leaky-backend-master.js');
require('./kafka-is-disabled.js');
require('./child-logger.js');
require('./buffer-objects.js');
require('./raw-logger.js');
require('./writing-weird-meta-objects.js');

test('removing levels', function t(assert) {
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
