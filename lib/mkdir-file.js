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

'use strict';

var File = require('winston-uber').transports.File;
var mkdirp = require('mkdirp');
var util = require('util');

function MkdirFile() {
    File.apply(this, arguments);
}

util.inherits(MkdirFile, File);

MkdirFile.prototype.name = 'MkdirFile';

MkdirFile.prototype.open = function open(cb) {
    // Same as File#open
    if (this.opening) {
        return cb(true);
    }

    if (!this._stream || (this.maxsize && this._size >= this.maxsize)) {
        // do proper stat
        return this._open(cb);
    }

    // By default _stream means we are open
    return cb();
};

MkdirFile.prototype._open = function _open(cb) {
    var self = this;
    var dirname = self.dirname;

    mkdirp(dirname, function (err) {
        if (err) {
            // emit an 'error' because winston does not
            // do anything if you do cb(err)
            return self.emit('error', err);
        }

        File.prototype.open.call(self, cb);
    });
};

module.exports = MkdirFile;
