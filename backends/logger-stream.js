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
