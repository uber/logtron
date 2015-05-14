// captureStdio := (String, Function) => Boolean
// runs the function and intercepts and logs whilst the
// function is running. Then returns boolean based on 
// whether the expected substring is in the logs
function captureStdio(expected, fn, opts) {
    var buf = [];

    var _errwrite = process.stderr.write;
    var _outwrite = process.stdout.write;
    process.stdout.write = outwrite;
    process.stderr.write = errwrite;

    fn();

    process.stdout.write = _outwrite;
    process.stderr.write = _errwrite;

    if (opts && opts.raw) {
        return buf;
    }

    return buf.some(function (line) {
        return line.indexOf(expected) !== -1;
    });

    function outwrite(msg, cb) {
        buf.push(msg.toString());

        if (opts && opts.passthrough) {
            return _outwrite.apply(this, arguments);
        }

        if (cb) cb();
        return true;
    }

    function errwrite(msg, cb) {
        buf.push(msg.toString());

        if (opts && opts.passthrough) {
            return _errwrite.apply(this, arguments);
        }

        if (cb) cb();
        return true;
    }
}

module.exports = captureStdio;
