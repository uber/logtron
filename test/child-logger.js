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

var captureStdio = require('./lib/capture-stdio.js');

var Logger = require('../logger.js');
var ConsoleBackend = require('../backends/console.js');

function createLogger(meta) {
    return Logger({
        meta: meta || {},
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

test('grandchild logger path', function t(assert) {
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

test('child logger can merge parent meta', function t(assert) {
    var logger = createLogger({bar: 'baz'});
    var childLogger = logger.createChild(
        'child',
        {info: true},
        {extendMeta: true, meta: {foo: 'bar'}, mergeParentMeta: true}
    );

    assert.ok(captureStdio('info: child: hello bar=baz, foo=bar, who=world', function t() {
        childLogger.info('hello', { who: 'world' });
    }));

    assert.end();
});

test('child logger can merge grandparent meta', function t(assert) {
    var logger = createLogger({bar: 'baz'});
    var childLogger = logger.createChild(
        'child',
        {info: true},
        {extendMeta: true, meta: {foo: 'bar'}, mergeParentMeta: true}
    );
    var grandChildLogger = childLogger.createChild(
        'grandchild',
        {info: true},
        {extendMeta: true, meta: {baz: 'biz'}, mergeParentMeta: true}
    );

    assert.ok(captureStdio('info: child.grandchild: hello bar=baz, foo=bar, baz=biz, who=world', function t() {
        grandChildLogger.info('hello', { who: 'world' });
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

test('child logger can extend parent filtered meta', function t(assert) {
    var foo = {bar: 'baz', haz: 'cheez'};
    var logger = createLogger();
    var childLogger = logger.createChild(
        'child',
        {info: true},
        {extendMeta: true, metaFilter: [{object: foo, mappings:{bar:'fooBar'}}], mergeParentMeta: true}
    );
    var grandchildLogger = childLogger.createChild(
        'grandchild',
        {info: true},
        {extendMeta: true, metaFilter: [{object: foo, mappings:{haz:'has'}}], mergeParentMeta: true}
    );

    assert.ok(captureStdio('info: child.grandchild: hello fooBar=baz, has=cheez, who=world', function t() {
        grandchildLogger.info('hello', { who: 'world' });
    }));
    foo.bar = 'qux';
    foo.haz = 'burger';
    assert.ok(captureStdio('info: child.grandchild: hello fooBar=qux, has=burger, who=world', function t() {
        grandchildLogger.info('hello', { who: 'world' });
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
