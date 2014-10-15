var test = require('tape');

var FileLogger = require('./lib/file-logger.js');

test('can .error("message", new Error())', function (assert) {
    var logger = FileLogger();

    logger.error('hello', new Error('lulz'), function (err) {
        assert.ifError(err);

        logger.readFile(function (err, file) {
            assert.ifError(err);

            assert.notEqual(file.indexOf('error: hello'), -1);
            assert.notEqual(file.indexOf('message=lulz'), -1);
            assert.notEqual(
                file.indexOf('stack=Error: lulz'), -1);

            logger.destroy();
            assert.end();
        });
    });
});

test('can error("message", { error: Error() })', function (assert) {
    var logger = FileLogger();

    logger.error('some message', {
        error: new Error('some error'),
        other: 'key'
    }, function (err) {
        assert.ifError(err);

        logger.readFile(function (err, file) {
            assert.ifError(err);

            assert.notEqual(
                file.indexOf('error: some message'), -1);
            assert.notEqual(
                file.indexOf('message=some error'), -1);
            assert.notEqual(
                file.indexOf('stack=Error: some error'), -1);
            assert.notEqual(file.indexOf('other=key'), -1);

            logger.destroy();
            assert.end();
        });
    });
});

test('can error(msg, { someKey: Error() })', function (assert) {
    var logger = FileLogger();

    logger.error('some message', {
        someKey: new Error('some error'),
        other: 'key'
    }, function (err) {
        assert.ifError(err);

        logger.readFile(function (err, file) {
            assert.ifError(err);

            assert.notEqual(
                file.indexOf('error: some message'), -1);
            assert.notEqual(
                file.indexOf('message=some error'), -1);
            assert.notEqual(
                file.indexOf('stack=Error: some error'), -1);
            assert.notEqual(file.indexOf('other=key'), -1);

            logger.destroy();
            assert.end();
        });
    });
});
