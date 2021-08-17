const R = require('ramda');
const spawn = require('threads').spawn;
const CryptoUtil = require('../util/cryptoUtil');
const Config = require('../config');
const Locations = require('./locations');
const Location = require('./location');
const Db = require('../util/db');


const LOCATION_FILE = 'locations.json';

class Generator {

    constructor(dbName){
        this.locationDb = new Db('data/' + dbName + '/' + LOCATION_FILE, new Locations());

        this.locations = this.locationDb.read(Locations);
    }

    getAllLocations() {
        return this.locations;
    }

    n1Generator(transactionHash) {
        return CryptoUtil.hash(JSON.stringify(transactionHash))
    }

    n2Generator(transactionHash, n1) {
        return CryptoUtil.hash(JSON.stringify(transactionHash + n1))
    }

    generateLocation(n1) {
        
        let index = parseInt(n1, 16) % this.locations.length;
        return this.locations[index];
    }

}
module.exports = Generator;
