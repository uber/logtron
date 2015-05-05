var fs = require('fs');
var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var Writable = require('readable-stream').Writable;

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

FileBackend.prototype.createStream =
function createStream(meta, opts) {
    var file = fs.createWriteStream(this.fileName);
    var logger = new Writable({
        objectMode: true
    });
    logger._write = function write(entry, enc, cb) {
        file.write(JSON.stringify(entry) + '\n');
    };
    return logger;
};

module.exports = FileBackend;

