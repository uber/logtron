'use strict';

var Logger = require('../../logger.js');
var ConsoleBackend = require('../../backends/console.js');

module.exports = createLogger;

function createLogger(opts) {
    return Logger({
        meta: {},
        backends: {
            console: ConsoleBackend({
                raw: opts ? opts.raw : false
            })
        }
    });
}
