var extend = require('xtend');

module.exports = XtendTransform;

function XtendTransform(meta) {
    return xtendTransform;

    function xtendTransform(triplet) {
        var opts = triplet[2] || {};

        opts = extend(meta, opts);

        return [triplet[0], triplet[1], opts];
    }
}
