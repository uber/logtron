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
