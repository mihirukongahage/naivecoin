const Location = require('./location');
const R = require('ramda');

class Locations extends Array {
    static fromJson(data) {
        let locations = new Locations();
        R.forEach((location) => { locations.push(Location.fromJson(location)); }, data);
        return locations;
    }
}

module.exports = Locations;