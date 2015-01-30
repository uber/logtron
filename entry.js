'use strict';

module.exports = Entry;
function Entry(level, message, meta, path) {
    this.level = level;
    this.message = message;
    this.meta = meta;
    this.path = path;
}

