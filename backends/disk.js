var path = require('path');
var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;

var LoggerStream = require('./logger-stream.js');
var File = require('../lib/mkdir-file.js');

function DiskBackend(opts) {
    if (!(this instanceof DiskBackend)) {
        return new DiskBackend(opts);
    }

    if (!opts.folder) {
        throw new Error('DiskBackend: opts.folder is required');
    }

    EventEmitter.call(this);

    this.folder = opts.folder;
    this.json = opts.json || false;
}

inherits(DiskBackend, EventEmitter);

DiskBackend.prototype.createStream =
    function createStream(meta, opts) {
        var fileName = meta.team + '-' + meta.project + '.log';
        var logger = new File({
            filename: path.join(this.folder, fileName),
            json: this.json
        });

        return LoggerStream(logger, {
            highWaterMark: opts.highWaterMark
        });
    };

module.exports = DiskBackend;
