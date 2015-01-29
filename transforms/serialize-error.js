var isError = require('core-util-is').isError;
var Entry = require('../entry.js');

module.exports = serializableError;

function serializableError(entry) {
    var meta = entry.meta;
    if (isError(meta)) {
        makeSerializable(meta);
    } else if (typeof meta === 'object' && meta !== null) {
        Object.keys(meta).forEach(function (k) {
            if (isError(meta[k])) {
                makeSerializable(meta[k]);
            }
        });
    }

    return new Entry(entry.level, entry.message, entry.meta, entry.path);
}

function makeSerializable(error) {
    Object.defineProperty(error, 'message', {
        value: error.message,
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(error, 'stack', {
        value: error.stack,
        enumerable: true,
        configurable: true
    });
}
