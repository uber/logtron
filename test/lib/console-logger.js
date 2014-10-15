var Logger = require('../../logger.js');
var ConsoleBackend = require('../../backends/console.js');

module.exports = createLogger;

function createLogger() {
    return Logger({
        meta: {},
        backends: {
            console: ConsoleBackend()
        }
    });
}
