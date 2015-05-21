'use strict';

var test = require('tape');

var FileLogger = require('./lib/file-logger.js');

test('writing a circular object (disk)', function t(assert) {
    var logger = FileLogger({
        json: true
    });

    logger.info('cool story', 'some str', function log(err) {
        assert.ifError(err);

        logger.readFile(function (err, buf) {
            assert.ifError(err);

            var value = JSON.parse(String(buf));
            assert.equal(value.nonObjectMeta, 'some str');
            assert.equal(value.message, 'cool story');
            assert.equal(value.level, 'info');

            logger.destroy();
            assert.end();
        });
    });
});
