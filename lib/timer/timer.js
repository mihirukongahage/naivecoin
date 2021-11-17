
// Timer 
class Timer {

    constructor(generator) {
        var intervalID = setInterval(timerCallback, 5000);

        function timerCallback()
        {
         generator.createBlock();
        }
    } 

}

module.exports = Timer;