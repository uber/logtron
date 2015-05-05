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
            isDisabled: clients.isKafkaDisabled,
            statsd: clients.statsd,
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
