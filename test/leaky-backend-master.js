var test = require('tape');
var exec = require('child_process').exec;

test('spawn leaky-backend.js', function (assert) {
    exec('node leaky-backend.js', {
        cwd: __dirname
    }, function (err, stdout, stderr) {
        assert.ifError(err);

        assert.equal(stdout,
            '# Logger supports back pressure\n');
        assert.equal(stderr, '');

        assert.end();
    });
});
