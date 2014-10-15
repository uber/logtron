var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;

var ConsoleLogger = require('../lib/async-console-transport.js');
var LoggerStream = require('./logger-stream.js');

function ConsoleBackend() {
    if (!(this instanceof ConsoleBackend)) {
        return new ConsoleBackend();
    }

    EventEmitter.call(this);
}

inherits(ConsoleBackend, EventEmitter);

ConsoleBackend.prototype.createStream = function createStream() {
    var logger = new ConsoleLogger({
        timestamp: true
    });

    return LoggerStream(logger);
};

module.exports = ConsoleBackend;
