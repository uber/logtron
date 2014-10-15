var path = require('path');
var os = require('os');
var uuid = require('uuid');
var rimraf = require('rimraf');
var fs = require('fs');
var dateFormat = require('date-format');

var Logger = require('../../logger.js');
var DiskBackend = require('../../backends/disk.js');

module.exports = createLogger;

function createLogger(opts) {
    opts = opts || {};

    var doCleanup = !opts.folder;

    if (!opts.folder) {
        opts.folder = path.join(os.tmpDir(), uuid());
    }

    var logger = Logger({
        meta: {
            team: 'rt',
            project: 'foobar'
        },
        backends: {
            disk: DiskBackend(opts)
        }
    });

    var _destroy = logger.destroy;
    logger.destroy = function destroy() {
        if (doCleanup) {
            rimraf.sync(opts.folder);
        }

        _destroy.apply(this, arguments);
    };

    logger.readFile = function readFile(callback) {
        var fileUri = 'rt-foobar.log-' + dateFormat('yyyyMMdd');
        var uri = path.join(opts.folder, fileUri);
        fs.readFile(uri, function (err, buf) {
            if (err) {
                return callback(err);
            }

            callback(null, String(buf));
        });
    };

    return logger;
}
