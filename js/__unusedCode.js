
// this plots an infinity symbol
function generateInfinityPoints() {
    let infinityPoints = [];
    for (let t=0; t<2*Math.PI; t+=2*Math.PI/50) {
        let scale = 2 / (3 - Math.cos(2*t));
        let x = ~~(scale * Math.cos(t) * 1000)/10;
        let y = ~~(scale * Math.sin(2*t)/2*1000)/10;
        infinityPoints.push(new Phaser.Geom.Point(x,y));
        //console.log(`xy: ${x},${y}`);
        //scene.add.image(x+500,y+300, 'whitePixel').setDepth(300).setScale(5)
    }
    console.table(infinityPoints);
}