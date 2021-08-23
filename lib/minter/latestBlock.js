const R = require('ramda');
const CryptoUtil = require('../util/cryptoUtil');
const CryptoEdDSAUtil = require('../util/cryptoEdDSAUtil');
const Config = require('../config');


class LatestBlock {
    construct() {
        this.id = null;
        this.lon = null;
        this.lat = null;
    }

    static fromJson(data) {
        let latestBlock = new LatestBlock();
        R.forEachObjIndexed((value, key) => { latestBlock[key] = value; }, data);
        return latestBlock;
    }
}

module.exports = LatestBlock;
