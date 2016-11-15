// Copyright (c) 2015 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

var SentryLogger = require('sentry-logger');
var RavenClient = require('uber-raven').Client;
var zlib = require('zlib');
var Prober = require('airlock');
var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;

var LoggerStream = require('./logger-stream.js');

var MAGIC_LINE_NUMBER_OFFSET = 11;

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
                statsd: backend.statsd,
                backend: ravenClient,
                detectFailuresBy: Prober.detectBy.EVENT,
                failureEvent: 'error',
                successEvent: 'logged'
            }),
            sentryProberDetectFailuresBy: SentryLogger.detectBy.EVENT,
            sentryProberDetectFailuresByEventFailureEvent: 'error',
            sentryProberDetectFailuresByEventSuccessEvent: 'logged'
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

    var error = new Error(msg);
    var lines = error.stack.split('\n');
    var line = lines[MAGIC_LINE_NUMBER_OFFSET];
    var errLoc = line ?
        line.replace(/^\s*at .*\/([^\:\/]*).*$/, "$1") : '';

    return errLoc;
}
