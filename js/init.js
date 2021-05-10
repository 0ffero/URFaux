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

    // set up the loading progress bar
    let dDepth = consts.depths.debug;
    let gPV = vars.graphics.progress;
    let bar = gPV.bar;
    bar.object = scene.add.graphics().setDepth(dDepth);
    let box = gPV.box;
    box.object = scene.add.graphics().setDepth(dDepth-1);
    box.object.fillStyle(0x222222, 0.8);
    box.object.fillRect(vars.canvas.cX-box.width/2, vars.canvas.height*0.85, box.width, box.height);

    // when a file loads, update the progress bar
    scene.load.on('load', (_fileData)=> { vars.animate.loadingBarProgressUpdate(_fileData); })

    // add the loading screen and fade it in
    let depth = consts.depths.loading;
    let loadingBG = scene.add.image(vars.canvas.cX,-500,'loadingBG').setOrigin(0.5,0).setName('loadingBG').setDepth(depth);
    scene.tweens.add({ targets: loadingBG, y: 0, duration: 1500, ease: 'Quad' })
    scene.add.image(vars.canvas.cX, vars.canvas.cY, 'loadingText').setName('loadingText').setDepth(depth+1);

    // start loading all the assets
    scene.load.setPath('assets');
    vars.init(1);
    console.groupCollapsed('Loading Assets');
}



/*
█████ ████  █████ █████ █████ █████ 
█     █   █ █     █   █   █   █     
█     ████  ████  █████   █   ████  
█     █   █ █     █   █   █   █     
█████ █   █ █████ █   █   █   █████ 
*/
function create() {
    console.groupEnd();
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
        let dbgBG = scene.add.image(vars.canvas.width, 0, 'whitePixel').setName('dbgBG').setDepth(consts.depths.debug-1).setScale(300,180).setAlpha(0.33).setOrigin(1,0);
        let dbgTxt = scene.add.text(vars.canvas.width, 0, `DEBUG ON. Game version: ${vars.version}\nInitialisation took ${totalTime}ms`).setAlign('right').setName('debugText').setOrigin(1,0).setColor('#0').setDepth(consts.depths.debug);
        let dbgForce = scene.add.text(vars.canvas.width, 150, `Force: Disabled`).setAlign('right').setName('dbgTextForce').setOrigin(1,0).setColor('#0').setFontSize(24).setFontStyle('bold').setDepth(consts.depths.debug);
        scene.groups.debug.addMultiple([dbgTxt, dbgForce, dbgBG]);
        vars.debugFN.showDebugBoard();
        quickGet = vars.phaserObject.quickGet;
    } else {
        vars.DEBUG=false;
    }
}