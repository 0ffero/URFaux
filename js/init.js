if (vars.DEBUG===true) { console.log('Initialising...'); }

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

var game = new Phaser.Game(config);


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


    if (vars.DEBUG) {
        scene.add.text(vars.canvas.width, 0, `DEBUG ON. Game version: ${vars.version}\nInitialisation took ${totalTime}ms`).setAlign('right').setName('debugText').setOrigin(1,0).setColor('#0').setDepth(consts.depths.debug);
        vars.debugFN.showDebugBoard();
        quickGet = vars.phaserObject.quickGet;
    }
}