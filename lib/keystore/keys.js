const R = require('ramda');

class Keys {

    static fromJson(data) {
        let keys = new Keys();
        R.forEachObjIndexed((value, key) => { keys[key] = value; }, data);
        return keys;
    }
}

module.exports = Keys;