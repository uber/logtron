var DailyRotateFile = require('winston').transports.DailyRotateFile;
var fs = require('fs');
var mkdirp = require('mkdirp');
var util = require('util');

function MkdirDailyRotateFile() {
    DailyRotateFile.apply(this, arguments);
}

util.inherits(MkdirDailyRotateFile, DailyRotateFile);

MkdirDailyRotateFile.prototype.name = 'MkdirDailyRotateFile';

MkdirDailyRotateFile.prototype.open = function open(cb) {
    var self = this;
    var dirname = self.dirname;

    fs.exists(dirname, function (exists) {
        if (!exists) {
            mkdirp(dirname, function (err) {
                if (err) {
                    // emit an 'error' because winston does not
                    // do anything if you do cb(err)
                    return self.emit('error', err);
                }

                DailyRotateFile.prototype.open.call(self, cb);
            });
        } else {
            DailyRotateFile.prototype.open.call(self, cb);
        }
    });
};

module.exports = MkdirDailyRotateFile;
