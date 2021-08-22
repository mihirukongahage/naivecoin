const R = require('ramda');
const spawn = require('threads').spawn;
const Block = require('../blockchain/block');
const CryptoUtil = require('../util/cryptoUtil');
const Transaction = require('../blockchain/transaction');
const Generator = require('../generator');
const Config = require('../config');
const Db = require('../util/db');
const Locations = require('../generator/locations')

const LOCATION_FILE = 'locations.json';
const NEW_BLOCK_FILE = 'newblock.json';


class Minter {
    constructor(blockchain, logLevel, dbName, keystore, node) {
        this.blockchain = blockchain;
        this.logLevel = logLevel;
        this.keystore = keystore;
        this.node = node;

        this.N1 = null;
        this.N2 = null;
        this.transactionList = null;
        this.location = null;

        this.locationDb = new Db('data/' + dbName + '/' + LOCATION_FILE, new Locations());
        this.newBlockDb = new Db('data/' + dbName + '/' + NEW_BLOCK_FILE, new Block());

        this.locations = this.locationDb.read(Locations);
        this.newBlock = this.newBlockDb.read(Block);

    }

    /**
     * Generate new block, N1, N2 and the location
     * @returns location
     */
    getLocation(generator, rewardAddress, feeAddress) {
        
        // Generate new block
        let newBlock = Minter.generateNextBlock(rewardAddress, feeAddress, this.blockchain);

        // keep the transaction list of the new block
        this.transactionList = newBlock.transactions;

        // Generate N1, N2 and location
        this.N1 = generator.n1Generator(newBlock.transactionHash);
        this.N2 = generator.n2Generator(newBlock.transactionHash, this.N1);
        this.location = generator.generateLocation(this.N1);

        // Store newly created block
        this.newBlockDb.write(newBlock);

        // Get publickey and signed data
        let publicKey = this.keystore.getPublicKey();

        // signature not implemented
        //let signedInitialData = this.keystore.signMessage(data);

        // Broadcast initial data
        this.node.broadcastInitialData({
            publicKey: publicKey,
            transactionListHash: CryptoUtil.hash(newBlock.transactions),
            locationListHash: CryptoUtil.hash(this.locations),
            hashedN1: CryptoUtil.hash(JSON.stringify(this.N1)),
            hashedN2: CryptoUtil.hash(JSON.stringify(this.N2)),
            blockHash: newBlock.hash
        })

        return (this.location);

    }

    /**
     * Return PublicKey, N1, N2, TranasctionList, LocationList
     */
    connect() {
        let data = {
            publickey: this.keystore.keys.publicKey,
            N1: this.N1,
            N2: this.N2,
            transactionList: this.transactionList,
            locationList: this.locations
        }
        return data; 
    }



    static generateNextBlock(rewardAddress, feeAddress, blockchain) {
        const previousBlock = blockchain.getLastBlock();
        const index = previousBlock.index + 1;
        const previousHash = previousBlock.hash;
        const timestamp = new Date().getTime() / 1000;
        const blocks = blockchain.getAllBlocks();
        const candidateTransactions = blockchain.transactions;
        const transactionsInBlocks = R.flatten(R.map(R.prop('transactions'), blocks));
        const inputTransactionsInTransaction = R.compose(R.flatten, R.map(R.compose(R.prop('inputs'), R.prop('data'))));

        // Select transactions that can be mined     
        let rejectedTransactions = [];
        let selectedTransactions = [];
        R.forEach((transaction) => {
            let negativeOutputsFound = 0;
            let i = 0;
            let outputsLen = transaction.data.outputs.length;

            // Check for negative outputs (avoiding negative transactions or 'stealing')
            for (i = 0; i < outputsLen; i++) {
                if (transaction.data.outputs[i].amount < 0) {
                    negativeOutputsFound++;
                }
            }
            // Check if any of the inputs is found in the selectedTransactions or in the blockchain
            let transactionInputFoundAnywhere = R.map((input) => {
                let findInputTransactionInTransactionList = R.find(
                    R.whereEq({
                        'transaction': input.transaction,
                        'index': input.index
                    }));

                // Find the candidate transaction in the selected transaction list (avoiding double spending)
                let wasItFoundInSelectedTransactions = R.not(R.isNil(findInputTransactionInTransactionList(inputTransactionsInTransaction(selectedTransactions))));

                // Find the candidate transaction in the blockchain (avoiding mining invalid transactions)
                let wasItFoundInBlocks = R.not(R.isNil(findInputTransactionInTransactionList(inputTransactionsInTransaction(transactionsInBlocks))));

                return wasItFoundInSelectedTransactions || wasItFoundInBlocks;
            }, transaction.data.inputs);

            if (R.all(R.equals(false), transactionInputFoundAnywhere)) {
                if (transaction.type === 'regular' && negativeOutputsFound === 0) {
                    selectedTransactions.push(transaction);
                } else if (transaction.type === 'reward') {
                    selectedTransactions.push(transaction);
                } else if (negativeOutputsFound > 0) {
                    rejectedTransactions.push(transaction);
                }
            } else {
                rejectedTransactions.push(transaction);
            }
        }, candidateTransactions);

        // If no transactions available add an empty tranaction NOTE: Used for testing purposes
        selectedTransactions.push(Config.emptyTransaction);


        console.info(`Selected ${selectedTransactions.length} candidate transactions with ${rejectedTransactions.length} being rejected.`);

        // Get the first two avaliable transactions, if there aren't TRANSACTIONS_PER_BLOCK, it's empty
        let transactions = R.defaultTo([], R.take(Config.TRANSACTIONS_PER_BLOCK, selectedTransactions));

        // Add fee transaction (1 satoshi per transaction)        
        if (transactions.length > 0) {
            let feeTransaction = Transaction.fromJson({
                id: CryptoUtil.randomId(64),
                hash: null,
                type: 'fee',
                data: {
                    inputs: [],
                    outputs: [
                        {
                            amount: Config.FEE_PER_TRANSACTION * transactions.length, // satoshis format
                            address: feeAddress, // INFO: Usually here is a locking script (to check who and when this transaction output can be used), in this case it's a simple destination address 
                        }
                    ]
                }
            });

            transactions.push(feeTransaction);
        }

        // Add reward transaction of 50 coins
        if (rewardAddress != null) {
            let rewardTransaction = Transaction.fromJson({
                id: CryptoUtil.randomId(64),
                hash: null,
                type: 'reward',
                data: {
                    inputs: [],
                    outputs: [
                        {
                            amount: Config.MINING_REWARD, // satoshis format
                            address: rewardAddress, // INFO: Usually here is a locking script (to check who and when this transaction output can be used), in this case it's a simple destination address 
                        }
                    ]
                }
            });

            transactions.push(rewardTransaction);
        }

        return Block.fromJson({
            index,
            nonce: 0,
            previousHash,
            timestamp,
            transactions
        });
    }

    /* istanbul ignore next */
    static proveWorkFor(jsonBlock, difficulty) {
        let blockDifficulty = null;
        let start = process.hrtime();
        let block = Block.fromJson(jsonBlock);

        // INFO: Every cryptocurrency has a different way to prove work, this is a simple hash sequence

        // Loop incrementing the nonce to find the hash at desired difficulty
        do {
            block.timestamp = new Date().getTime() / 1000;
            block.nonce++;
            block.hash = block.getBlockHash();
            blockDifficulty = block.getDifficulty();
        } while (blockDifficulty >= difficulty);
        console.info(`Block found: time '${process.hrtime(start)[0]} sec' dif '${difficulty}' hash '${block.hash}' nonce '${block.nonce}'`);
        return block;
    }
}

module.exports = Minter;
