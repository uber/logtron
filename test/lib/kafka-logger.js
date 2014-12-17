'use strict';

var KafkaServer = require(
    'kafka-logger/test/lib/kafka-server.js');
var Logger = require('../../index.js');

module.exports = KafkaLogger;

function KafkaLogger(listener) {
    var server = KafkaServer(listener);

    var logger = Logger({
        meta: {
            team: 'rt',
            project: 'foo'
        },
        backends: Logger.defaultBackends({
            kafka: {
                leafHost: 'localhost',
                leafPort: server.port
            }
        })
    });

    var _destroy = logger.destroy;
    logger.destroy = function () {
        if (server) {
            server.close();
        }

        _destroy.apply(this, arguments);
    };

    return logger;
}
