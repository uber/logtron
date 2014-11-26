var test = require('tape');
var exec = require('child_process').exec;

test('spawn leaky-backend.js', function (assert) {
    exec('node leaky-backend.js', {
        cwd: __dirname
    }, function (err, stdout, stderr) {
        assert.ifError(err);

        assert.notEqual(
            stdout.indexOf('# Logger supports back pressure\n'),
            -1);
        assert.equal(stdout.indexOf('not ok'), -1);
        assert.equal(stderr, '');

        var lines = stdout.split('\n');
        lines.forEach(function (k) {
            if (k[0] === '#') {
                console.log(k);
            }

            if (k.substr(0, 3) === 'ok ') {
                assert.ok(true, k.substr(3));
            }

            if (k.substr(0, 6) === 'not ok ') {
                assert.ok(false, k.substr(6));
            }
        });

        assert.end();
    });
});
