var SentryLogger = require('sentry-logger');
var RavenClient = require('uber-raven').Client;
var zlib = require('zlib');
var Prober = require('airlock');
var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;

var LoggerStream = require('./logger-stream.js');

function SentryBackend(opts) {
    if (!(this instanceof SentryBackend)) {
        return new SentryBackend(opts);
    }

    if (!opts.dsn) {
        throw new Error('SentryBackend: opts.dsn is required');
    }

    EventEmitter.call(this);

    this.dsn = opts.dsn;
    this.defaultTags = opts.defaultTags || {};
    this.statsd = opts.statsd || null;
}

inherits(SentryBackend, EventEmitter);

SentryBackend.prototype.createStream =
    function createStream(meta, opts) {
        var backend = this;
        var ravenClient = new RavenClient(backend.dsn);

        var logger = new SentryLogger({
            level: 'error',
            enabled: true,
            ravenClient: ravenClient,
            tags: backend.defaultTags || {},
            computeErrLoc: computeErrLoc,
            onRavenError: onRavenError,
            sentryProber: new Prober({
                title: 'sentry',
                enabled: true,
                detectFailuresBy: 'event',
                statsd: backend.statsd,
                backend: ravenClient,
                failureEvent: 'error',
                successEvent: 'logged'
            })
        });

        return LoggerStream(logger, {
            highWaterMark: opts.highWaterMark
        });

        function onRavenError(e) {
            var message = new Buffer(String(e.sendMessage || ''), 'base64');

            zlib.inflate(message, function (err, buff) {
                var sendMessage = String(buff || '');

                if (e.statusCode === 429) {
                    return;
                }

                backend.emit('warn', 'Raven failed to upload to Sentry: ', {
                    message: e.message,
                    stack: e.stack,
                    reason: e.reason,
                    statusCode: e.statusCode,
                    sendMessage: sendMessage,
                    headers: e.response && e.response.headers
                });
                backend.emit('info', 'could not log to raven', {
                    sendMessage: sendMessage
                });
            });
        }
    };

module.exports = SentryBackend;

function computeErrLoc(msg) {
    // This is the number of stack frames that exist between us and
    // where the logging program called into logtron.
    var MAGIC_LINE_NUMBER_OFFSET = 10;

    var error = new Error(msg);
    var lines = error.stack.split('\n');
    var line = lines[MAGIC_LINE_NUMBER_OFFSET];
    var errLoc = line ?
        line.replace(/^\s*at .*\/([^\:\/]*).*$/, "$1") : '';

    return errLoc;
}
