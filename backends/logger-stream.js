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
    this.closed = false;
    this._closeCallback = null;
    this._destroyCb = destroyCb || null;
}

inherits(LoggerStream, Writable);

LoggerStream.prototype.write = function write(entry, cb) {
    var self = this;

    if (self.closed) {
        cb(null); // lal
        return false;
    }

    return Writable.prototype.write.call(self, entry, cb);
};

LoggerStream.prototype._write = function write(entry, enc, cb) {
    var self = this;

    var level = entry.level;
    var message = entry.message;
    var meta = entry.meta;
    self.logger.log(level, message, meta, function writeDone(err) {
        cb(err);
        if (self.closed && !self._writableState.length) {
            self._onDrain();
        }
    });
};

LoggerStream.prototype.close = function close(callback) {
    if (this.closed) {
        callback(new Error('LoggerStream already closed'));
        return;
    }

    this.closed = true;
    this._closeCallback = callback;

    if (!this._writableState.length) {
        this._onDrain();
    }
};

LoggerStream.prototype._onDrain = function onDrain() {
    this.destroy();
    this._closeCallback(null);
};

LoggerStream.prototype.destroy = function destroy() {
    if (this._destroyCb) {
        this._destroyCb();
    }
};

module.exports = LoggerStream;
