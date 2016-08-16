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

var KafkaServer = require('./kafka-rest-server.js');
var Logger = require('../../index.js');

module.exports = KafkaLogger;

function KafkaLogger(listener) {
    var server = KafkaServer(listener);

    var logger = Logger({
        meta: {
            team: 'rt',
            project: 'foo'
        },
        backends: Logger.defaultBackends({
            kafka: {
                proxyHost: 'localhost',
                proxyPort: server.port
            }
        })
    });

    var _destroy = logger.destroy;
    logger.destroy = function () {
        if (server) {
            server.close();
        }

        _destroy.apply(this, arguments);
    };

    return logger;
}
