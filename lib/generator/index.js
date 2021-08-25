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

        this.locationDb.write(Config.locations);

    }

    getAllLocations() {
        return this.locations;
    }

    getGeneratedData(transactionHash) {
        
        // Read files
        this.locations = this.locationDb.read(Locations);

        // Generate N1, N2 and location
        let N1 = this.n1Generator(transactionHash);
        let N2 = this.n2Generator(transactionHash, N1);
        let location = this.generateLocation(N1);

        return ({
            N1: N1,
            N2: N2,
            location: location
        })
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

        return storedInitialData;

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

    createTicket(data) {

        let ticketEntry = this.verifyFinalData(data)
        
        // Find if the public key is in ticket table
        this.tickets = this.ticketDb.read(Tickets);

        let storedTicketEntry = null;
        let index = null;
        for (var i = this.tickets.length - 1; i >= 0; i--) {
            if((ticketEntry.publicKey_1 == this.tickets[i].publicKey_1 && ticketEntry.publicKey_2 == this.tickets[i].publicKey_2) ||
            (ticketEntry.publicKey_2 == this.tickets[i].publicKey_1 && ticketEntry.publicKey_1 == this.tickets[i].publicKey_2)) {
                storedTicketEntry = this.tickets[i];
                index = i;
                break;
            }
        }

        let ticket = new Ticket();
        if(storedTicketEntry == null) {
            ticket.data = ticketEntry;
            this.tickets.push(ticket)
            this.ticketDb.write(this.tickets);

        } else {
            // if(storedTicketEntry.publicKey_1 == null) {
            //     storedTicketEntry.publicKey_1 = ticketEntry.hashedN2
            // }
            // if(storedTicketEntry.publicKey_2 == null) {
            //     storedTicketEntry.publicKey_2 = ticketEntry.hashedN2
            // }
            storedTicketEntry.hashedN2_2 = ticketEntry.hashedN2


            this.tickets[index] = storedTicketEntry
            this.ticketDb.write(this.tickets);
        }

        console.log(JSON.stringify(storedTicketEntry))
        
        return ticketEntry;
    }

    verifyFinalData(data) {
        
        // Verify N1, N2, and Location

        // let N1Validity = this.verifyN1(userInitialData.N1, userInitialData.transactionList, storedInitialData.data.hashedN1);
        // console.log(N1Validity)

        // let N2Validity = this.verifyN2(userInitialData.transactionList, userInitialData.N1, userInitialData.N2);
        // console.log(N2Validity)

        // let locationValidity = this.verifyLocation(userInitialData.transactionList, storedInitialData.hashedN2)
        // console.log(N2VallocationValidityidity)
        
        let ticketEntry = {
            publicKey_1: data.data.publicKey,
            hashedN2_1: data.data.hashedN2,
            publicKey_2: data.verifierPublicKey,
            hashedN2_2: null
        }

        return ticketEntry;

    }

    createBlock() {
        this.tickets = this.ticketDb.read(Tickets);

        let maxHash = '0000000000000000000000000000000000000000000000000000000000000000';
        let leader = null;

        for (let i = 0; i < this.tickets.length; i++) {
            if(maxHash < this.tickets[i].data.hashedN2_1) {
                // check of both public keys and hashes are available

                maxHash = this.tickets[i].data.hashedN2_1;
                leader = this.tickets[i].data.publicKey_1;
            }
            if(maxHash < this.tickets[i].hashedN2_2) {
                // check of both public keys and hashes are available

                maxHash = this.tickets[i].data.hashedN2_2;
                leader = this.tickets[i].data.publicKey_2;
            }
        } 

        console.log(`Selected block leader ${leader}`)
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
