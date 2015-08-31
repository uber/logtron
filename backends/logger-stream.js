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

var Writable = require('readable-stream').Writable;
var inherits = require('inherits');

function LoggerStream(logger, opts, destroyCb) {
    if (!(this instanceof LoggerStream)) {
        return new LoggerStream(logger, opts, destroyCb);
    }

    Writable.call(this, {
        objectMode: true,
        highWaterMark: opts.highWaterMark
    });

    this.logger = logger;
    this._destroyCb = destroyCb || null;
}

inherits(LoggerStream, Writable);

LoggerStream.prototype._write = function write(entry, enc, cb) {
    var level = entry.level;
    var message = entry.message;
    var meta = entry.meta;
    this.logger.log(level, message, meta, cb);
};

LoggerStream.prototype.destroy = function destroy() {
    if (this._destroyCb) {
        this._destroyCb();
    }
};

module.exports = LoggerStream;
