const Initial = require('./initial');
const R = require('ramda');

class Initials extends Array {
    static fromJson(data) {
        let initials = new Initials();
        R.forEach((initial) => { initials.push(Initial.fromJson(initial)); }, data);
        return initials;
    }
}

module.exports = Initials;