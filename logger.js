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

var extend = require('xtend');
var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');
var collectParallel = require('collect-parallel/object');

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

Logger.prototype.close = function close(callback) {
    collectParallel(this.streams, closeEachStream, finish);

    function closeEachStream(stream, i, done) {
        if (stream && stream.close) {
            stream.close(done);
        }
    }

    function finish(err, results) {
        for (var i = 0; i < results; i++) {
            if (results[i].err) {
                callback(results[i].err);
                return;
            }
        }
        callback(null);
    }
};

Logger.prototype.destroy = function destroy() {
    Object.keys(this.streams).forEach(function destroyStreamForLevel(name) {
        var stream = this.streams[name];
        if (stream && stream.destroy) {
            stream.destroy();
        }
    }, this);
};

Logger.prototype.writeEntry = function writeEntry(entry, callback) {
    // Apply transforms before grabbing streams for the given level, since transforms
    // may change the log level.
    var transforms = this.levels[entry.level].transforms;
    for (var i=0; i<transforms.length; ++i) {
        entry = transforms[i](entry);
    }
    var levelName = entry.level;

    var logStreams = this._streamsByLevel[levelName];
    var logger = this;
    if (this.statsd && typeof this.statsd.increment === 'function') {
        this.statsd.increment('logtron.logged.' + levelName);
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

Logger.prototype.createChild = function createChild(path, levels, opts, mainLogger) {
    opts = opts || {};

    return new ChildLogger({
        mainLogger: mainLogger || this,
        path: path,
        levels: levels,
        extendMeta: opts.extendMeta,
        meta: opts.meta,
        strict: opts.strict,
        metaFilter: opts.metaFilter,
        mergeParentMeta: opts.mergeParentMeta
    });
};

module.exports = Logger;
