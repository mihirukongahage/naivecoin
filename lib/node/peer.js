const R = require('ramda');
const CryptoUtil = require('../util/cryptoUtil');
const Config = require('../config');


class Peer {

    static fromJson(data) {
        let peer = new Peer();
        R.forEachObjIndexed((value, key) => { peer[key] = value; }, data);
        return peer;
    }

}

module.exports = Peer;