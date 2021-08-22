const R = require('ramda');
const spawn = require('threads').spawn;
const CryptoUtil = require('../util/cryptoUtil');
const Config = require('../config');
const Locations = require('./locations');
const Location = require('./location');
const Db = require('../util/db');
const Tickets = require('./tickets');
const Initials = require('../initial/initials');
const VerificationError = require('./verificationError')

const TICKET_FILE = 'tickets.json';


class Leader {

    constructor(dbName){
        this.ticketDb = new Db('data/' + dbName + '/' + TICKET_FILE, new Tickets());

        this.tickets = this.ticketDb.read(Tickets);

    }

    selectLeader() {
        // Pick the maximum hash

        // Request the block from the user

        // Verify the block

        // Append it to the blockchain
    }



    

}
module.exports = Leader;
