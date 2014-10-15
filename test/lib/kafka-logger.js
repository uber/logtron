var net = require('net');
var NodeSol = require('uber-nodesol').NodeSol;
var uuid = require('uuid');

var Logger = require('../../logger.js');
var KafkaBackend = require('../../backends/kafka.js');

module.exports = createLogger;

function createLogger(opts, cb) {
    if (typeof opts === 'function') {
        cb = opts;
        opts = null;
    }

    opts = opts || {};
    opts.port = opts.port || 2181;
    opts.host = opts.host || 'localhost';

    var socket = net.connect(opts);

    socket.once('connect', function () {
        socket.destroy();

        var logger = Logger({
            meta: {
                team: 'rt',
                project: 'foobar'
            },
            backends: {
                kafka: KafkaBackend(opts)
            }
        });

        var client = new NodeSol(opts);
        client.connect(function (err) {
            if (err) {
                return cb(err);
            }

            /*jshint camelcase: false*/
            var proc = client.get_producer('rt-foobar');

            client.create_consumer(uuid(), 'rt-foobar', {},
                function (stream) {
                    if (!stream) {
                        return cb(new Error('no stream'));
                    }

                    var _destroy = logger.destroy;
                    logger.destroy = function destroy() {
                        client.zk.close();
                        proc.connection.connection._connection.destroy();
                        stream.kafka_stop();
                        stream.client.socket.destroy();
                        _destroy.apply(this, arguments);
                    };

                    logger.readStream = function (listener) {
                        stream.once('data', function (chunk) {
                            listener(JSON.parse(String(chunk)));
                        });
                    };

                    cb(null, logger);
                });
        });

    });

    socket.once('error', function () {
        socket.destroy();

        cb(null, null);
    });
}
