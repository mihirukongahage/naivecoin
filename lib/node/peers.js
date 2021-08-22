const Peer = require('./peer');
const R = require('ramda');

class Peers extends Array {
    static fromJson(data) {
        let peers = new Peers();
        R.forEach((peer) => { peers.push(Peer.fromJson(peer)); }, data);
        return peers;
    }
}

module.exports = Peers;