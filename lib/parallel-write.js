var parallel = require('run-parallel');
var ValidationError = require('error/validation');

module.exports = parallelWrite;

function parallelWrite(streams, chunk, callback) {
    var sideEffects = streams.map(function fanOut(logStream) {
        var streamName = logStream.name;
        var stream = logStream.stream;

        return function thunk(callback) {

            if (writableIsFull(stream)) {
                return callback(null, [null, undefined]);
            }

            stream.write(chunk, handleError);

            function handleError(err, result) {
                if (err) {
                    err.streamName = streamName;
                }

                callback(null, [err, result]);
            }
        };
    });

    parallel(sideEffects, onResult);

    function onResult(_, results) {
        var errors = results.map(function (tuple) {
            return tuple[0];
        }).filter(Boolean);

        if (errors.length) {
            return callback(ValidationError(errors));
        }

        callback(null);
    }
}

function writableIsFull(s) {
    var state = s._writableState;

    return state.length >= state.highWaterMark;
}
