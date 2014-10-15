var TRACE = 10;
var DEBUG = 20;
var INFO = 30;
var WARN = 40;
var ERROR = 50;
var FATAL = 60;

var defaultBackends = ['disk', 'kafka', 'console'];

var defaultLevels = {
    trace: {
        backends: ['console'],
        level: TRACE
    },
    debug: {
        backends: ['disk', 'console'],
        level: DEBUG
    },
    info: {
        backends: defaultBackends,
        level: INFO
    },
    warn: {
        backends: defaultBackends,
        level: WARN
    },
    error: {
        backends: ['disk', 'kafka', 'console', 'sentry'],
        level: ERROR
    },
    fatal: {
        backends: ['disk', 'kafka', 'console', 'sentry'],
        level: FATAL
    }
};

module.exports = defaultLevels;
