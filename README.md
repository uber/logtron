# logtron

[![build status](https://secure.travis-ci.org/uber/logtron.png)](http://travis-ci.org/uber/logtron)

logger used in realtime

## Example

```js
var Logger = require('logtron/logger');
var Disk = require('logtron/backends/disk');
var Console = require('logtron/backends/console');
var Kafka = require('logtron/backends/kafka');
var Sentry = require('logtron/backends/sentry');

var statsd =  StatsdClient(...)

/*  configure your logger

     - pass in meta data to describe your service
     - pass in your backends of choice
*/
var logger = Logger({
    meta: {
        team: 'my-team',
        project: 'my-project'
    },
    backends: {
        disk: Disk({
            folder: '/var/log/nodejs'
        }),
        console: Console(),
        // pass in a statsd client to turn on an airlock prober
        // on the kafka connection
        kafka: Kafka({
            host: 'localhost',
            port: 2181,
            statsd: statsd
        }),
        // pass in a statsd client to turn on an airlock prober
        // on the sentry connection
        sentry: Sentry({
            dsn: '{sentryId}',
            statsd: statsd
        })
    }
});

/* now write your app and use your logger */
var http = require('http');

var server = http.createServer(function (req, res) {
    logger.info('got a request', {
        uri: req.url
    });

    res.end('hello world');
});

server.listen(8000, function () {
    var addr = server.address();
    logger.info('server bound', {
        port: addr.port,
        address: addr.address
    });
});

/* maybe some error handling */
server.on("error", function (err) {
    logger.error("unknown server error", err);
});
```

## Docs

### Type definitions

See [docs.mli](docs.mli) for type definitions

### `var logger = Logger(options)`

```ocaml
type Backend := {
    createStream: (meta: Object) => WritableStream
}

logtron/logger := ({
    meta: {
        team: String,
        project: String,
        hostname: String,
        pid: Number
    },
    backends: Object<backendName: String, Backend>,
    transforms?: Array<Function>
}) => logger: {
    trace: (String, Object, cb?: Callback) => void,
    debug: (String, Object, cb?: Callback) => void,
    info: (String, Object, cb?: Callback) => void,
    warn: (String, Object, cb?: Callback) => void,
    error: (String, Object, cb?: Callback) => void,
    fatal: (String, Object, cb?: Callback) => void,
    destroy: ({
        createStream: (meta: Object) => WritableStream
    }) => void
}
```

`Logger` takes a set of meta information for the logger, that
  will be used by each backend to customize the log formatting
  and a set of backends that you want to be able to write to.

`Logger` returns a logger object that's very similar to
  `console` but with a few extra methods.

#### `options.meta.name`

`options.meta.name` is the name of your application, you should
  supply a string for this option. Various backends may use
  this value to configure themselves.

For example the `Disk` backend uses the `name` to create a
  filename for you.

#### `options.meta.team`

`options.meta.team` is the name of the team that this application
  belongs to. Various backends may use this value to configure
  themselves.

For example the `Disk` backend uses the` team` to create a
  filename for you.

####`options.meta.hostname`

`options.meta.hostname` is the the hostname of the server this
  application is running on. You can use
  `require('os').hostname()` to get the hostname of your process.
  Various backends may use this value to configure themselves.

For example the `Sentry` backend uses the `hostname` as meta
  data to send to sentry so you can identify which host caused
  the sentry error in their visual error inspector.

#### `options.meta.pid`

`options.meta.pid` is the `pid` of your process. You can get the
  `pid` of your process by reading `process.pid`. Various
  backends may use this value to configure themselves.

For example the `Disk` backend or `Console` backend may prepend
  all log messages or somehow embed the process pid in the log
  message. This allows you to tail a log and identify which
  process misbehaves.

#### `options.backends`

`options.backends` is how you specify the backends you want to
  set for your logger. `backends` should be an object of key
  value pairs, where the key is the name of the backend and the
  value is something matching the `Backend` interface.

Out of the box, the `logger` comes with four different backend
  names it supports, `"disk"`, `"console"`, `"kafka"`
  and `"sentry"`.

If you want to disable a backend, for example `"console"` then
  you should just not pass in a console backend to the logger.

A valid `Backend` is an object with a `createStream` method.
  `createStream` gets passed `options.meta` and must return a
  `WritableStream`.

There are a set of functions in `logtron/backends` that you
  require to make the specifying of backends easier.

 - `require('logtron/backends/disk')`
 - `require('logtron/backends/console')`
 - `require('logtron/backends/kafka')`
 - `require('logtron/backends/sentry')`

#### `options.transforms`

`options.transforms` is an optional array of transform functions.
  The transform functions get called with
  `[levelName, message, metaObject]` and must return a tuple of
  `[levelName, message, metaObject]`.

A `transform` is a good place to put transformation logic before
  it get's logged to a backend.

Each funciton in the transforms array will get called in order.

A good use-case for the transforms array is pretty printing
  certain objects like `HttpRequest` or `HttpResponse`. Another
  good use-case is scrubbing sensitive data

#### `logger`

`Logger(options)` returns a `logger` object. The `logger` has
  a set of logging methods named after the levels for the
  logger and a `destroy()` method.

Each level method (`info()`, `warn()`, `error()`, etc.) takes
  a string and an object of more information. You can also pass
  in an optional callback as the third parameter.

The `string` message argument to the level method should be
  a static string, not a dynamic string. This allows anyone
  analyzing the logs to quickly find the callsite in the code
  and anyone looking at the callsite in the code to quickly
  grep through the logs to find all prints.

The `object` information argument should be the dynamic
  information that you want to log at the callsite. Things like
  an id, an uri, extra information, etc are great things to add
  here. You should favor placing dynamic information in the 
  information object, not in the message string.

Each level method will write to a different set of backends.

See [bunyan level descriptions][bunyan] for more / alternative 
  suggestions around how to use levels.

#### `logger.trace(message, information, callback?)`

`trace()` will write your log message to the
  `["console"]` backends.

Note that due to the high volume nature of `trace()` it should
  not be spamming `"disk"`.

`trace()` is meant to be used to write tracing information to
  your logger. This is mainly used for high volume performance
  debugging.

It's expected you change the `trace` level configuration to
  basically write nowhere in production and be manually toggled
  on to write to local disk / stdout if you really want to 
  trace a production process.

#### `logger.debug(message, information, callback?)`

`debug()` will write your log message to the 
  `["disk", "console"]` backends.

Note that due to the higher volume nature of `debug()` it should
  not be spamming `"kafka"`.

`debug()` is meant to be used to write debugging information.
  debugging information is information that is purely about the
  code and not about the business logic. You might want to 
  print a debug if there is a programmer bug instead of an 
  application / business logic bug.

If your going to add a high volume `debug()` callsite that will
  get called a lot or get called in a loop consider using
  `trace()` instead.

It's expected that the `debug` level is enabled in production
  by default.

#### `logger.info(message, information, callback?)`

`info()` will write your log message to the 
  `["disk", "kafka", "console"]` backends.

`info()` is meant to used when you want to print informational
  messages that concern application or business logic. These
  messages should just record that a "useful thing" has happened.

You should use `warn()` or `error()` if you want to print that
  a "strange thing" or "wrong thing" has happened

If your going to print information that does not concern
  business or application logic consider using `debug()` instead.

#### `logger.warn(message, information, callback?)`

`warn()` will write your log message to the 
  `["disk", "kafka", "console"]` backends.

`warn()` is meant to be used when you want to print warning
  messages that concern application or business logic. These
  messages should just record that an "unusual thing" has
  happened. 

If your in a code path where you cannot recover or continue
  cleanly you should consider using `error()` instead. `warn()`
  is generally used for code paths that are correct but not
  normal.

#### `logger.error(message, information, callback?)`

`error()` will write your log message to the 
  `["disk", "kafka", "console", "sentry"]` backends.

Note that due to importance of error messages it should be
  going to `"sentry"` so we can track all errors for an 
  application using sentry.

`error()` is meant to be used when you want to print error
  messages that concern application or business logic. These
  messages should just record that a "wrong thing" has happened.

You should use `error()` whenever something incorrect or 
  unhandlable happens.

If your in a code path that is uncommon but still correct 
  consider using `warn()` instead. 

#### `logger.fatal(message, information, callback?)`

`fatal()` will write your log message to the 
  `["disk", "kafka", "console", "sentry"]` backends.

`fatal()` is meant to be used to print a fatal error. A fatal
  error should happen when something unrecoverable happens, i.e.
  it is fatal for the currently running node process.

You should use `fatal()` when something becomes corrupt and it
  cannot be recovered without a restart or when key part of
  infrastructure is fatally missing. You should also use
  `fatal()` when you interact with an unrecoverable error.

If your error is recoverable or you are not going to shutdown
  the process you should use `error()` instead.

It's expected that shutdown the process once you have verified
  that the `fatal()` error message has been logged. You can
  do either a hard or soft shutdown.

### Logging Errors

> I want to log errors when I get them in my callbacks

The `logger` supports passing in an `Error` instance as the 
  metaObject field.

For example:

```js
fs.readFile(uri, function (err, content) {
    if (err) {
        logger.error('got file error', err);
    }
})
```

If you want to add extra information you can also make the err
  one of the keys in the meta object.

For example:

```js
fs.readFile(uri, function (err, content) {
    if (err) {
        logger.error('got file error', {
            error: err,
            uri: uri
        });
    }
})
```

### Custom levels

> I want to add my own levels to the logger, how can I tweak
> the logger to use different levels

By default the logger has the levels as specified above.

However you can pass in your own level definition.

#### I want to remove a level

You can set a level to `null` to remove it. For example this is
how you would remove the `trace()` level.

```js
var logger = Logger({
    meta: { ... },
    backends: { ... },
    levels: {
        trace: null
    }
})
```

#### I want to add my own levels

You can add a level to a logger by adding a new `Level` record.

For example this is how you would define an `access` level

```js
var logger = Logger({
    meta: {},
    backends: {},
    levels: {
        access: {
            level: 25,
            backends: ['disk', 'console']
        }
    }
})

logger.access('got request', {
    uri: '/some-uri'
});
```

This adds an `access()` method to your logger that will write
  to the backend named `"disk"` and the backend named
  `"console"`.

#### I want to change an existing level

You can change an existing backend by just redefining it.

For example this is how you mute the trace level

```js
var logger = Logger({
    meta: {},
    backends: {},
    levels: {
        trace: {
            level: 10,
            backends: []
        }
    }
})
```

#### I want to add a level that writes to a custom backend

You can add a level that writes to a new backend name and then
  add a backend with that name

```js
var logger = Logger({
    meta: {},
    backends: {
        custom: CustomBackend()
    },
    levels: {
        custom: {
            level: 15,
            backends: ["custom"]
        }
    }
})

logger.custom('hello', { foo: "bar" });
```

As long as your `CustomBackend()` returns an object with a 
  `createStream()` method that returns a `WritableStream` this
  will work like you want it to.

### `var backend = Console()`

```ocaml
logtron/backends/console := () => {
    createStream: (meta: Object) => WritableStream
}
```

`Console()` can be used to create a backend that writes to the
  console.

The `Console` backend just writes to stdout.

### `var backend = Disk(options)`

```ocaml
logtron/backends/disk := (options: {
    folder: String
}) => {
    createStream: (meta: Object) => WritableStream
}
```

`Disk(options)` can be used to create a backend that writes to
  rotating files on disk.

The `Disk` depends on `meta.team` and `meta.project` to be
  defined on the logger and it uses those to create the filename
  it will write to.

#### `options.folder`

`options.folder` must be specificied as a string and it
  determines which folder the `Disk` backend will write to.

### `var backend = Kafka(options)`

```ocaml
logtron/backends/kafka := (options: {
    host: String,
    port: Number,
    statsd?: Object
}) => {
    createStream: (meta: Object) => WritableStream
}
```

`Kafka(options)` can be used to create a backend that writes to
  a kafka topic. 

The `Kafka` backend depends on `meta.team` and `meta.project`
  and uses those to define which topic it will write to.

#### `options.host`

Specify the `host` which we should use when connecting to kafka

#### `options.port`

Specify the `port` which we should use when connecting to kafka

#### `options.statsd`

If you pass a `statsd` client to the `Kafka` backend it will use
  the `statsd` client to record information about the health
  of the `Kafka` backend.

### `var backend = Sentry(options)`

```ocaml
logtron/backends/sentry := (options: {
    dsn: String,
    statsd?: Object
}) => {
    createStream: (meta: Object) => WritableStream
}
```

`Sentry(options)` can be used to create a backend that will
  write to a sentry server.

#### `options.dsn`

Specify the `dsn` host to be used when connection to sentry.

#### `options.statsd`

If you pass a `statsd` client to the `Sentry` backend it will
  use the `statsd` client to record information about the
  health of the `Sentry` backend.

## Installation

`npm install logtron`

## Tests

`npm test`

There is a `kafka.js` that will talk to kafka if it is running
and just gets skipped if its not running.

To run the kafka test you have to run zookeeper & kafka with
  `npm run start-zk` and `npm run start-kafka`

  [bunyan]: https://github.com/trentm/node-bunyan#levels
