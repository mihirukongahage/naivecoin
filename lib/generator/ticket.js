const R = require('ramda');
const CryptoUtil = require('../util/cryptoUtil');
const Transactions = require('./transactions');
const Config = require('../config');


class Ticket {

    // static fromJson(data) {
    //     let block = new Block();
    //     R.forEachObjIndexed((value, key) => {
    //         if (key == 'transactions' && value) {
    //             block[key] = Transactions.fromJson(value);
    //         } else {
    //             block[key] = value;
    //         }
    //     }, data);

    //     block.transactionHash = block.getTransactionHash();
    //     block.hash = block.getBlockHash(block.transactionHash);
    //     return block;
    // }

}

module.exports = Ticket;