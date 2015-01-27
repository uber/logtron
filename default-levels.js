var TRACE = 10;
var DEBUG = 20;
var INFO = 30;
var ACCESS = 35;
var WARN = 40;
var ERROR = 50;
var FATAL = 60;


var defaultBackends = ['disk', 'kafka', 'console'];

var defaultLevels = {
    trace: {
        backends: [],
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
    access: {
        backends: ['disk', 'console', 'kafka', 'access'],
        level: ACCESS
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
