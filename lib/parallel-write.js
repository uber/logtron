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

var isError = require('core-util-is').isError;
var deepExtend = require('deep-extend');
var ValidationError = require('error/validation');

module.exports = parallelWrite;

function parallelWrite(logStreams, entry, callback) {
    var errors = [];
    var pending = logStreams.length;

    if (pending) {
        for (var i=0; i<logStreams.length; ++i) {
            var stream = logStreams[i].stream;
            var next = onResult(logStreams[i].name);

            if (writableIsFull(stream)) {
                return next();
            }

            var copy;
            if (logStreams[i].name === 'sentry') {
                copy = magicCopy(entry);
                // copy = entry;
            } else {
                copy = entry;
            }

            stream.write(copy, next);
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

/** sentry is a magical special best.

We must deep copy the log entry because sentry mutates it.
This means if we write to sentry first we will write malformed
data to kafka or disk.

This is a magical deep copy because it can deep copy error objects

*/
function magicCopy(entry) {
    if (isError(entry)) {
        return magicCopyError(entry);
    }

    var copy = deepExtend({}, entry);

    if (typeof entry === 'object' && entry !== null) {
        Object.keys(entry).forEach(function copyProp(k) {
            var value = entry[k];
            if (isError(value)) {
                copy[k] = magicCopyError(value);
            } else if (typeof value === 'object' && value !== null) {
                copy[k] = magicCopy(entry[k]);
            }
        });
    }

    return copy;
}

function magicCopyError(origError) {
    // TODO sub classing error... ...
    var freshError = new Error(origError.message);
    // Copying the stack is valid...
    freshError.stack = origError.stack;

    // copy keys before making message & stack enumerable
    Object.keys(origError).forEach(function copyProp(k) {
        var value = origError[k];

        if (typeof value === 'object' && value !== null) {
            freshError[k] = magicCopy(value);
        } else {
            freshError[k] = value;
        }
    });

    Object.defineProperty(freshError, 'message', {
        value: freshError.message,
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(freshError, 'stack', {
        value: freshError.stack,
        enumerable: true,
        configurable: true
    });

    return freshError;
}
