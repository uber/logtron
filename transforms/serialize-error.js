var isError = require('core-util-is').isError;

module.exports = serializableError;

function serializableError(triplet) {
    var opts = triplet[2];
    if (isError(opts)) {
        makeSerializable(opts);
    } else if (typeof opts === 'object' && opts !== null) {
        Object.keys(opts).forEach(function (k) {
            if (isError(opts[k])) {
                makeSerializable(opts[k]);
            }
        });
    }

    return [triplet[0], triplet[1], opts];
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
