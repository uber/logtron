'use strict';

var defaultLevels = require('./default-levels.js');
var makeLogMethod = require('./log-method');
var errors = require('./errors');

module.exports = ChildLogger;

function ChildLogger(config) {
    this.mainLogger = config.mainLogger;
    this.path = config.path;
    var levels = config.levels || defaultLevels;
    Object.keys(levels).forEach(function (levelName) {
        if (!this.mainLogger.levels.hasOwnProperty(levelName)) {
            throw errors.LevelRequired({level: levelName});
        }
        this[levelName] = makeLogMethod(levelName);
    }, this);
}

ChildLogger.prototype.writeEntry = function writeEntry(entry, callback) {
    this.mainLogger.writeEntry(entry, callback);
};

ChildLogger.prototype.createChild = function createChild(subPath, levels) {
    return this.mainLogger.createChild(this.path + '.' + subPath, levels);
};

