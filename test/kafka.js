var test = require('tape');
var test = require('tape');
var KafkaServer = require(
    'kafka-logger/test/lib/kafka-server.js');

var Logger = require('../logger.js');
var KafkaBackend = require('../backends/kafka.js');

test('kafka logging', function (assert) {
    var server = KafkaServer(function onMessage(msg) {
        assert.equal(msg.topic, 'rt-foobar');

        var obj = msg.messages[0].payload;

        assert.equal(obj.level, 'info');
        assert.ok(obj.msg.indexOf('writing to kafka') !== -1);

        server.close();
        logger.destroy();
        assert.end();
    });

    var logger = Logger({
        meta: {
            team: 'rt',
            project: 'foobar'
        },
        backends: {
            kafka: KafkaBackend({
                leafHost: 'localhost',
                leafPort: server.port
            })
        }
    });

    logger.info('writing to kafka');
});
