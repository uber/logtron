var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;

var ConsoleLogger = require('../lib/async-console-transport.js');
var LoggerStream = require('./logger-stream.js');

function ConsoleBackend(opts) {
    if (!(this instanceof ConsoleBackend)) {
        return new ConsoleBackend(opts);
    }

    this.raw = opts ? opts.raw : false;

    EventEmitter.call(this);
}

inherits(ConsoleBackend, EventEmitter);

ConsoleBackend.prototype.createStream =
    function createStream(meta, opts) {
        var logger = new ConsoleLogger({
            timestamp: true,
            raw: this.raw
        });

        return LoggerStream(logger, {
            highWaterMark: opts.highWaterMark
        });
    };

module.exports = ConsoleBackend;
