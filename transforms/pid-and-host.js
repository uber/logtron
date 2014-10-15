module.exports = AddPidAndHost;

function AddPidAndHost(meta) {
    return addPidAndHost;

    function addPidAndHost(triplet) {
        var opts = triplet[2] || {};

        if (!opts._hostname && meta.hostname) {
            opts._hostname = meta.hostname;
        }

        if (!opts._pid && meta.pid) {
            opts._pid = meta.pid;
        }

        return [triplet[0], triplet[1], opts];
    }
}
