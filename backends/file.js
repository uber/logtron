var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;

var LoggerStream = require('./logger-stream.js');
var File = require('../lib/mkdir-file.js');

function FileBackend(opts) {
    if (!(this instanceof FileBackend)) {
        return new FileBackend(opts);
    }
    if (!opts.fileName) {
        throw new Error('FileBackend: opts.fileName is required');
    }
    EventEmitter.call(this);
    this.fileName = opts.fileName;
}

inherits(FileBackend, EventEmitter);

FileBackend.prototype.createStream = function createStream(meta, opts) {
    var logger = new File({
        filename: this.fileName
    });

    return LoggerStream(logger, {
        highWaterMark: opts.highWaterMark
    });
};

module.exports = FileBackend;
