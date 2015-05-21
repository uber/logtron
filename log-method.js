'use strict';

var Entry = require('./entry');

module.exports = makeLogMethod;

function makeLogMethod(levelName) {
    return log;

    function log(message, meta, callback) {
        /*jshint validthis:true*/

        if (typeof meta !== 'object' || meta === null) {
            meta = {
                nonObjectMeta: meta
            };
        }

        var entry = new Entry(levelName, message, meta, this.path);

        this.writeEntry(entry, callback);
    }
}

