vars.init = (stage=1)=> { // ENTRY POINT IS HERE
    let v = vars;

    console.log(`%cInitialising Stage ${stage}`, 'color: #00f000; font-size: 14px;');
    if (stage===1) { // preloader
        v.files.init(); // load all files
    }

    if (stage===2) { // creation
        v.containers.init(); // set up containers
        v.groups.init(); // set up groups

        v.animate.init();
        v.audio.init();
        v.camera.init();
        v.input.init();
        v.particles.init();
    }

    if (stage===3) {
        v.UI.init();
        v.game.init();
        v.player.init();

        vars.DEBUG ? vars.debugFN.attackLaneInit() : null;
    }
}

vars.boardPositions = {
    // white starting lane
    wS: { x: 1022, y: 184, takenByPlayer: 0, counterName: '' },
    w1: { x: 917,  y: 230, takenByPlayer: 0, counterName: ''  },
    w2: { x: 759,  y: 305, takenByPlayer: 0, counterName: ''  },
    w3: { x: 577,  y: 386, takenByPlayer: 0, counterName: ''  },
    w4: { x: 361,  y: 486, takenByPlayer: 0, counterName: ''  },

    // black starting lane
    bS: { x: 1320, y: 337, takenByPlayer: 0, counterName: ''  },
    b1: { x: 1210, y: 406, takenByPlayer: 0, counterName: ''  },
    b2: { x: 1047, y: 517, takenByPlayer: 0, counterName: ''  },
    b3: { x: 851,  y: 642, takenByPlayer: 0, counterName: ''  },
    b4: { x: 603,  y: 808, takenByPlayer: 0, counterName: ''  },

    // attack lane
    a1: { x: 468,  y: 626, takenByPlayer: 0, counterName: ''  },
    a2: { x: 698,  y: 501, takenByPlayer: 0, counterName: ''  },
    a3: { x: 886,  y: 400, takenByPlayer: 0, counterName: ''  },
    a4: { x: 1046, y: 313, takenByPlayer: 0, counterName: ''  },
    a5: { x: 1179, y: 242, takenByPlayer: 0, counterName: ''  },
    a6: { x: 1290, y: 181, takenByPlayer: 0, counterName: ''  },
    a7: { x: 1390, y: 127, takenByPlayer: 0, counterName: ''  },
    a8: { x: 1477, y: 81 , takenByPlayer: 0, counterName: ''  },

    // white winning lane
    w5: { x: 1352, y:  35, takenByPlayer: 0, counterName: ''  },
    w6: { x: 1260, y:  76, takenByPlayer: 0, counterName: ''  },
    wE: { x: 1152, y: 127, takenByPlayer: 0, counterName: []  },

    // black winning lane
    b5: { x: 1626, y: 132, takenByPlayer: 0, counterName: ''  },
    b6: { x: 1547, y: 187, takenByPlayer: 0, counterName: ''  },
    bE: { x: 1457, y: 255, takenByPlayer: 0, counterName: []  },
}

vars.canvas = {
    width: 1920, height: 1080,
    cX: 1920/2, cY: 1080/2,
}

vars.containers = {
    init: ()=> {

    }
}

vars.files = {
    fileSizes: 0,
    loaded: 0,

    init: ()=> {
        let fV = vars.files;
        fV.audio.init();
        fV.images.init();
    },

    initNext: ()=> {

    },

    audio: {
        init: ()=> {
            let o = '.ogg';
            let aV = vars.audio;

            // load the menu ok sound
            scene.load.audio('menuOK', `audio/menuOK${o}`);

            // load the dice audio
            let aD = 'audio/dice/';
            scene.load.audio('sandHit', `${aD}sandHit${o}`);
            scene.load.audio('diceRoll1', `${aD}dice1${o}`);
            scene.load.audio('diceRoll2', `${aD}dice2${o}`);
            scene.load.audio('diceShakeRoll', `${aD}shakeRollDice${o}`);
            aV.dice.push('diceRoll1','diceRoll2');

            // load the counter slide audio files
            aV.countersMove = Phaser.Utils.Array.NumberArray(1,8,'counterSlide');
            aD = 'audio/counterSlides/';
            aV.countersMove.forEach( (_a)=> { scene.load.audio(_a, `${aD}${_a}${o}`); })

            // voice overs
            // taken from https://www.naturalreaders.com/online/
            // peters voice
            // 24.38% volume - Reverb type: room
            aD = 'audio/voice/';
            ['player', 'rollAgain', 'rollDice', 'youLose', 'youWin', 'youRolledA', 'noValid', 'gameOver', '0', '1', '2', '3', '4'].forEach( (_v)=> {
                scene.load.audio(_v, `${aD}${_v}${o}`);
            });
        }
    },

    images: {
        init: ()=> {
            scene.load.image('sandBG',       'images/sand.jpg');
            scene.load.image('boardBG',      'images/board.png');
            scene.load.atlas('counters',     'images/counters.png', 'images/counters.json');
            scene.load.atlas('dice',         'images/dice.png', 'images/dice.json');
            scene.load.atlas('playerFaces',  'images/playerFaces.png', 'images/playerFaces.json');
            scene.load.atlas('options',      'images/optionImages.png', 'images/optionImages.json');
            scene.load.image('loadedBG',     'images/loadedScreen.jpg');
            scene.load.image('loadedButton', 'images/loaded.png');
            scene.load.image('shielded',     'images/shielded.png');
            scene.load.image('whitePixel',   'images/whitePixel.png');

            if (vars.DEBUG) {
                scene.load.spritesheet('debugBoardPieces', 'images/debugBoardPieces-ext.png', { frameWidth: 30, frameHeight: 30, spacing: 2, margin: 1 })
            } else {
                // if debug isnt enabled, we have to add the debug board image size to the loaded variable
                let fileSize = vars.files.fileSizes.files['debugBoardPieces-ext.png'];
                vars.files.fileSizes.details.loadedSize += fileSize;
            }
        }
    }
}

vars.groups = {
    init: function() {
        scene.groups = {};
        scene.groups.whiteCounters = scene.add.group().setName('whiteCountersGroup');
        scene.groups.blackCounters = scene.add.group().setName('blackCountersGroup');

        scene.groups.debug = scene.add.group().setName('debugGroup');
    }
}

vars.localStorage = {
    init: function() {
        let lS = window.localStorage;
        // LOAD THE VARIABLES
        if (lS.urfaux_DEV===undefined) {
            lS.urfaux_DEV  = false;
        } else {
            vars.DEBUG = (lS.urfaux_DEV==='true');
            if (vars.DEBUG===true) {
                // show debug string
            }
        }
    }
}

vars.game.logo = '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';

vars.phaserObject = {
    destroy: (_t, _o=null)=> {
        if (Array.isArray(_o)) {
            console.log(` 🚽 %c Destroying Object with name %c` + _o[0].name, 'color: #f00;', 'color: white;');
            _o[0].destroy();
        } else if (_o!==null) {
            _o.destroy();
        } else {
            let msg = '🛑💀👎 Object is of unknown type! 👎💀🛑\nIf the console is open execution will pause.';
            alert(msg);
            console.error(msg);
            debugger;
        }
    },

    quickGet: (_oN=null)=> {
        if (_oN===null) { return false; }
        return scene.children.getByName(_oN);
    }
}