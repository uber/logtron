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

    this.properties = opts.properties || {};
    this.host = opts.host || 'localhost';
    this.port = opts.port || 2181;
    this.statsd = opts.statsd || null;
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
            host: this.host,
            port: this.port,
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

            logger.kafkaClient.zk.close();
        });
    };

module.exports = KafkaBackend;
