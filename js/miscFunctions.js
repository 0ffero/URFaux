String.prototype.capitalise = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

function generateRandomID(_g=false) {
    generatedID = '';
    let maxC = 8;
    if (_g!==false) { maxC = 16; }
    for (let i=0; i<maxC; i++) {
        generatedID +=~~((Math.random()*9)+1).toString();
    }
    return generatedID;
}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}

function getRandom(_min,_max=null) { // this function can deal with a min/max, array or a string
    if (Array.isArray(_min)) {
        return Phaser.Math.RND.pick(_min);
    } else {
        if (typeof _min==='number' && typeof _max==='number') {
            return Phaser.Math.RND.between(_min,_max);
        } else if (typeof _min==='string' && _max===null) { // string has been passed 
            return Phaser.Math.RND.pick(_min.split(''));
        } else {
            console.error('The first passed var must either be an array, integer or string. If a 2nd value is passed it must be an integer');
        }
    }
}