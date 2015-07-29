'use strict';

var xtend = require('xtend');
var dotty = require('dotty');

var defaultLevels = require('./default-levels.js');
var makeLogMethod = require('./log-method');
var errors = require('./errors');

module.exports = ChildLogger;

function ChildLogger(config) {
    this.mainLogger = config.mainLogger;
    this.path = config.path;
    if (config.extendMeta && !(config.meta || config.metaFilter)) {
        throw errors.MetaRequired;
    }
    this.extendMeta = config.extendMeta;
    this.meta = config.meta || {};
    this.strict = config.strict;
    this.metaFilter = config.metaFilter || [];

    this.metaFilter.forEach(function validateFilter(filter) {
        if (!filter || !filter.object || typeof filter.object !== 'object') {
            throw errors.FilterObjectRequired();
        }
        if (!filter.mappings || typeof filter.mappings !== 'object') {
            throw errors.FilterMappingsRequired();
        }
        Object.keys(filter.mappings).forEach(function validateMappings(srcName) {
            var dstName = filter.mappings[srcName];
            if (typeof dstName !== 'string') {
                throw errors.FilterBadDst();
            }
        });
    });

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
        var filteredMeta = {};
        this.metaFilter.forEach(function readFilter(filter) {
            var obj = filter.object;
            Object.keys(filter.mappings).forEach(function readMapping(srcName) {
                var dstName = filter.mappings[srcName];
                dotty.put(filteredMeta, dstName, dotty.get(obj, srcName));
            });
        }, this);
        // entry meta should always win
        entry.meta = xtend(this.meta, filteredMeta, entry.meta);
    }
    this.mainLogger.writeEntry(entry, callback);
};

ChildLogger.prototype.createChild = function createChild(subPath, levels, options) {
    return this.mainLogger.createChild(this.path + '.' + subPath, levels, options);
};

function noop() {}
