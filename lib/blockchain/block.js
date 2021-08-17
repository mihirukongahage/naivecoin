const R = require('ramda');
const CryptoUtil = require('../util/cryptoUtil');
const Transactions = require('./transactions');
const Config = require('../config');

const emptyTransaction = {
    "id": "0000000000000000000000000000000000000000000000000000000000000001",
    "hash": "0000000000000000000000000000000000000000000000000000000000000000",
    "type": "fee",
    "data": {
        "inputs": [],
        "outputs": [
            {
                "amount": 0
            }
        ]
    }
}


class Block {
    //toHash() {
        // INFO: There are different implementations of the hash algorithm, for example: https://en.bitcoin.it/wiki/Hashcash
        //return CryptoUtil.hash(this.index + this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce);
    //}

    getBlockHash(transactionHash) {
        return CryptoUtil.hash(this.index + this.previousHash + this.timestamp + transactionHash + this.nonce);
    }

    /**
     * Generate Merkle hash for the transactions
     */
    getTransactionHash() {
        let hashArray = [];

        // If array length is odd append the last hash to the array
        if(this.transactions.length % 2 == 1) {
            this.transactions.push(emptyTransaction)
        }

        // Create an array with hashes  of all the transactions
        R.forEach((transaction) => {
            hashArray.push(CryptoUtil.hash(JSON.stringify(transaction)))
        }, this.transactions)


        while (hashArray.length > 1) {
            // // If array length is odd append the last hash to the array
            // if(hashArray.length % 2 == 1) {
            //     hashArray.push(hashArray[hashArray.length-1])
            // }

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