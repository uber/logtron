'use strict';

var defaultLevels = require('./default-levels.js');

module.exports = ChildLogger;
function ChildLogger(config) {
    this.target = config.target;
    this.path = config.path;
    this.Entry = this.target.Entry;
    var levels = config.levels || defaultLevels;
    Object.keys(levels).forEach(function (levelName) {
        this[levelName] = this.makeLogMethod(levelName);
    }, this);
}

ChildLogger.prototype.log = function (entry, callback) {
    entry.path = this.path;
    this.target.log(entry, callback);
};

ChildLogger.prototype.createChild = function (subPath, levels) {
    return new this.ChildLogger({
        target: this.target,
        path: this.path + "." + subPath,
        levels: levels
    });
};

ChildLogger.prototype.makeLogMethod = function makeLogMethod(levelName) {
    return log;
    function log(message, meta, callback) {
        /*jshint validthis:true*/
        var entry = new this.Entry(levelName, message, meta, this.path);
        this.log(entry, callback);
    }
};

ChildLogger.prototype.ChildLogger = ChildLogger;

