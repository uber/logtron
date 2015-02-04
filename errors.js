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
    message: 'logtron: Logger must configure at least one ' +
        'backend to store log level {level} produced by child logger.\n'
});
var UniquePathRequired = TypedError({
    type: 'logtron.child-logger.unique-path.required',
    message: 'logtron: Child logger must be constructed with ' +
        'a unique path\n. {path} has already been used.\n'
});

module.exports = {
    OptsRequired: OptsRequired,
    MetaRequired: MetaRequired,
    BackendsRequired: BackendsRequired,
    LevelRequired: LevelRequired,
    UniquePathRequired: UniquePathRequired
};
