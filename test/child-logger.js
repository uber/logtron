
var test = require('tape');

var captureStdio = require('./lib/capture-stdio.js');

var Logger = require('../logger.js');
var ConsoleBackend = require('../backends/console.js');

function createLogger() {
    return Logger({
        meta: {},
        backends: {
            console: ConsoleBackend()
        },
        transforms: [
            pathPrefixTransform
        ]
    });
}

function pathPrefixTransform(entry) {
    return new entry.constructor(
        entry.level,
        (entry.path ? entry.path + ': ' : '') + entry.message,
        entry.meta,
        entry.path
    );
}

test('root logger paths', function t(assert) {
    var logger = createLogger();

    assert.ok(captureStdio('info: hello who=world', function capture() {
        logger.info('hello', { who: 'world' });
    }));

    assert.end();
});

test('child logger path', function t(assert) {
    var logger = createLogger();
    var childLogger = logger.createChild('child', {info: true});

    assert.ok(captureStdio('info: child: hello who=world', function t() {
        childLogger.info('hello', { who: 'world' });
    }));

    assert.end();
});

test('child logger path', function t(assert) {
    var logger = createLogger();
    var childLogger = logger.createChild('child');
    var grandchildLogger = childLogger.createChild('child');

    assert.ok(captureStdio('info: child.child: hello who=world', function t() {
        grandchildLogger.info('hello', { who: 'world' });
    }));

    assert.end();
});

test('child logger can extend meta', function t(assert) {
    var logger = createLogger();
    var childLogger = logger.createChild('child', {info: true}, {extendMeta: true, meta: {foo: 'bar'}});

    assert.ok(captureStdio('info: child: hello foo=bar, who=world', function t() {
        childLogger.info('hello', { who: 'world' });
    }));

    assert.end();
});

test('child logger can log filtered meta', function t(assert) {
    var foo = {bar: 'baz'};
    var logger = createLogger();
    var childLogger = logger.createChild('child', {info: true},
        {extendMeta: true, metaFilter: [{object: foo, mappings:{bar:'fooBar'}}]});

    assert.ok(captureStdio('info: child: hello fooBar=baz, who=world', function t() {
        childLogger.info('hello', { who: 'world' });
    }));
    foo.bar = 'qux';
    assert.ok(captureStdio('info: child: hello fooBar=qux, who=world', function t() {
        childLogger.info('hello', { who: 'world' });
    }));

    assert.end();
});

test('child logger can not be constructed ' +
    'without meta or fields when asked to extend meta', function t(assert) {

    var logger = createLogger();
    assert.throws(function () {
        logger.createChild('child', {info: true}, {extendMeta: true});
    });
    assert.end();
});

test('child logger can not be constructed ' +
    'with bad field config', function t(assert) {
    var foo = {bar: 'baz'};

    var logger = createLogger();
    assert.throws(function () {
        logger.createChild('child', {info: true}, 
            {extendMeta: true, metaFilter: [{mappings:{bar:'fooBar'}}]});
    });
    assert.throws(function () {
        logger.createChild('child1', {info: true}, 
            {extendMeta: true, metaFilter: [{object: foo}]});
    });
    assert.throws(function () {
        logger.createChild('child2', {info: true}, 
            {extendMeta: true, metaFilter: [{object: foo, mappings:{bar:{}}}]});
    });
    assert.end();
});

test('child logger can be constructed ' +
    'with extra levels without strict', function t(assert) {

    var logger = createLogger();
    var childLogger;
    assert.ok(captureStdio('warn: Child Logger Disabled level level=floop', function t() {
        childLogger = logger.createChild('child', {info: true, floop: true}, 'Got warning for disabled level');
    }));
    assert.ok(captureStdio('info: child: hello who=world', function t() {
        childLogger.info('hello', { who: 'world' });
    }), 'Enabled levels can log');
    assert.notok(captureStdio('floop: child: hello who=world', function t() {
        childLogger.floop('hello', { who: 'world' });
    }), 'Disabled levels do not log');

    assert.end();
});

test('child logger can not be constructed ' +
    'with extra levels with strict', function t(assert) {

    var logger = createLogger();
    assert.throws(function () {
        logger.createChild('child', {info: true, floop:true}, {strict: true});
    });
    assert.end();
});
