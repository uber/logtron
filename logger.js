var extend = require('xtend');
var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');

var parallelWrite = require('./lib/parallel-write.js');
var defaultLevels = require('./default-levels.js');
var serializableErrorTransform =
    require('./transforms/serialize-error.js');
var safeSerializeMeta =
    require('./transforms/safe-serialize-meta.js');
var writePidAndHost = require('./transforms/pid-and-host.js');
var errors = require('./errors.js');
var makeLogMethod = require('./log-method');
var ChildLogger = require('./child-logger');

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

    var meta = this.meta = opts.meta;
    var transforms = opts.transforms || [];
    var basemetaTransforms = opts.basemetaTransforms || [];

    basemetaTransforms.forEach(function initTransforms(transform) {
        transforms.push(transform(meta));
    });

    transforms.push(safeSerializeMeta);
    transforms.push(serializableErrorTransform);
    transforms.push(writePidAndHost(meta));

    this.statsd = opts.statsd;

    this.path = opts.path = "";

    // Performs a deep copy of the default log levels, overlaying the
    // configured levels and filtering nulled levels.
    var levels = this.levels = {};
    var configuredLevels = extend(defaultLevels, opts.levels || {});
    Object.keys(configuredLevels)
        .forEach(function copyDefaultLevel(levelName) {
            // Setting a level in opts.levels to null disables that level.
            if (!configuredLevels[levelName]) {
                return;
            }
            // Each log level will contain an array of transforms by default,
            // that will be suffixed with globally configured transforms.
            var level = extend({transforms: []}, configuredLevels[levelName]);
            level.transforms = level.transforms.concat(transforms);
            levels[levelName] = level;
        });

    // Create a log level method, e.g., info(message, meta, cb?), for every
    // configured log level.
    Object.keys(levels)
        .forEach(function makeMethodForLevel(levelName) {
            self[levelName] = makeLogMethod(levelName);
        });

    // Create a stream for each of the configured backends, indexed by backend
    // name.
    // streams: Object<backendName, Stream>
    var streams = this.streams = Object.keys(opts.backends)
        .reduce(function accumulateStreams(streamByBackend, backendName) {
            var backend = opts.backends[backendName];
            if (!backend) {
                return streamByBackend;
            }

            streamByBackend[backendName] = backend.createStream(meta, {
                highWaterMark: opts.highWaterMark || 1000
            });
            return streamByBackend;
        }, {});

    // Creates an index of all the streams that each log level will write to,
    // keyed by log level.
    // The index is used by the writeEntry method to look up all the target
    // streams for the given level.
    // The parallel write method uses the backend name to annotate errors.
    // _streamsByLevel: Object<logLevel, Array<Object<backendName, Stream>>>
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
                        levelStreams.push({
                            name: backendName,
                            stream: streams[backendName]
                        });
                    }
                    return levelStreams;
                }, []);

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

    for (var i=0; i<level.transforms.length; ++i) {
        entry = level.transforms[i](entry);
    }

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

Logger.prototype.createChild = function createChild(path, levels, opts) {
    opts = opts || {};

    return new ChildLogger({
        mainLogger: this,
        path: path,
        levels: levels,
        extendMeta: opts.extendMeta,
        meta: opts.meta,
        strict: opts.strict,
        metaFilter: opts.metaFilter
    });
};

module.exports = Logger;
