var test = require('tape');
var http = require('http');
var zlib = require('zlib');
var body = require('body');

var Logger = require('../logger.js');
var SentryBackend = require('../backends/sentry.js');

test('sentry logging', function (assert) {
    var PORT = 20000 + Math.round(Math.random() * 10000);
    var dsn = 'http://public:private@localhost:' + PORT + '/269';

    var server = http.createServer(function (req, res) {
        body(req, res, function (err, body) {
            assert.equal(req.method, 'POST');
            assert.equal(req.url, '/api/269/store/');
            assert.ok(req.headers['x-sentry-auth']);
            assert.ok(body.length > 0);

            var buf = new Buffer(body, 'base64');
            zlib.inflate(buf, function (err, str) {
                var json = JSON.parse(String(str));

                assert.equal(json.message, 'sentry.js: oh hi');
                server.close();
                res.end();
                assert.end();
            });
        });
    });
    server.listen(PORT);

    var logger = Logger({
        backends: {
            sentry: SentryBackend({ dsn: dsn })
        },
        meta: {}
    });

    assert.ok(logger);

    logger.error('oh hi');
});
