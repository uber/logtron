var test = require('tape');
var uuid = require('uuid');
var test = require('tape');
var net = require('net');
var NodeSol = require('nodesol').NodeSol;

var Logger = require('../logger.js');
var KafkaBackend = require('../backends/kafka.js');

test('kafka logging', function (assert) {
    var socket = net.connect({ host: 'localhost', port: 2181 });

    socket.once('connect', function () {
        socket.destroy();

        var logger = Logger({
            meta: {
                team: 'rt',
                project: 'foobar'
            },
            backends: {
                kafka: KafkaBackend({
                    host: 'localhost',
                    port: 2181
                })
            }
        });

        var client = new NodeSol({ host: 'localhost', port: 2181 });
        client.connect(function (err) {
            /*jshint camelcase: false*/
            assert.ifError(err);

            var proc = client.get_producer('rt-foobar');

            client.create_consumer(uuid(), 'rt-foobar', {}, function (stream) {
                if (!stream) {
                    assert.ok(false, 'no stream');
                    return assert.end();
                }

                stream.once('data', function (chunk) {
                    var obj = JSON.parse(String(chunk));

                    assert.equal(obj.level, 'info');
                    assert.ok(obj.msg.indexOf('writing to kafka') !== -1);

                    logger.destroy();
                    client.zk.close();
                    proc.connection.connection._connection.destroy();
                    stream.kafka_stop();
                    stream.client.socket.destroy();
                    assert.end();
                });

                logger.info('writing to kafka');
            });
        });
    });

    socket.once('error', function () {
        assert.ok(true, 'skipping kafka test');
        assert.end();
    });
});
