var test = require('tape');

var captureStdio = require('./lib/capture-stdio.js');
var FatLogger = require('./lib/fat-logger.js');

test('can error(message, { err: err })', function t(assert) {
    var kafkaMessages = [];
    var sentryMessages = [];
    var logger = FatLogger({
        raw: true,
        json: true,
        kafkaListener: kafkaListener,
        sentryListener: sentryListener
    });

    var streams = logger._streamsByLevel.error;
    assert.ok(streams[3].name === 'sentry');
    // insert sentry as the first stream
    streams.unshift(streams.pop());
    assert.ok(streams[0].name === 'sentry');

    var consoleBuf = captureStdio(null, function logError() {
        logger.error('some message', {
            err: new Error('hello'),
            other: 'key'
        }, function delay() {
            // delay by 100ms for sentry
            setTimeout(onLogged, 100);
        });
    }, {
        raw: true
    });

    function onLogged() {
        assert.equal(consoleBuf.length, 1);
        var consoleObj = JSON.parse(consoleBuf[0]);

        // console.log('consoleObj', consoleObj);

        assert.ok(consoleObj.err);
        assert.ok(consoleObj.err.stack);
        assert.equal(consoleObj.err.message, 'hello');
        assert.equal(consoleObj.other, 'key');
        assert.equal(consoleObj.message, 'some message');

        assert.equal(kafkaMessages.length, 1);
        var payload = kafkaMessages[0].messages[0].payload;

        // console.log('p', payload);

        assert.ok(payload.fields.err);
        assert.ok(payload.fields.err.stack);
        assert.equal(payload.fields.err.message, 'hello');
        assert.equal(payload.fields.other, 'key');
        assert.equal(payload.msg, 'some message');

        assert.equal(sentryMessages.length, 1);
        var sentryMsg = sentryMessages[0];

        // console.log('what.', sentryMsg);
        
        assert.equal(sentryMsg.extra.other, 'key');
        assert.equal(sentryMsg.extra.originalMessage,
            'some message');
        assert.equal(sentryMsg.message,
            'Error: errors-with-all-backends.js: hello');
        var stackTrace = sentryMsg['sentry.interfaces.Stacktrace'];
        assert.ok(stackTrace.frames.length);

        logger.readFile(function onFile(err, file) {
            assert.ifError(err);

            var lines = file.split('\n')
                .filter(Boolean)
                .map(JSON.parse);

            assert.equal(lines.length, 1);
            var diskObj = lines[0];

            assert.ok(diskObj.err);
            assert.ok(diskObj.err.stack);
            assert.equal(diskObj.err.message, 'hello');
            assert.equal(diskObj.other, 'key');
            assert.equal(diskObj.message, 'some message');

            logger.destroy();
            assert.end();
        });
    }

    function kafkaListener(msg) {
        kafkaMessages.push(msg);
    }

    function sentryListener(msg) {
        sentryMessages.push(msg);
    }
});
