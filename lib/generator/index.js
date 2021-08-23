const R = require('ramda');
const spawn = require('threads').spawn;
const CryptoUtil = require('../util/cryptoUtil');
const Config = require('../config');
const Locations = require('./locations');
const Location = require('./location');
const Db = require('../util/db');
const Ticket = require('./ticket');
const Tickets = require('./tickets');
const Initials = require('../initial/initials');
const VerificationError = require('./verificationError')


const LOCATION_FILE = 'locations.json';
const TICKET_FILE = 'tickets.json';
const INIT_DATA_FILE = 'initials.json';


class Generator {

    constructor(dbName){
        this.locationDb = new Db('data/' + dbName + '/' + LOCATION_FILE, new Locations());
        this.ticketDb = new Db('data/' + dbName + '/' + TICKET_FILE, new Tickets());
        this.initialDb = new Db('data/' + dbName + '/' + INIT_DATA_FILE, new Initials());

        this.locations = this.locationDb.read(Locations);
        this.tickets = this.ticketDb.read(Tickets);
        this.initialData = this.initialDb.read(Initials);

    }

    getAllLocations() {
        return this.locations;
    }

    n1Generator(transactionHash) {

        // N1 = Hash(transactionHash)
        return CryptoUtil.hash(JSON.stringify(transactionHash))
    }

    n2Generator(transactionHash, n1) {

        // N2 = Hash(transactionHash + N1)
        return CryptoUtil.hash(JSON.stringify(transactionHash + n1))
    }

    generateLocation(n1) {
        
        // location = N1 Mod length(locations)
        let index = parseInt(n1, 16) % this.locations.length;
        return this.locations[index];
    }

    verifyData(userInitialData) {

        this.initialData = this.initialDb.read(Initials);

        // Pick the data from initialDB
        let storedInitialData = null;

        for (var i = this.initialData.length - 1; i >= 0; i--) {
            if(this.initialData[i].data.publicKey.data == userInitialData.publickey.data) {
                storedInitialData = this.initialData[i];
                break;
            }
        }

        if(storedInitialData == null) {
            console.error(`Node with the publickey ${userInitialData.publickey.data} is not available`);
            // raise flag for the public key
        }

        // Verify user
        
        // let N1Validity = this.verifyN1(userInitialData.N1, userInitialData.transactionList, storedInitialData.data.hashedN1);
        // console.log(N1Validity)

        // let N2Validity = this.verifyN2(userInitialData.transactionList, userInitialData.N1, userInitialData.N2);
        // console.log(N2Validity)

        // let locationValidity = this.verifyLocation(userInitialData.transactionList, storedInitialData.hashedN2)
        // console.log(N2VallocationValidityidity)

        return userInitialData;

    }

    verifyN1(userInitialDataN1, userInitialDataTransactionList, storedInitialDataHashedN1) {
        
        // Hash(HashMerkle(Transaction_List)) == N1
        let merkleHash = this.getMerkleHash(userInitialDataTransactionList)

        if(CryptoUtil.hash(merkleHash) != userInitialDataN1) {
            console.error(`Invalid N1`);
            throw new VerificationError(`Invalid N1`, this);
        }
        return true;
    }

    verifyN2(userInitialDataTransactionList, N1, N2) {

        // Hash(HashMerkle(Transaction_List) + N1) == N2
        let merkleHash = this.getMerkleHash(userInitialDataTransactionList)

        if(CryptoUtil.hash(merkleHash + N1) != N2) {
            console.error(`Invalid N2`);
            throw new VerificationError(`Invalid N2`, this);
        }
        return true;
    }

    verifyLocation() {
        // Hash(HashMerkle(Location_List)) == HashMerkle(Location_List)(Pool)
        // Index = N1   Mod   Len(Location_List)
        // LocationCurrent ==  Location_List [Index]
    }

    verifyFinalData() {

        
        // Verify N1, N2, and Location

        // let N1Validity = this.verifyN1(userInitialData.N1, userInitialData.transactionList, storedInitialData.data.hashedN1);
        // console.log(N1Validity)

        // let N2Validity = this.verifyN2(userInitialData.transactionList, userInitialData.N1, userInitialData.N2);
        // console.log(N2Validity)

        // let locationValidity = this.verifyLocation(userInitialData.transactionList, storedInitialData.hashedN2)
        // console.log(N2VallocationValidityidity)

    }

    createTicket(data) {

        console.log(JSON.stringify(data))

        let ticket = new Ticket();
        ticket.data = data;
        
        this.tickets.push(ticket)

        console.log(JSON.stringify(this.tickets))

        this.ticketDb.write(this.tickets);
        
        return true;
    }


    getMerkleHash(transactionList) {
        let hashArray = [];

        // Create an array with hashes  of all the transactions
        R.forEach((transaction) => {
            hashArray.push(CryptoUtil.hash(JSON.stringify(transaction)))
        }, transactionList)

        while(hashArray.length > 1) {

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

}
module.exports = Generator;
