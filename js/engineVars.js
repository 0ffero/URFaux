vars.init = (stage=1)=> { // ENTRY POINT IS HERE
    let v = vars;

    console.log(`Initialising Stage ${stage}`);
    if (stage===1) { // preloader
        v.localStorage.init(); // initialise local storage vars
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
    init: ()=> {
        let fV = vars.files;
        fV.audio.init();
        fV.images.init();
    },

    audio: {
        init: ()=> {
            scene.load.audio('sandHit', 'audio/sandHit.ogg');
            scene.load.audio('diceRoll1', 'audio/dice1.ogg');
            scene.load.audio('diceRoll2', 'audio/dice2.ogg');

            vars.audio.dice.push('diceRoll1','diceRoll2');
        }
    },

    images: {
        init: ()=> {
            scene.load.image('gameBG',       'images/boardBG.jpg');
            scene.load.atlas('counters',     'images/counters.png', 'images/counters.json');
            scene.load.atlas('dice',         'images/dice.png', 'images/dice.json');
            scene.load.image('loadedBG',     'images/loadedScreen.jpg');
            scene.load.image('loadedButton', 'images/loaded.png');
            scene.load.image('shielded',     'images/shielded.png');
            scene.load.image('whitePixel',   'images/whitePixel.png');

            if (vars.DEBUG) {
                scene.load.spritesheet('debugBoardPieces', 'images/debugBoardPieces-ext.png', { frameWidth: 30, frameHeight: 30, spacing: 2, margin: 1 })
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

vars.phaserObject = {
    destroy: (_t, _o=null)=> {
        if (Array.isArray(_o)) {
            console.log(`Destroying Object\n` + _o[0].name);
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
        if (_oN===null) {
            return false;
        }

        return scene.children.getByName(_oN);
    }
}