var ValidationError = require('error/validation');

module.exports = parallelWrite;

function parallelWrite(logStreams, chunk, callback) {
    var errors = [];
    var pending = logStreams.length;

    if (pending) {
        for (var i=0; i<logStreams.length; ++i) {
            var stream = logStreams[i].stream;
            var next = onResult(logStreams[i].name);

            if (writableIsFull(stream)) {
                return next();
            }

            stream.write(chunk, next);
        }
    } else {
        callback(null);
    }

    function onResult(streamName) {
        return function(err) {
            if (err) {
                err.streamName = streamName;
                errors.push(err);
            }

            if (--pending === 0 && callback) {
                var result = errors.length ? ValidationError(errors) : null;
                callback(result);
                callback = null;
            }
        };
    }
}

function writableIsFull(s) {
    var state = s._writableState;

    return state.length >= state.highWaterMark;
}
