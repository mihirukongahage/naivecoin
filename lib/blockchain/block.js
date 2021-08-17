const R = require('ramda');
const CryptoUtil = require('../util/cryptoUtil');
const Transactions = require('./transactions');
const Config = require('../config');

/*
{ // Block
    "index": 0, // (first block: 0)
    "previousHash": "0", // (hash of previous block, first block is 0) (64 bytes)
    "timestamp": 1465154705, // number of seconds since January 1, 1970
    "nonce": 0, // nonce used to identify the proof-of-work step.
    "transactions": [ // list of transactions inside the block
        { // transaction 0
            "id": "63ec3ac02f...8d5ebc6dba", // random id (64 bytes)
            "hash": "563b8aa350...3eecfbd26b", // hash taken from the contents of the transaction: sha256 (id + data) (64 bytes)
            "type": "regular", // transaction type (regular, fee, reward)
            "data": {
                "inputs": [], // list of input transactions
                "outputs": [] // list of output transactions
            }
        }
    ],
    "hash": "c4e0b8df46...199754d1ed" // hash taken from the contents of the block: sha256 (index + previousHash + timestamp + nonce + transactions) (64 bytes)
}
*/

class Block {
    toHash() {
        // INFO: There are different implementations of the hash algorithm, for example: https://en.bitcoin.it/wiki/Hashcash
        return CryptoUtil.hash(this.index + this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce);
    }

    getBlockHash(transactionHash) {
        return CryptoUtil.hash(this.index + this.previousHash + this.timestamp + transactionHash + this.nonce);
    }

    /**
     * Generate Merkle hash for the transactions
     */
    getTransactionHash() {
        let hashArray = [];

        // Create an array with hashes  of all the transactions
        R.forEach((transaction) => {
            hashArray.push(CryptoUtil.hash(JSON.stringify(transaction)))
        }, this.transactions)

        while (hashArray.length > 1) {
            // If array length is odd append the last hash to the array
            if(hashArray.length % 2 == 1) {
                hashArray.push(hashArray[hashArray.length-1])
            }

            // Calculate the merkle hash
            let j = 0;
            let i = 0;
            for (i = 0; i < hashArray.length/2; i++) {
                hashArray[i] = CryptoUtil.hash(JSON.stringify(hashArray[j] + hashArray[j+1]))
                j=j+2;
            }
            hashArray = hashArray.slice(0, hashArray.length/2)

        }
        return (hashArray[0])
        
    }

    getDifficulty() {
        // 14 is the maximum precision length supported by javascript
        return parseInt(this.hash.substring(0, 14), 16);
    }

    static get genesis() {
        // The genesis block is fixed
        return Block.fromJson(Config.genesisBlock);
    }

    static fromJson(data) {
        let block = new Block();
        R.forEachObjIndexed((value, key) => {
            if (key == 'transactions' && value) {
                block[key] = Transactions.fromJson(value);
            } else {
                block[key] = value;
            }
        }, data);

        block.transactionHash = block.getTransactionHash();
        block.hash = block.getBlockHash(block.transactionHash);
        return block;
    }

}

module.exports = Block;