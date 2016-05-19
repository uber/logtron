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

/*
 * console.js: Transport for outputting to the console
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

var util = require('util');
var common = require('winston-uber/lib/winston/common.js');
var Transport = require('winston-uber').Transport;
var format = require('date-format');

//
// ### function AsyncConsole (options)
// #### @options {Object} Options for this instance.
// Constructor function for the AsyncConsole transport object responsible
// for persisting log messages and metadata to a terminal or TTY.
//
var AsyncConsole = function (options) {
  Transport.call(this, options);
  options = options || {};

  this.json        = options.json        || false;
  this.colorize    = options.colorize    || false;
  this.prettyPrint = options.prettyPrint || false;
  this.timestamp   = typeof options.timestamp !== 'undefined' ? options.timestamp : false;
  this.timestampFormat = options.timestampFormat || null;
  this.label       = options.label       || null;

  if (this.json) {
    this.stringify = options.stringify || function (obj) {
      return JSON.stringify(obj, null, 2);
    };
  }
};

//
// Inherit from `winston.Transport`.
//
util.inherits(AsyncConsole, Transport);

//
// Expose the name of this Transport on the prototype
//
AsyncConsole.prototype.name = 'console';

//
// ### function log (level, msg, [meta], callback)
// #### @level {string} Level at which to log the message.
// #### @msg {string} Message to log
// #### @meta {Object} **Optional** Additional metadata to attach
// #### @callback {function} Continuation to respond to when complete.
// Core logging method exposed to Winston. Metadata is optional.
//
AsyncConsole.prototype.log = function (level, msg, meta, callback) {
  if (this.silent) {
    return callback(null, true);
  }

  var self = this,
      output;

  output = common.log({
    colorize:    this.colorize,
    json:        this.json,
    level:       level,
    message:     msg,
    meta:        meta,
    stringify:   this.stringify,
    timestamp:   this.timestampFormat ? function() {
      return format(self.timestampFormat, new Date());
    } : this.timestamp,
    prettyPrint: this.prettyPrint,
    raw:         this.raw,
    label:       this.label
  });

  if (level === 'error' || level === 'debug') {
    process.stderr.write(output + '\n', onwrite);
  } else {
    process.stdout.write(output + '\n', onwrite);
  }

  function onwrite(err) {
    if (err) {
      return callback(err);
    }

    self.emit('logged');
    callback(null, true);
  }
};

module.exports = AsyncConsole;
