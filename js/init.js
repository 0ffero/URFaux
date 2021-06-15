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
                { type: 'image', key: 'loadingBG',   url: 'assets/images/loadingScreen.jpg' },
                { type: 'image', key: 'loadingText', url: 'assets/images/loadingText.png' },
                { type: 'image', key: 'vignette',    url: 'assets/images/vignette.png' }
            ]
        }
    },

    banner: false,

    version: vars.version.toString(),

    url: window.origin,

    loader:{
        enableParallel: true,
        crossOrigin: 'anonymous'
    }
};

fetch("./assets/fileList.json").then(response => {
    return response.json(); 
}).then( (data)=> { 
    let fV = vars.files;
    fV.fileSizes=data;
    // by the time we can show a loading bar, the loadingScreen and Text will already have loaded, so we add them here
    let fSV = fV.fileSizes;
    fSV.details.loadedSize=fSV.files['loadingScreen.jpg'] + fSV.files['loadingText.png'] + fSV.files['vignette.png'];
    let lS = 'Loaded';
    fSV.files['loadingScreen.jpg'] = lS; fSV.files['loadingText.png'] = lS; fSV.files['vignette.png'] = lS;
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
    consts.colours.hex.grays === undefined ? consts.colours.init() : null; // if the grays arent initialised...
    this.load.plugin('rexoutlinepipelineplugin', 'js/frameworks/rexoutlinepipelineplugin.min.js', true);
    // var pipelineInstance = scene.plugins.get('rexoutlinepipelineplugin').add(gameObject, config); // <-- used when attaching to an image. This plug in has image outline!
    scene = this;

    // add the vignette
    let vig = scene.add.image(vars.canvas.cX, vars.canvas.cY, 'vignette').setTint(0x000000).setDepth(consts.depths.vignette).setName('vignette').setAlpha(0);
    vars.animate.vignetteShow(vig);

    // set up the loading progress bar
    let dDepth = consts.depths.debug;
    let gPV = vars.graphics.progress;
    let bar = gPV.bar; bar.object = scene.add.graphics().setDepth(dDepth);
    let box = gPV.box; box.object = scene.add.graphics().setDepth(dDepth-1);
    box.object.fillStyle(0x4DD2FE, 0.8);
    box.object.fillRect(vars.canvas.cX-box.width/2, vars.canvas.height*0.92, box.width, box.height);

    // when a file loads, update the progress bar
    scene.load.on('load', (_fileData)=> { vars.animate.loadingBarProgressUpdate(_fileData); })
    // add the loading screen and fade it in
    let depth = consts.depths.loading;
    scene.add.image(vars.canvas.cX,0,'loadingBG').setOrigin(0.5,0).setName('loadingBG').setDepth(depth);
    scene.add.image(vars.canvas.cX, vars.canvas.cY+300, 'loadingText').setName('loadingText').setDepth(depth+1);

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
    vars.DEBUG ? console.log(`🕔 Initialisation took %c${totalTime}ms`, 'font-weight: bold') : null;
    endTime = startTime = null;


    if (totalTime<maxTime && vars.DEBUG!==true) {
        setTimeout( ()=> {
            vars.animate.loadingImageSwitch();
        }, maxTime-totalTime )
    } else {
        vars.animate.loadingImageSwitch();
    }

    // waiting for the user to click the start button


    if (vars.DEBUG && window.location.host==='offero04.io') {
        vars.debugFN.init(totalTime);
    } else {
        vars.DEBUG=false;
    }
}