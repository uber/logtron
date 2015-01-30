var extend = require('xtend');
var Entry = require('../entry.js');

module.exports = XtendTransform;

function XtendTransform(baseMeta) {
    return xtendTransform;

    function xtendTransform(entry) {
        var meta = entry.meta || {};
        meta = extend(baseMeta, meta);
        return new Entry(entry.level, entry.message, meta, entry.path);
    }
}
