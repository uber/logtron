var TypedError = require('error/typed');

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
var LevelRequired = TypedError({
    type: 'rt-logger.child-logger-requires-additional-level',
    message: 'rt-logger: Logger must configure at least one ' +
        'backend to store log level {level} produced by child logger.\n'
});

module.exports = {
    OptsRequired: OptsRequired,
    MetaRequired: MetaRequired,
    BackendsRequired: BackendsRequired,
    LevelRequired: LevelRequired
};
