class Timer {

    constructor(generator) {
        var intervalID = setInterval(myCallback, 10000);


        function myCallback()
        {
         generator.createBlock();
        }
    }

    static fromJson(data) {
        let peer = new Peer();
        R.forEachObjIndexed((value, key) => { peer[key] = value; }, data);
        return peer;
    }

}

module.exports = Timer;