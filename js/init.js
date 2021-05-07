vars.localStorage.init(); // initialise local storage vars or DEBUG will always be false
vars.DEBUG ? console.log('%c🖫 🖫 🖫 🖫 🖫 🖫\n Initialising. \n🖫 🖫 🖫 🖫 🖫 🖫', 'font-size: 20px; background-color: #000; color: #fff; font-family: Consolas') : null;

var game;
var config = {
    title: "URFaux",
    type: Phaser.WEBGL,

    backgroundColor: '#000000',
    disableContextMenu: true,

    height: vars.canvas.height,
    width: vars.canvas.width,
    parent: 'URFaux',

    /*
	dom: {
        createContainer: true
    },
	*/
    scale: {
        parent: 'URFaux',
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: vars.canvas.width,
        height: vars.canvas.height,
    },

    scene: {
        preload: preload,
        create: create,

        pack: {
            files: [
                { type: 'image', key: 'loadingBG', url: 'assets/images/loadingScreen.jpg' },
                { type: 'image', key: 'loadingText', url: 'assets/images/loadingText.png' }
            ]
        }
    }
};

fetch("./assets/fileList.json").then(response => {
    return response.json(); 
}).then( (data)=> { 
    let fV = vars.files;
    fV.fileSizes=data;
    // by the time we can show a loading bar, the loadingScreen and Text will already have laoded, so we add them here
    let fSV = fV.fileSizes;
    fSV.details.loadedSize=fSV.files['loadingScreen.jpg'] + fSV.files['loadingText.png'];
    game = new Phaser.Game(config);
});

/*
█████ ████  █████ █      ███  █████ ████  
█   █ █   █ █     █     █   █ █   █ █   █ 
█████ ████  ████  █     █   █ █████ █   █ 
█     █   █ █     █     █   █ █   █ █   █ 
█     █   █ █████ █████  ███  █   █ ████  
*/
var startTime = new Date();
function preload() {
    scene = this;

    let dDepth = consts.depths.debug;
    var progressBar = this.add.graphics().setDepth(dDepth);
    var progressBox = this.add.graphics().setDepth(dDepth-1);
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(vars.canvas.cX-320, vars.canvas.cY*1.75, 640, 50);

    scene.load.on('load', (_fileData)=> {
        let fSName = _fileData.src.replace(/assets\/\w+\//,'')
        let fFV = vars.files.fileSizes;
        let fS = fFV.files;
        let before = fFV.details.loadedSize;
        let tot = fFV.details.totalSize;
        if (fS[fSName]!==undefined) {
            // add this amount to the loaded size variable
            fFV.details.loadedSize+=fS[fSName];
            // convert it to a percentage
            let loadedPercent = Phaser.Math.Clamp(~~(fFV.details.loadedSize/tot*100)/100, 0.01, 1);
            vars.DEBUG ? console.log(`${~~(loadedPercent*100)}% - Loaded ${fSName}. (Adding: ${fS[fSName]/1000}KB to ${before/1000}KB = ${fFV.details.loadedSize/1000}KB of ${tot/1000}KB)`): null;
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(vars.canvas.cX-310, vars.canvas.cY*1.75+10, 620 * loadedPercent, 30);
            if (loadedPercent===1) {
                scene.tweens.add({
                    targets: [progressBar,progressBox],
                    alpha: 0,
                    delay: 500,
                    duration: 500
                })
            }
        } else {
            console.log(`Loaded ${fS[fSName]}, but it was NOT found in the file list...`);
        }
    })
    let depth = consts.depths.loading;
    let loadingBG = scene.add.image(vars.canvas.cX,-500,'loadingBG').setOrigin(0.5,0).setName('loadingBG').setDepth(depth);
    scene.tweens.add({
        targets: loadingBG,
        y: 0,
        duration: 1500,
        ease: 'Quad'
    })
    scene.add.image(vars.canvas.cX, vars.canvas.cY, 'loadingText').setName('loadingText').setDepth(depth+1);

    // start loading all the assets and intiialise localStorage
    scene.load.setPath('assets');
    vars.init(1);
}



/*
█████ ████  █████ █████ █████ █████ 
█     █   █ █     █   █   █   █     
█     ████  ████  █████   █   ████  
█     █   █ █     █   █   █   █     
█████ █   █ █████ █   █   █   █████ 
*/
function create() {
    let maxTime = 2000;
    // INITIALISE ALL THE THINGS
    vars.init(2);

    let endTime = new Date();
    let totalTime = endTime - startTime;
    console.log(`  ..Initialisation took ${totalTime}ms`);


    if (totalTime<maxTime && vars.DEBUG!==true) {
        setTimeout( ()=> {
            vars.animate.loadingImageSwitch();
        }, maxTime-totalTime )
    } else {
        vars.animate.loadingImageSwitch();
    }

    // waiting for the user to click the start button


    if (vars.DEBUG && window.location.host==='offero04.io') {
        scene.add.text(vars.canvas.width, 0, `DEBUG ON. Game version: ${vars.version}\nInitialisation took ${totalTime}ms`).setAlign('right').setName('debugText').setOrigin(1,0).setColor('#0').setDepth(consts.depths.debug);
        vars.debugFN.showDebugBoard();
        quickGet = vars.phaserObject.quickGet;
    } else {
        vars.DEBUG=false;
    }
}