var test = require('tape');
var test = require('tape');
var KafkaServer = require(
    'kafka-logger/test/lib/kafka-server.js');

var Logger = require('../index.js');

test('kafka is disabled', function (assert) {
    var server = KafkaServer(function onMessage(msg) {
        server.emit('message', msg);
    });

    var isDisabledFlag = false;
    var logger = Logger({
        meta: {
            team: 'rt',
            project: 'foobar'
        },
        backends: Logger.defaultBackends({
            kafka: {
                leafHost: 'localhost',
                leafPort: server.port,
                
            }
        }, {
            isKafkaDisabled: function isDisabled() {
                return isDisabledFlag;
            }
        })
    });

    logger.info('writing to kafka');
    server.once('message', function (msg) {
        assert.ok(msg);

        isDisabledFlag = true;
        logger.info('writing to kafka', {});
        server.on('message', failure);

        setTimeout(function onTimeout() {
            isDisabledFlag = false;
            server.removeListener('message', failure);

            logger.info('writing to kafka', {});
            server.once('message', function (msg) {
                assert.ok(msg);

                logger.destroy();
                server.close();
                assert.end();
            });
        }, 1000);

        function failure(msg) {
            assert.ok(false, 'unexpected message');
        }
    });
});
