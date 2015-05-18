'use strict';

var path = require('path');
var os = require('os');
var uuid = require('uuid');
var rimraf = require('rimraf');
var fs = require('fs');
var assert = require('assert');
var inherits = require('util').inherits;

var KafkaServer = require(
    'kafka-logger/test/lib/kafka-server.js');
var SentryServer = require(
    'sentry-logger/test/lib/sentry-server.js');
var Logger = require('../../logger.js');
var ConsoleBackend = require('../../backends/console.js');
var DiskBackend = require('../../backends/disk.js');
var KafkaBackend = require('../../backends/kafka.js');
var SentryBackend = require('../../backends/sentry.js');

var Levels = {
    TRACE: 10,
    DEBUG: 20,
    INFO: 30,
    ACCESS: 35,
    WARN: 40,
    ERROR: 50,
    FATAL: 60
};

module.exports = FatLogger;

function FatLogger(opts) {
    if (!(this instanceof FatLogger)) {
        return new FatLogger(opts);
    }

    var self = this;

    opts = opts || {};
    self.opts = opts;
    self.doCleanup = !opts.folder;

    assert(self.opts.sentryListener, 'need sentryListener');
    assert(self.opts.kafkaListener, 'need kafkaListener');

    if (!self.opts.folder) {
        self.opts.folder = path.join(os.tmpDir(), uuid());
    }
    if (!self.opts.dsn) {
        self.sentryServer = SentryServer(self.opts.sentryListener);
        self.opts.dsn = self.sentryServer.dsn;
    }

    self.kafkaServer = KafkaServer(self.opts.kafkaListener);

    Logger.call(self, {
        meta: {
            team: 'rt',
            project: 'foobar'
        },
        backends: {
            console: ConsoleBackend({
                raw: opts ? opts.raw : false
            }),
            disk: DiskBackend(opts),
            kafka: KafkaBackend({
                leafHost: 'localhost',
                leafPort: self.kafkaServer.port,
                isDisabled: false,
                statsd: null,
                kafkaClient: null
            }),
            sentry: SentryBackend(opts)
        },
        levels: {
            trace: {
                backends: [],
                level: Levels.TRACE
            },
            debug: {
                backends: ['disk', 'console'],
                level: Levels.DEBUG
            },
            info: {
                backends: ['disk', 'kafka', 'console'],
                level: Levels.INFO
            },
            access: {
                backends: ['access'],
                level: Levels.ACCESS
            },
            warn: {
                backends: ['disk', 'kafka', 'console'],
                level: Levels.WARN
            },
            error: {
                backends: ['disk', 'kafka', 'console', 'sentry'],
                level: Levels.ERROR
            },
            fatal: {
                backends: ['disk', 'kafka', 'console', 'sentry'],
                level: Levels.FATAL
            }
        }
    });
}
inherits(FatLogger, Logger);

FatLogger.prototype.destroy = function destroy() {
    var self = this;

    if (self.doCleanup) {
        rimraf.sync(self.opts.folder);
    }
    if (self.kafkaServer) {
        self.kafkaServer.close();
    }
    if (self.sentryServer) {
        self.sentryServer.close();
    }

    Logger.prototype.destroy.apply(this, arguments);
};

FatLogger.prototype.readFile = function readFile(callback) {
    var self = this;

    var fileUri = 'rt-foobar.log';
    var uri = path.join(self.opts.folder, fileUri);
    fs.readFile(uri, function onFile(err, buf) {
        if (err) {
            return callback(err);
        }

        callback(null, String(buf));
    });
};
