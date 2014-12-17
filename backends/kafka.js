var KafkaLogger = require('kafka-logger');
var Prober = require('airlock');
var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;

var LoggerStream = require('./logger-stream.js');

function KafkaBackend(opts) {
    if (!(this instanceof KafkaBackend)) {
        return new KafkaBackend(opts);
    }

    EventEmitter.call(this);

    if (!opts) opts = {};

    if (opts.port || opts.host) {
        throw new Error('logtron.KafkaBackend: ' +
            'opts.host and opts.port are deprecated.\n' +
            'Please use opts.leafHost and opts.leafPort instead.');
    }

    this.properties = opts.properties || {};
    this.leafHost = opts.leafHost || 'localhost';
    this.leafPort = opts.leafPort || 9093;
    this.statsd = opts.statsd || null;
    this.kafkaClient = opts.kafkaClient || null;
    this.isDisabled = opts.isDisabled || null;
}

inherits(KafkaBackend, EventEmitter);

KafkaBackend.prototype.createStream =
    function createStream(meta, opts) {
        var topic = meta.team + '-' + meta.project;

        var logger = new KafkaLogger({
            topic: topic,
            properties: this.properties,
            dateFormats: {
                ts: 'pyepoch',
                isodate: 'iso'
            },
            leafHost: this.leafHost,
            leafPort: this.leafPort,
            kafkaClient: this.kafkaClient,
            isDisabled: this.isDisabled,
            kafkaProber: new Prober({
                title: 'kafka-winston',
                enabled: true,
                statsd: this.statsd
            })
        });

        return LoggerStream(logger, {
            highWaterMark: opts.highWaterMark
        }, function destroy() {
            /*jshint camelcase: false*/
            var producer = logger.kafkaClient.get_producer(topic);
            if (producer && producer.connection &&
                producer.connection.connection &&
                producer.connection.connection._connection
            ) {
                producer.connection.connection._connection.destroy();
            }

            if (logger.kafkaClient.zk) {
                logger.kafkaClient.zk.close();
            }
        });
    };

module.exports = KafkaBackend;
