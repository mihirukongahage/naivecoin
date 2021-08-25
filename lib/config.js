// Do not change these configurations after the blockchain is initialized
module.exports = {
    // INFO: The mining reward could decreases over time like bitcoin. See https://en.bitcoin.it/wiki/Mining#Reward.
    MINING_REWARD: 5000000000,
    // INFO: Usually it's a fee over transaction size (not quantity)
    FEE_PER_TRANSACTION: 1,
    // INFO: Usually the limit is determined by block size (not quantity)
    TRANSACTIONS_PER_BLOCK: 2,
    genesisBlock: {
        index: 0,
        previousHash: '0',
        timestamp: 1465154705,
        nonce: 0,
        transactions: [
            {
                id: '63ec3ac02f822450039df13ddf7c3c0f19bab4acd4dc928c62fcd78d5ebc6dba',
                hash: null,
                type: 'regular',
                data: {
                    inputs: [],
                    outputs: []
                }
            }
        ]
    },
    pow: {
        getDifficulty: (blocks, index) => {
            // Proof-of-work difficulty settings
            const BASE_DIFFICULTY = Number.MAX_SAFE_INTEGER;
            const EVERY_X_BLOCKS = 5;
            const POW_CURVE = 5;

            // INFO: The difficulty is the formula that naivecoin choose to check the proof a work, this number is later converted to base 16 to represent the minimal initial hash expected value.
            // INFO: This could be a formula based on time. Eg.: Check how long it took to mine X blocks over a period of time and then decrease/increase the difficulty based on that. See https://en.bitcoin.it/wiki/Difficulty
            return Math.max(
                Math.floor(
                    BASE_DIFFICULTY / Math.pow(
                        Math.floor(((index || blocks.length) + 1) / EVERY_X_BLOCKS) + 1
                        , POW_CURVE)
                )
                , 0);
        }
    },
    emptyTransaction: {
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
    },
    locations: [
            {
                "id": "0",
                "lon": "6.853179",
                "lat": "80.032199"
            },
            {
                "id": "1",
                "lon": "6.863592",
                "lat": "80.025427"
            },
            {
                "id": "2",
                "lon": "6.860171",
                "lat": "80.036371"
            },
            {
                "id": "3",
                "lon": "6.861237",
                "lat": "80.034128"
            },
            {
                "id": "4",
                "lon": "6.858367",
                "lat": "80.029027"
            },
            {
                "id": "5",
                "lon": "6.857785",
                "lat": "80.026194"
            }
        ],
        peers: [
            {
                "url": "http://localhost:3001"
            },
            {
                "url": "http://localhost:3002"
            },
            {
                "url": "http://localhost:3003"
            }
        ]
        
    
};