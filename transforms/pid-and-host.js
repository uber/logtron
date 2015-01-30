'use strict';

var Entry = require('../entry.js');

module.exports = AddPidAndHost;

function AddPidAndHost(baseMeta) {
    return addPidAndHost;

    function addPidAndHost(entry) {
        var meta = entry.meta || {};

        if (!meta._hostname && baseMeta.hostname) {
            meta._hostname = baseMeta.hostname;
        }

        if (!meta._pid && baseMeta.pid) {
            meta._pid = baseMeta.pid;
        }

        return new Entry(entry.level, entry.message, entry.meta, entry.path);
    }
}
