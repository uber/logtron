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

'use strict';

var Logger = require('./logger.js');
var File = require('./backends/file.js');
var Disk = require('./backends/disk.js');
var Kafka = require('./backends/kafka.js');
var Sentry = require('./backends/sentry.js');
var Console = require('./backends/console.js');

createLogger.defaultBackends = defaultBackends;
createLogger.File = File;
createLogger.Disk = Disk;
createLogger.Kafka = Kafka;
createLogger.Sentry = Sentry;
createLogger.Console = Console;
createLogger.Access = Disk;

module.exports = createLogger;

function createLogger(opts) {
    var backends = opts && opts.backends;
    var logger;

    var _isDefaultBackends = backends &&
        backends._isDefaultBackends;

    if (_isDefaultBackends) {
        delete backends._isDefaultBackends;
    }

    logger = Logger(opts);

    if (_isDefaultBackends) {
        Object.keys(backends).forEach(function hookEvents(key) {
            var backend = backends[key];

            if (!backend || typeof backend.on !== 'function') {
                return;
            }

            backend.on('info', logger.info.bind(logger));
            backend.on('warn', logger.warn.bind(logger));
        });
    }

    return logger;
}

function defaultBackends(config, clients) {
    config = config || {};
    clients = clients || {};

    return {
        _isDefaultBackends: true,
        file: config.logFile ? File({
            fileName: config.logFile
        }) : null,
        disk: config.logFolder ? Disk({
            folder: config.logFolder,
            json: config.json || false
        }) : null,
        kafka: config.kafka ? Kafka({
            leafHost: config.kafka.leafHost,
            leafPort: config.kafka.leafPort,
            batching: config.kafka.batching,
            proxyHost: config.kafka.proxyHost,
            proxyPort: config.kafka.proxyPort,
            blacklistMigrator: config.kafka.blacklistMigrator,
            blacklistMigratorUrl: config.kafka.blacklistMigratorUrl,
            isDisabled: clients.isKafkaDisabled,
            statsd: config.kafka.statsd,
            kafkaClient: clients.kafkaClient
        }) : null,
        console: config.console ? Console({
            raw: config.raw || false
        }) : null,
        sentry: config.sentry ? Sentry({
            dsn: config.sentry.id,
            statsd: clients.statsd
        }) : null,
        access: config.access ? Disk({
            folder: config.access.logFolder,
            json: config.json || false
        }) : null
    };
}
