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

'use strict';

var test = require('tape');

var Logger = require('../logger.js');

require('./default-backends.js');
require('./circular-objects.js');
require('./backend-without-destroy.js');
require('./console-errors.js');
require('./console.js');
require('./errors-in-backend.js');
require('./errors-with-all-backends.js');
require('./file-errors.js');
require('./file.js');
require('./instrument.js');
require('./kafka-errors.js');
require('./kafka.js');
require('./optional-backends.js');
require('./pid-and-host.js');
require('./sentry-errors.js');
require('./sentry.js');
require('./stats.js');
require('./throws-assertions.js');
require('./access.js');
require('./leaky-backend-master.js');
require('./kafka-is-disabled.js');
require('./child-logger.js');
require('./buffer-objects.js');
require('./raw-logger.js');
require('./writing-weird-meta-objects.js');

test('removing levels', function t(assert) {
    var logger = Logger({
        backends: {},
        meta: {},
        levels: {
            trace: null
        }
    });

    assert.equal(logger.trace, undefined);

    assert.end();
});
