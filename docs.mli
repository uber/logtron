type StatsdClient : Object
type KafkaClient : Object

type LogtronLogger := EventEmitter & Logger & {
    instrument: (server?: HttpServer, opts?: Object) => void,
    destroy: ({
        createStream: (meta: Object) => WritableStream
    }) => void
}

type Logger := {
    trace: (message: String, meta: Object, cb? Callback) => void,
    debug: (message: String, meta: Object, cb? Callback) => void,
    info: (message: String, meta: Object, cb? Callback) => void,
    access?: (message: String, meta: Object, cb? Callback) => void,
    warn: (message: String, meta: Object, cb? Callback) => void,
    error: (message: String, meta: Object, cb? Callback) => void,
    fatal: (message: String, meta: Object, cb? Callback) => void,
    writeEntry: (Entry, cb?: Callback) => void,
    createChild: (path: String, Object<levelName: String>) => Logger
}

type Entry := {
    level: String,
    message: String,
    meta: Object,
    path: String
}

type BackendName := String
type LevelName := String

type Backend := {
    createStream: (meta: Object) => {
        write: ([
            levelName: String,
            message: String,
            meta: Object
        ], Callback) => void,
        end: () => void,
        destroy?: () => void
    }
}

type LoggerOpts := {
    meta: {
        team: String,
        project: String,
        hostname: String,
        pid: Number
    },
    backends: Object<BackendName, Backend>,
    filters?: Array<Function>,
    transforms?: Array<Function>,
    levels?: Object<LevelName, {
        backends: Array<BackendName>,
        filters?: Array<Function>,
        transforms?: Array<Function>,
        level: Number
    }>
}

logtron/backends/disk := ({
    folder: String
}) => Backend

logtron/backends/kafka := ({
    proxyHost?: String,
    proxyPort?: Number,
    properties?: Object,
    statsd?: Object
}) => Backend

logtron/backends/console := () => Backend

logtron/backends/sentry := ({
    dsn: String,
    defaultTags?: Object,
    statsd?: Object
}) => Backend

logtron/logger := ((LoggerOpts) => LogtronLogger) & {
    defaultBackends: (config: {
        logFolder?: String,
        kafka?: {
            proxyHost: String,
            proxyPort: Number
        },
        console?: Boolean,
        sentry?: {
            id: String
        }
    }, clients?: {
        statsd: StatsdClient,
        kafkaClient?: KafkaClient
    }) => {
        disk: Backend | null,
        kafka: Backend | null,
        console: Backend | null,
        sentry: Backend | null
    }
}
