const R = require('ramda');
const CryptoUtil = require('../util/cryptoUtil');
const CryptoEdDSAUtil = require('../util/cryptoEdDSAUtil');
const Config = require('../config');


class Location {
    construct() {
        this.id = null;
        this.lon = null;
        this.lat = null;
    }

    static fromJson(data) {
        let location = new Location();
        R.forEachObjIndexed((value, key) => { location[key] = value; }, data);
        return location;
    }
}

module.exports = Location;
