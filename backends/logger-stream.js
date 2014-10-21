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

LoggerStream.prototype._write = function write(triplet, enc, cb) {
    var levelName = triplet[0];
    var message = triplet[1];
    var chunk = triplet[2];

    this.logger.log(levelName, message, chunk, cb);
};

LoggerStream.prototype.destroy = function destroy() {
    if (this._destroyCb) {
        this._destroyCb();
    }
};

module.exports = LoggerStream;
