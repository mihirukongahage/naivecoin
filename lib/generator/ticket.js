const R = require('ramda');
const CryptoUtil = require('../util/cryptoUtil');
const Config = require('../config');


class Ticket {

    static fromJson(data) {
        let ticket = new Ticket();
        R.forEachObjIndexed((value, key) => { ticket[key] = value; }, data);
        return ticket;
    }

}

module.exports = Ticket;