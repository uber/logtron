var extend = require('xtend');
var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');

var parallelWrite = require('./lib/parallel-write.js');
var defaultLevels = require('./default-levels.js');
var serializableErrorTransform =
    require('./transforms/serialize-error.js');
var writePidAndHost = require('./transforms/pid-and-host.js');
var errors = require('./errors.js');
var Entry = require('./entry.js');

function Logger(opts) {
    if (!(this instanceof Logger)) {
        return new Logger(opts);
    }

    if (!opts) {
        throw errors.OptsRequired();
    }

    if (!opts.meta) {
        throw errors.MetaRequired();
    }

    if (!opts.backends) {
        throw errors.BackendsRequired();
    }

    EventEmitter.call(this);

    var meta = opts.meta;
    var transforms = opts.transforms || [];

    transforms.push(serializableErrorTransform);
    transforms.push(writePidAndHost(meta));

    this.streams = Object.keys(opts.backends)
        .reduce(function (acc, backendName) {
            var backend = opts.backends[backendName];
            if (!backend) {
                return acc;
            }

            acc[backendName] = backend.createStream(meta, {
                highWaterMark: opts.highWaterMark || 1000
            });
            return acc;
        }, {});

    this.statsd = opts.statsd;

    var levels = extend(defaultLevels, opts.levels || {});
    var path = opts.path || "";

    Object.keys(levels)
        .forEach(function (levelName) {
            if (!levels[levelName]) {
                return;
            }

            var level = levels[levelName];
            level.transforms = (level.transforms || [])
                .concat(transforms);

            this[levelName] = logMethod(this, levelName, level, path);
        }, this);
}

inherits(Logger, EventEmitter);

Logger.prototype.instrument = function instrument() {

};

Logger.prototype.destroy = function destroy() {
    Object.keys(this.streams).forEach(function (name) {
        var stream = this.streams[name];
        if (stream && stream.destroy) {
            stream.destroy();
        }
    }, this);
};

module.exports = Logger;

function logMethod(logger, levelName, level, path) {
    var streams = logger.streams;
    var logStreams = level.backends.reduce(function (acc, name) {
        if (!streams[name]) {
            return acc;
        }

        acc[name] = streams[name];
        return acc;
    }, {});

    return log;

    function log(message, meta, callback) {
        var entry = new Entry(levelName, message, meta, path);

        if (this.statsd && typeof this.statsd.increment === 'function') {
            this.statsd.increment('logtron.logged.' + levelName);
        }

        level.transforms.forEach(function (transform) {
            entry = transform(entry);
        });

        parallelWrite(logStreams, entry, function (err) {
            if (!err) {
                if (callback) {
                    callback(null);
                }
                return;
            }

            if (callback && typeof callback === 'function') {
                return callback(err);
            }

            logger.emit('error', err);
        });
    }
}
