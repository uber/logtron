'use strict';

var DailyRotateFile = require('winston-uber').transports.DailyRotateFile;
var mkdirp = require('mkdirp');
var util = require('util');

function MkdirDailyRotateFile() {
    DailyRotateFile.apply(this, arguments);
}

util.inherits(MkdirDailyRotateFile, DailyRotateFile);

MkdirDailyRotateFile.prototype.name = 'MkdirDailyRotateFile';

MkdirDailyRotateFile.prototype.open = function open(cb) {
    // Same as DailyRotateFile#open
    if (this.opening) {
        return cb(true);
    }

    var now = new Date();
    if (!this._stream ||
      (this.maxsize && this._size >= this.maxsize) ||
      (this._year < now.getFullYear() || this._month < now.getMonth() || this._date < now.getDate() || this._hour < now.getHours() || this._minute < now.getMinutes())
    ) {
        // do proper stat
        return this._open(cb);
    }

    // By default _stream means we are open
    return cb();
};

MkdirDailyRotateFile.prototype._open = function _open(cb) {
    var self = this;
    var dirname = self.dirname;

    mkdirp(dirname, function (err) {
        if (err) {
            // emit an 'error' because winston does not
            // do anything if you do cb(err)
            return self.emit('error', err);
        }

        DailyRotateFile.prototype.open.call(self, cb);
    });
};

module.exports = MkdirDailyRotateFile;
