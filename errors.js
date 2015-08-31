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

var TypedError = require('error/typed');

// The following errors predate the transition from rt-logger to
// logtron and for backward compatibility retain their old names.
var OptsRequired = TypedError({
    message: 'rt-logger: Must call Logger with opts argument.\n' +
        'Ensure you call `Logger({ ... })`.\n',
    type: 'rt-logger.options.required'
});
var MetaRequired = TypedError({
    type: 'rt-logger.options.meta.required',
    message: 'rt-logger: Must call Logger with "meta" key on ' +
        'opts.\n' +
        'Ensure you call `Logger({ meta: ... })`.\n'
});
var BackendsRequired = TypedError({
    type: 'rt-logger.options.backends.required',
    message: 'rt-logger: Must call Logger with "backends" key ' +
        'on opts.\n' +
        'Ensure you call `Logger({ backends: ... })`.\n'
});

// The following have been added since the transition to logtron.
var LevelRequired = TypedError({
    type: 'logtron.child-logger.additional-level.required',
    message: 'logtron: Child Logger in strict mode must configure at least one ' +
        'backend to store log level {level} produced by child logger.\n'
});
var UniquePathRequired = TypedError({
    type: 'logtron.child-logger.unique-path.required',
    message: 'logtron: Child logger must be constructed with ' +
        'a unique path\n. {path} has already been used.\n'
});
var LevelDisabled = TypedError({
    type: 'logtron.child-logger.additional-level.disabled',
    message: 'logtron: Child Logger could not enable level' +
        'because backend for {level} does not exist in parent.\n'
});
var FilterObjectRequired = TypedError({
    type: 'logtron.child-logger.meta-filter.missing-object',
    message: 'logtron: Child Logger requires an object key' +
        'containing an object in each filter.\n'
});
var FilterMappingsRequired = TypedError({
    type: 'logtron.child-logger.meta-filter.missing-mappings',
    message: 'logtron: Child Logger requires at least one mapping for' +
        'each filtered object.\n'
});
var FilterBadDst = TypedError({
    type: 'logtron.child-logger.meta-filter.bad-definition',
    message: 'logtron: Format for filters mappings is ' +
        'an object. Each key is the location in the target object to ' +
        'fetch the value from; each value is a string which is the ' +
        'the target destination on the meta object.\n'
});

module.exports = {
    OptsRequired: OptsRequired,
    MetaRequired: MetaRequired,
    BackendsRequired: BackendsRequired,
    LevelRequired: LevelRequired,
    UniquePathRequired: UniquePathRequired,
    LevelDisabled: LevelDisabled,
    FilterObjectRequired: FilterObjectRequired,
    FilterMappingsRequired: FilterMappingsRequired,
    FilterBadDst: FilterBadDst
};
