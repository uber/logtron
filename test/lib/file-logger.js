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

var path = require('path');
var os = require('os');
var uuid = require('uuid');
var rimraf = require('rimraf');
var fs = require('fs');
var dateFormat = require('date-format');

var Logger = require('../../logger.js');
var DiskBackend = require('../../backends/disk.js');

module.exports = createLogger;

function createLogger(opts) {
    opts = opts || {};

    var doCleanup = !opts.folder;

    if (!opts.folder) {
        opts.folder = path.join(os.tmpDir(), uuid());
    }

    var logger = Logger({
        meta: {
            team: 'rt',
            project: 'foobar'
        },
        backends: {
            disk: DiskBackend(opts)
        }
    });

    var _destroy = logger.destroy;
    logger.destroy = function destroy() {
        if (doCleanup) {
            rimraf.sync(opts.folder);
        }

        _destroy.apply(this, arguments);
    };

    logger.readFile = function readFile(callback) {
        var fileUri = 'rt-foobar.log-' + dateFormat('yyyyMMdd');
        var uri = path.join(opts.folder, fileUri);
        fs.readFile(uri, function (err, buf) {
            if (err) {
                return callback(err);
            }

            callback(null, String(buf));
        });
    };

    return logger;
}
