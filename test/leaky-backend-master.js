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
