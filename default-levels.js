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

var TRACE = 10;
var DEBUG = 20;
var INFO = 30;
var ACCESS = 35;
var WARN = 40;
var ERROR = 50;
var FATAL = 60;


var defaultBackends = ['file', 'disk', 'kafka', 'console'];

var defaultLevels = {
    trace: {
        backends: [],
        level: TRACE
    },
    debug: {
        backends: ['file', 'disk', 'console'],
        level: DEBUG
    },
    info: {
        backends: defaultBackends,
        level: INFO
    },
    access: {
        backends: ['file', 'disk', 'console', 'kafka', 'access'],
        level: ACCESS
    },
    warn: {
        backends: defaultBackends,
        level: WARN
    },
    error: {
        backends: ['file', 'disk', 'kafka', 'console', 'sentry'],
        level: ERROR
    },
    fatal: {
        backends: ['file', 'disk', 'kafka', 'console', 'sentry'],
        level: FATAL
    }
};

module.exports = defaultLevels;
