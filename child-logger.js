'use strict';

var defaultLevels = require('./default-levels.js');

module.exports = ChildLogger;

function ChildLogger(config) {
    this.mainLogger = config.mainLogger;
    this.path = config.path;
    this.Entry = this.mainLogger.Entry;
    var levels = config.levels || defaultLevels;
    Object.keys(levels).forEach(function (levelName) {
        this[levelName] = this.makeLogMethod(levelName);
    }, this);
}

ChildLogger.prototype.writeEntry = function writeEntry(entry, callback) {
    entry.path = this.path;
    this.mainLogger.writeEntry(entry, callback);
};

ChildLogger.prototype.createChild = function createChild(subPath, levels) {
    return new this.ChildLogger({
        mainLogger: this.mainLogger,
        path: this.path + "." + subPath,
        levels: levels
    });
};

ChildLogger.prototype.makeLogMethod = function makeLogMethod(levelName) {
    return log;

    function log(message, meta, callback) {
        /*jshint validthis:true*/
        var entry = new this.Entry(levelName, message, meta, this.path);
        this.writeEntry(entry, callback);
    }
};

ChildLogger.prototype.ChildLogger = ChildLogger;

