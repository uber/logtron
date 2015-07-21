'use strict';

var xtend = require('xtend');

var defaultLevels = require('./default-levels.js');
var makeLogMethod = require('./log-method');
var errors = require('./errors');

module.exports = ChildLogger;

function ChildLogger(config) {
    this.mainLogger = config.mainLogger;
    this.path = config.path;
    if (config.extendMeta && !config.meta) {
        throw errors.MetaRequired;
    }
    this.extendMeta = config.extendMeta;
    this.meta = config.meta;
    this.strict = config.strict;

    var levels = config.levels || defaultLevels;
    Object.keys(levels).forEach(function (levelName) {
        if (!this.mainLogger.levels.hasOwnProperty(levelName)) {
            if (this.strict) {
                throw errors.LevelRequired({level: levelName});
            } else {
                this[levelName] = noop;
                this.mainLogger.warn('Child Logger Disabled level',
                    {level: levelName});
            }
        } else {
            this[levelName] = makeLogMethod(levelName);
        }
    }, this);
}

ChildLogger.prototype.writeEntry = function writeEntry(entry, callback) {
    if (this.extendMeta) {
        // entry meta should always win
        entry.meta = xtend(this.meta, entry.meta);
    }
    this.mainLogger.writeEntry(entry, callback);
};

ChildLogger.prototype.createChild = function createChild(subPath, levels) {
    return this.mainLogger.createChild(this.path + '.' + subPath, levels);
};

function noop() {}
