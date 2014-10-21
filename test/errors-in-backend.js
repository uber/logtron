var test = require('tape');

var Logger = require('../logger.js');

test('returns error to callback', function (assert) {
    var logger = createLogger();

    logger.info('hello', {
        some: 'value'
    }, function (err) {
        assert.equal(err.message, 'write failed');
        assert.equal(err.errors[0].message, 'write failed');
        assert.equal(err.errors[0].streamName, 'disk');
        assert.equal(err.type, 'ValidationError');

        assert.end();
    });
});

test('error to emitter', function (assert) {
    var logger = createLogger();

    logger.on('error', function (err) {
        assert.equal(err.message, 'write failed');
        assert.equal(err.errors[0].message, 'write failed');
        assert.equal(err.errors[0].streamName, 'disk');
        assert.equal(err.type, 'ValidationError');

        assert.end();
    });

    logger.info('hello', {
        some: 'value'
    });
});

function createLogger() {
    return Logger({
        meta: {},
        backends: {
            disk: ErrorBackend()
        }
    });
}

function ErrorBackend() {
    return {
        createStream: function () {
            return {
                write: function (chunk, cb) {
                    cb(new Error('write failed'));
                },
                _writableState: {}
            };
        }
    };
}
