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

var assert = require('assert');
var Writable = require('readable-stream/writable');

var Logger = require('../logger.js');

// var counter = 0;
var startRSS = process.memoryUsage().rss;

console.log('# Logger supports back pressure');

var backend = {
    createStream: function () {
        return LeakStream();
    }
};

var logger = Logger({
    meta: {},
    backends: {
        myBackend: backend
    },
    levels: {
        info: {
            backends: ['myBackend'],
            level: 30
        }
    }
});

var onceA = checkedWrite(logger);
// console.log('onceA', onceA);
eqaulTAP(onceA.after.stream.length, 1000,
    'onceA stream length is 1000');
eqaulTAP(onceA.after.stream.buffer, 999,
    'onceA stream buffer is 999');

var deltaA = memoryGrowth(onceA);
eqaulTAP(deltaA > 2.5, true,
    'expected deltaA to be greater then 5 but found ' + deltaA);

setTimeout(function () {
    var onceB = checkedWrite(logger);
    // console.log('onceB', onceB);
    eqaulTAP(onceB.after.stream.length, 1000,
        'onceB stream length is 1000');
    eqaulTAP(onceB.after.stream.buffer, 999,
        'onceB stream buffer is 999');

    var deltaB = memoryGrowth(onceB);

    eqaulTAP(deltaB < 1, true,
        'expected deltaB to be less then 1 but found ' + deltaB);

    setTimeout(function () {
        var onceC = checkedWrite(logger);
        // console.log('onceC', onceC);
        eqaulTAP(onceC.after.stream.length, 1000,
            'onceC stream length is 1000');
        eqaulTAP(onceC.after.stream.buffer, 999,
            'onceC stream length is 999');

        var deltaC = memoryGrowth(onceC);

        eqaulTAP(deltaC < 0.5, true,
            'expected deltaC to be less then 1 but found ' +
            deltaC);

        logger.destroy();
    }, 50);
}, 50);

function memoryGrowth(x) {
    return (
        (x.after.mem.rss - startRSS) / 
        (x.before.mem.rss - startRSS)
    ) - 1;
}

function checkedWrite(logger) {
    var LOOP = 2e4; // write 2k items, hwm is 1k

    var before = inspect(logger);

    for (var i = 0; i < LOOP; i++) {
        logger.info('some message', {
            random: 'junk'
        });
    }

    return {
        before: before,
        after: inspect(logger)
    };
}

function LeakStream() {
    var s = new Writable({
        objectMode: true,
        highWaterMark: 1000
    });
    s._write = function leak(chunk, enc, cb) {
        // do not call the cb()
        // ignore the chunk
        // infinite memory leak.
    };
    return s;
}

function inspect(logger) {
    var state = logger.streams.myBackend._writableState;

    return {
        mem: process.memoryUsage(),
        stream: {
            length: state.length,
            buffer: state.buffer.length
            // ,keys: Object.keys(state)
        }
    };
}

function eqaulTAP(a, b, message) {
    try {
        assert.equal(a, b, message);
        console.log('ok ' + message);
    } catch (err) {
        console.log('not ok ' + message);
        throw err;
    }
}
