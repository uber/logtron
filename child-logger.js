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
    if (config.extendMeta && !(config.meta || config.fieldObjs)) {
        throw errors.MetaRequired;
    }
    this.extendMeta = config.extendMeta;
    this.meta = config.meta || {};
    this.strict = config.strict;
    this.fieldObjs = config.fieldObjs || [];

    this.fieldObjs.forEach(function validateFields(objConf) {
        if (!objConf || !objConf.object || typeof objConf.object !== 'object') {
            throw errors.FieldObjectRequired();
        }
        if (!objConf.fields || typeof objConf.fields !== 'object') {
            throw errors.FieldDefinitionRequired();
        }
        Object.keys(objConf.fields).forEach(function validateField(field) {
            var fieldName = objConf.fields[field];
            if (!(typeof fieldName === 'string' || fieldName instanceof String)) {
                throw errors.FieldBadDef();
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
    var fieldMeta = {};
    this.fieldObjs.forEach(function readObjConf(objConf) {
        var obj = objConf.object;
        Object.keys(objConf.fields).forEach(function readField(field) {
            var fieldName = objConf.fields[field];
            dotty.put(fieldMeta, fieldName, dotty.get(obj, field));
        });
    }, this);
    if (this.extendMeta) {
        // entry meta should always win
        entry.meta = xtend(this.meta, fieldMeta, entry.meta);
    }
    this.mainLogger.writeEntry(entry, callback);
};

ChildLogger.prototype.createChild = function createChild(subPath, levels) {
    return this.mainLogger.createChild(this.path + '.' + subPath, levels);
};

function noop() {}
