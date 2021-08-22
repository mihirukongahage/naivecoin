const R = require('ramda');
const CryptoUtil = require('../util/cryptoUtil');
const Config = require('../config');


class Initial {

    static fromJson(data) {
        let initial = new Initial();
        R.forEachObjIndexed((value, key) => { initial[key] = value; }, data);
        return initial;
    }

}

module.exports = Initial;