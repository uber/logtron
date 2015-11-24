// Copyright (c) 2015 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

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
    this.proxyHost = opts.proxyHost || 'localhost';
    this.proxyPort = opts.proxyPort;
    this.maxRetries = opts.maxRetries || 1;
    this.blacklistMigrator = opts.blacklistMigrator || false;
    this.blacklistMigratorUrl = opts.blacklistMigratorUrl || null;
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
            proxyHost: this.proxyHost,
            proxyPort: this.proxyPort,
            maxRetries: this.maxRetries,
            blacklistMigrator: this.blacklistMigrator,
            blacklistMigratorUrl: this.blacklistMigratorUrl,
            kafkaClient: this.kafkaClient,
            isDisabled: this.isDisabled,
            statsd: this.statsd,
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
            if (logger.kafkaRestClient) {
                logger.kafkaRestClient.close();
            }
        });
    };

module.exports = KafkaBackend;
