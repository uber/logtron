'use strict';

var test = require('tape');

var captureStdio = require('./lib/capture-stdio.js');
var ConsoleLogger = require('./lib/console-logger.js');
var FileLogger = require('./lib/file-logger.js');

test('writing a buffer object (console)', function t(assert) {
    var logger = ConsoleLogger({
        raw: true
    });

    var meta = allocMeta();

    assert.ok(captureStdio(
        '{"someKey":"hi","some":{"nestedKey":"oh hi"},' +
            '"level":"info","message":"cool story"}',
        function log() {
            logger.info('cool story', meta, function cb(err) {
                assert.ifError(err);

                logger.destroy();
                assert.end();
            });
        }));
});

test('writing a buffer object (disk)', function t(assert) {
    var logger = FileLogger({
        json: true
    });

    var meta = allocMeta();

    logger.info('cool story', meta, function log(err) {
        assert.ifError(err);

        logger.readFile(function onFile(err2, buf) {
            assert.ifError(err2);

            assert.notEqual(
                buf.indexOf(
                    '{"someKey":"hi","some":{"nestedKey":"oh hi"},' +
                    '"level":"info","message":"cool story"'
                ),
                -1
            );

            logger.destroy();
            assert.end();
        });
    });
});

function allocMeta() {
    var meta = {};
    meta.someKey = 'hi';
    meta.some = {
        nestedKey: 'oh hi'
    };

    return meta;
}
