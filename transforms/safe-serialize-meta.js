'use strict';

var Entry = require('../entry.js');

module.exports = safeSerializeMeta;

function safeSerializeMeta(entry) {
    var meta = entry.meta;

    var serializedFailed = trySerialize(meta);

    if (serializedFailed !== null) {
        meta = {
            error: 'logtron failed to serialize meta'
        };
    }

    return new Entry(entry.level, entry.message, meta, entry.path);
}

function trySerialize(meta) {
    try {
        JSON.stringify(meta);
        return null;
    } catch (e) {
        return e;
    }
}
