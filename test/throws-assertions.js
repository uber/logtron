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

var Logger = require('../logger.js');

test('Logger() throws', function (assert) {
    var error = tryCatch(function () {
        Logger();
    });

    assert.ok(error);
    assert.equal(error.type, 'rt-logger.options.required');

    assert.end();
});

test('Logger({ meta: null }) throws', function (assert) {
    var error = tryCatch(function () {
        Logger({ meta: null });
    });

    assert.ok(error);
    assert.equal(error.type, 'rt-logger.options.meta.required');

    assert.end();
});

test('Logger({ meta: {}, backends: null }) throws', function (assert) {
    var error = tryCatch(function () {
        Logger({ meta: {}, backends: null });
    });

    assert.ok(error);
    assert.equal(error.type,
        'rt-logger.options.backends.required');

    assert.end();
});

function tryCatch(fn) {
    try {
        fn();
        return null;
    } catch (err) {
        return err;
    }
}
