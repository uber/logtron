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
    this.levels = config.levels || defaultLevels;

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

    if (config.extendMeta && config.mergeParentMeta) {
        this.meta = xtend(this.mainLogger.meta, this.meta);
        if (this.mainLogger.metaFilter) {
            var mergedMetaFilters = [];
            mergedMetaFilters.push.apply(mergedMetaFilters, this.mainLogger.metaFilter);
            mergedMetaFilters.push.apply(mergedMetaFilters, this.metaFilter);
            this.metaFilter = mergedMetaFilters;
        }
    }

    Object.keys(this.levels).forEach(function (levelName) {
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

ChildLogger.prototype.createChild = function createChild(subPath, levels, options, mainLogger) {
    return this.mainLogger.createChild(this.path + '.' + subPath, levels, options, mainLogger || this);
};

function noop() {}
