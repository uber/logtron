'use strict';

var SentryServer = require('sentry-logger/test/lib/sentry-server.js');
var Logger = require('../../logger.js');
var SentryBackend = require('../../backends/sentry.js');

module.exports = createLogger;

function createLogger(opts, listener) {
    if (typeof opts === 'function') {
        listener = opts;
        opts = null;
    }

    opts = opts || {};

    var server;

    if (!opts.dsn) {
        server = SentryServer(listener);
        opts.dsn = server.dsn;
    }

    var backend = SentryBackend(opts);
    var logger = Logger({
        meta: {},
        backends: {
            sentry: backend
        }
    });

    var _destroy = logger.destroy;
    logger.destroy = function interceptDestroy() {
        if (server) {
            server.close();
        }

        _destroy.apply(this, arguments);
    };

    return logger;
}
