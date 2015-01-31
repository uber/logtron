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
var ChildLogger = require('./child-logger.js');

function Logger(opts) {
    if (!(this instanceof Logger)) {
        return new Logger(opts);
    }
    var self = this;

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

    var streams = this.streams = Object.keys(opts.backends)
        .reduce(function accumulateStreams(acc, backendName) {
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

    var levels = this.levels = extend(defaultLevels, opts.levels || {});
    this.path = opts.path = "";

    Object.keys(levels)
        .forEach(function makeMethodForLevel(levelName) {
            if (!levels[levelName]) {
                return;
            }

            var level = levels[levelName];
            level = extend({transforms: []}, level);
            levels[levelName] = level;

            level.transforms = level.transforms.concat(transforms);

            self[levelName] = self.makeLogMethod(levelName);
        }, {});

    this._streamsByLevel = Object.keys(levels)
        .reduce(function accumulateStreamsByLevel(streamsByLevel, levelName) {
            if (!levels[levelName]) {
                return streamsByLevel;
            }

            var level = levels[levelName];
            streamsByLevel[levelName] = level.backends
                .reduce(function accumulateStreamsByBackend(
                    levelStreams,
                    backendName
                ) {
                    if (streams[backendName]) {
                        levelStreams[backendName] = streams[backendName];
                    }
                    return levelStreams;
                }, {});

            return streamsByLevel;
        }, {});
}

inherits(Logger, EventEmitter);

Logger.prototype.instrument = function instrument() { };

Logger.prototype.destroy = function destroy() {
    Object.keys(this.streams).forEach(function destroyStreamForLevel(name) {
        var stream = this.streams[name];
        if (stream && stream.destroy) {
            stream.destroy();
        }
    }, this);
};

Logger.prototype.writeEntry = function writeEntry(entry, callback) {
    var levelName = entry.level;
    var level = this.levels[levelName];
    var logStreams = this._streamsByLevel[levelName];
    var logger = this;
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
};

Logger.prototype.createChild = function createChild(subPath, levels) {
    return new this.ChildLogger({
        mainLogger: this,
        path: subPath,
        levels: levels
    });
};

Logger.prototype.makeLogMethod = ChildLogger.prototype.makeLogMethod;
Logger.prototype.Entry = Entry; // used by log methods
Logger.prototype.ChildLogger = ChildLogger; // used by createChild

module.exports = Logger;
