var assert = require('assert');
var Writable = require('readable-stream/writable');

var Logger = require('../logger.js');

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
assert.equal(onceA.after.stream.length, 1000);
assert.equal(onceA.after.stream.buffer, 999);

var deltaA = memoryGrowth(onceA);

assert.ok(deltaA > 5,
    'expected deltaA to be greater then 5 but found ' + deltaA);

setTimeout(function () {
    var onceB = checkedWrite(logger);
    // console.log('onceB', onceB);
    assert.equal(onceB.after.stream.length, 1000);
    assert.equal(onceB.after.stream.buffer, 999);

    var deltaB = memoryGrowth(onceB);

    assert.ok(deltaB < 1,
        'expected deltaB to be less then 0.1 but found ' + deltaB);

    setTimeout(function () {
        var onceC = checkedWrite(logger);
        // console.log('onceC', onceC);
        assert.equal(onceC.after.stream.length, 1000);
        assert.equal(onceC.after.stream.buffer, 999);

        var deltaC = memoryGrowth(onceC);

        assert.ok(deltaC < 0.1);

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
