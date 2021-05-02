var vars = {
    DEBUG: false,

    version: 0.21,

    boardPositions: {
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
    },

    init: (stage=1)=> { // ENTRY POINT IS HERE
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
    },

    // ENGINE FUNCTIONS
    canvas: {
        width: 1920, height: 1080,
        cX: 1920/2, cY: 1080/2,
    },

    containers: {
        init: ()=> {

        }
    },

    debugFN: {
        bounceTestCounters: ()=> {
            [1,2,3,4,5,6,7,8].forEach( (_cN)=> {
                let a = vars.phaserObject.quickGet(`counterw_${_cN}`);
                let b = vars.phaserObject.quickGet(`counterb_${_cN}`);
                vars.animate.movableCounterBounce(a);
                vars.animate.movableCounterBounce(b);
            })
        },

        showTestCounters: ()=> {
            let testPositions = ['wS','w1','w2','w3','w4', 'w5','w6','wE','bS','b1','b2','b3','b4', 'b5','b6','bE'];
            let bPs = vars.boardPositions;
            let col = 'w'; let count=1;
            testPositions.forEach( (_pos,_i)=> {
                if (_pos==='bS') { col='b'; count=1; } 
                let x = bPs[_pos].x;
                let y = bPs[_pos].y;

                console.log(`position ${_pos}. x: ${x}, y: ${y}`);
                let counterName = _pos[0];
                scene.add.image(x,y,'counters').setFrame(_pos).setDepth(consts.depths.board+1).setName(`counter${col}_${count}`);
                count++;
            })
        }
    },

    files: {
        init: ()=> {
            let fV = vars.files;
            fV.audio.init();
            fV.images.init();
        },

        audio: {
            init: ()=> {
				scene.load.audio('sandHit', 'audio/sandHit.ogg');
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
            }
        }
    },

    groups: {
        init: function() {
			scene.groups = {};
            scene.groups.whiteCounters = scene.add.group().setName('whiteCountersGroup');
            scene.groups.blackCounters = scene.add.group().setName('blackCountersGroup');
        }
    },

    localStorage: {
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
    },

    phaserObject: {
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
    },




    // APP
    animate: {
        init: function() {
            
        },

        diceDrop: (_targets)=> {
            let dur = 1000;
            if (vars.DEBUG) { dur=0; }
            _targets.forEach( (_t,i)=>{
                scene.tweens.add({
                    targets: _t, scale: 0.75,
                    duration: dur, delay: dur*i, ease: 'Quint.easeIn',
                    onComplete: ()=> { vars.audio.playSound('sandHit'); vars.camera.shake(dur/10); }
                })
            })

            setTimeout( ()=> {
                vars.UI.showPlayerText();
            }, dur*4)

            _targets.forEach( (_t,i)=>{
                scene.tweens.add({
                    targets: _t, alpha: 1,
                    duration: dur/2,
                    delay: dur*i
                })
            })
        },

        diceDropShadows: (_targets)=> {
            let dur = 1000;
            if (vars.DEBUG) { dur=0; }
            _targets.forEach( (_t,i)=> {
                scene.tweens.add({
                    targets: _t,
                    alpha: 1,

                    duration: dur, delay: dur*i
                })
            })
        },

        movableCounterBounce: (_o)=> {
            scene.tweens.add({
                targets: _o,
                y: _o.y-20,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Quad'
            })
        },

        initBarrier: ()=> {
            let depth = consts.depths.board+1;
            let a = scene.add.image(1047, 251, 'shielded').setName('shield_1').setDepth(depth).setAlpha(0.05).setTint(0x00ff00).setVisible(false);
            let b = scene.add.image(1047, 251, 'shielded').setName('shield_2').setDepth(depth).setAlpha(1).setTint(0x008000).setVisible(false);
            scene.tweens.add({
                targets: b, alpha: 0.05,
                yoyo: true, repeat: -1,
                duration: 1000
            })

            scene.tweens.add({
                targets: a, alpha: 1,
                yoyo: true, repeat: -1,
                duration: 500
            })
        },

        loadingImageSwitch: ()=> {
            let duration = 1000;
            if (vars.DEBUG) { duration = 0; }
            let depth = consts.depths.loading;
            // fade out the loading text
            let oldText = scene.children.getByName('loadingText');
            scene.tweens.add({
                targets: oldText, alpha: 0,
                duration: duration,
                onComplete: vars.phaserObject.destroy
            })

            // fade out the old loading image
            let oldImage = scene.children.getByName('loadingBG');
            scene.tweens.add({
                targets: oldImage, alpha: 0,
                duration: duration*2,
                onComplete: vars.phaserObject.destroy
            })

            // and show the new loaded image and start button
            let newImage = scene.add.image(vars.canvas.cX, 0, 'loadedBG').setOrigin(0.5,0).setName('loadedBG').setAlpha(0).setDepth(depth);
            let loadedButton = scene.add.image(vars.canvas.cX, vars.canvas.cY, 'loadedButton').setName('loadedButton').setAlpha(0).setDepth(depth+1).setInteractive();
            // fade in the loaded image
            scene.tweens.add({
                targets: newImage, alpha: 1,
                duration: duration*2
            })

            scene.tweens.add({
                targets: loadedButton, alpha: 1,
                duration: duration*2, delay: duration*2
            })
        },

        pointsCount: (_p, _show=true)=> {
            if (_p===null) { p=scene.children.getByName('pointsCount'); } // when showing the points, the points text object is passed in, otherwise we have to grab it
            let alpha = _show === true ? 1 : 0;
            scene.tweens.add({
                targets: _p,
                alpha: alpha,
                diration: 500
            })
        },

        randomiseDice: (_diceArray)=> {
            if (Array.isArray(_diceArray)) { // all 4 dice have been passed (default entry point)
                _diceArray.forEach( (dO,i)=> {
                    scene.tweens.add({
                        targets: dO, alpha: 0,
                        duration: 250, delay: i*125,
                        yoyo: true,
                        onYoyo: vars.game.diceUpdate,
                        onComplete: vars.game.diceUpdate
                    })
                })
            } else { // single die has been passed
                console.log(` > Looping for die ${_diceArray.name.replace('dice','')}`);
                scene.tweens.add({
                    targets: _diceArray, alpha: 0,
                    duration: 250,
                    yoyo: true,
                    onYoyo: vars.game.diceUpdate,
                    onComplete: vars.game.diceUpdate
                })
            }
        },

        showBarrier: (_show=true)=> { // this deals with showing and hiding the barrier
            // when a players counter lands on "a4" a barrier shows. when they move away from it the barrier hides
            scene.children.getByName('shield_1').setVisible(_show);
            scene.children.getByName('shield_2').setVisible(_show);
        },

        startingCounter: (_cID, _moveTo) => {
            let playerColour = _cID.replace('counter','')[0] === 'w' ? 'white' : 'black';
            console.log(`Showing starter counter for ${playerColour}`);
            let counter = vars.phaserObject.quickGet(_cID);
            counter.setData('moveTo', _moveTo);
            scene.tweens.add({
                targets: counter,
                alpha: 1,
                duration: 333
            })
            vars.animate.movableCounterBounce(counter);
        }
    },

    audio: {
        init: function() {
            scene.sound.volume=0.1;
        },

        playSound: function(_key) {
            scene.sound.play(_key);
        },
    },

    camera: {
        mainCam: null,

        init: function() {
            vars.camera.mainCam = scene.cameras.main;
        },

        shake: function(_force=50) {
            vars.camera.mainCam.shake(_force);
        }
    },

    game: {
        init: ()=>{

        },

        diceUpdate: (_tween, _object)=> {
            // this can handle onYoyo and onComplete
            let complete = false;
            if (Array.isArray(_object)) {
                _object = _object[0];
                complete=true;
                console.log(`Dice Update (onComplete) for ${_object.name}`);
            } else {
                console.log(`Dice Update (onYoyo) for ${_object.name}`);
            }

            // get a random die face
            let rollNumber = _object.getData('rollNumber');
            if (rollNumber<8) {
                rollNumber++;
                let frameName = shuffle(Phaser.Utils.Array.NumberArray(1,4,'dice'))[0];
                frameName==='dice1' ? _object.setData('points', 1) : _object.setData('points', 0);
                _object.setData('rollNumber', rollNumber);
                _object.setFrame(frameName);

                if (complete===true && rollNumber!==8) {
                    vars.animate.randomiseDice(_object);
                } else if (rollNumber===8) {
                    console.log(`  ${_object.name} has rolled 8 times`);
                    
                    // this die has rolled 4 full times, add it to the total
                    let points = _object.getData('points');
                    vars.player.pointsTotal+=points;
                    vars.player.diceComplete++;

                    if (vars.player.diceComplete===4) { // all dice have been counted
                        console.groupEnd();
                        // show the counter
                        vars.UI.showPointsCount();
                        let validMoves = vars.game.getValidMoves();

                        if (validMoves==='points') { // the player rolled a 0 (lol)
                            // show some sort of error message and reset everything
                            console.log(`🔨🔨🔨 TO BE DONE 🔨🔨🔨\nPlayer threw a 0. Show pop up and move onto next player`);
                        }
                        // reset the player variables
                        vars.player.diceComplete=0;
                    }
                }
            }
        },

        getBoardPosition: ()=> {
            
        },

        getDiceObjects: ()=> {
            let diceObjects = [];
            [1,2,3,4].forEach( (dN)=> {
                diceObjects.push(scene.children.getByName(`dice${dN}`));
            })
            return diceObjects;
        },

        getValidMoves: ()=> {
            let pV = vars.player;
            let points = pV.pointsTotal;
            if (points===0) {
                return 'points';
            }

            let currentPlayer = pV.current;
            let cPColour = currentPlayer === 1 ? 'white' : 'black';
            console.log(`Looking for valid moves for player ${currentPlayer} who rolled a ${points}`);

            let bPs = vars.boardPositions;
            let board = currentPlayer === 1 ? consts.playerPaths.white : consts.playerPaths.black;
            
            // CHECK FOR VALID MOVES
            let validMoves = [];
            // if there are still counters to enter the board
            if (pV.counters[cPColour].atStart.length>0) {
                let counterID = pV.counters[cPColour].atStart.pop();
                let moveToPosition = board[points];
                if (bPs[moveToPosition].takenByPlayer===0) {
                    validMoves.push([`${cPColour.charAt(0)}S`,moveToPosition, null]);
                    vars.animate.startingCounter(counterID, moveToPosition);
                }
            }

            // now check all other counters on the board
            // limit the search for counters to "colours End" minus "points"
            let ignoreFrom = board[board.length-points];
            let found = false;
            board.every( (_p, _i)=> {
                if (_p===ignoreFrom) { found=true; }
                if (found===true) { return false; }
                // then we can check each of the positions for a valid move
                let takenByPlayer = bPs[_p].takenByPlayer;
                if (takenByPlayer === currentPlayer) {
                    console.log(`Found a counter at board position ${_p} for player ${currentPlayer}`);
                    // check board position += points for counter
                    let newPos = board[_i+points];
                    let op = bPs[newPos].takenByPlayer;
                    if (op!==currentPlayer && newPos!=='a4') {
                        if (bPs[newPos].takenByPlayer!==currentPlayer) {
                            validMoves.push([_p, newPos, op]);
                        }
                    } 
                }
                return true;
            })


            if (validMoves.length>0) {
                console.log(`😀 ${validMoves.length} valid move(s) found`);
                console.log(validMoves);
            } else {
                console.log('😕 No valid moves were found!');
                return false;
            }

            return validMoves;
        },

        onValidMove: ()=> {
            // move the counter to the position on the board

            // reset all the dice data
            let diceArray = vars.game.getDiceObjects();
            diceArray.forEach( (d)=> { vars.game.resetDiceData(d); })

            // update the player and UI
            vars.player.nextPlayer();
        },

        rollDice: ()=> {
            // disable input
            vars.input.setEnabled(false);
            // play dice roll sound
            
            // animate the 4 dice
            let diceArray = vars.game.getDiceObjects();
            vars.input.diceEnable(diceArray, false);
            console.groupCollapsed('🎲 Rolling the Dice')
            vars.animate.randomiseDice(diceArray);

            // highlight current players pieces that can move
            // this is done in after all dice have been randomised 4 times. Its handled in game.diceUpdate
        },

        resetDiceData: (_o)=> {
            _o.setData({points: 1, rollNumber: 0 })
            _o.setFrame('dice1');
        }

    },

    input: {
        enabled: true,

        init: function() {
            scene.input.on('gameobjectdown', function (pointer, gameObject) {
                let iV = vars.input;
                console.log(`Pointer position: x: ${~~(pointer.position.x+0.5)}, y: ${~~(pointer.position.y+0.5)}`);
                if (iV.enabled===false) {
                    console.log('Input is currently disabled.');
                    return false;
                }

                // click functions
                let oName = gameObject.name;
                console.log(`Input: User clicked on ${oName}`);
                if (oName.includes('dice')) {
                    // roll dice
                    vars.game.rollDice();
                } else if (oName==='loadedButton') {
                    gameObject.disableInteractive();
                    // fade out the loaded screen and text
                    // then start the game
                    let bg = scene.children.getByName('loadedBG');
                    let btn = scene.children.getByName('loadedButton');
                    let dur=2000;
                    if (vars.DEBUG) { dur=0; }
                    scene.tweens.add({
                        targets: [bg,btn],
                        alpha: 0,
                        duration: dur,
                        onComplete: vars.phaserObject.destroy
                    })

                    setTimeout( ()=> {
                        vars.init(3);
                    }, dur*(4/5))
                } else {
                    console.log(`Game object with name "${gameObject.name}" was clicked. No handler found.`);
                }
            })

            scene.input.on('gameobjectover', function (pointer, gameObject) {
                // over functions
            });

            scene.input.on('gameobjectout', function (pointer, gameObject) {
                // out functions
            });
        },

        diceEnable: (_dice, _e=true)=> {
            let dice = _dice;
            if (_e===true) {
                console.log('Enabling input on all dice.');
                dice.forEach( (_d)=> {
                    _d.setInteractive();
                })
            } else {
                console.log('Disabling input on all dice.');
                dice.forEach( (_d)=> {
                    _d.disableInteractive();
                })
            }
        },

        setEnabled: (_opt=true)=> {
            vars.input.enabled=!_opt;
            console.log(`Input has been set to ${!_opt.toString()}`);
        }

    },

    particles: {
        init: function() {
            // particles are stored here
        }
    },

    player: {
        current: 1,
        pointsTotal: 0,
        diceComplete: 0,

        counters: {
            white: {
                atStart: [],
                completed: [],
            },
            black: {
                atStart: [],
                completed: [],
            }
        },

        init: ()=> {
            let cV = vars.player.counters;
            cV.white.atStart = Phaser.Utils.Array.NumberArray(1,6,'counterw_')
            cV.black.atStart = Phaser.Utils.Array.NumberArray(1,6,'counterb_')
        },

        nextPlayer: ()=> {
            let pV = vars.player;
            pV.current = pV.current === 1 ? 2 : 1;

            // hide the roll text
            vars.animate.pointsCount(null, false)
            // update the current player text
            vars.UI.playerUpdate(pV.current);
        },

        rollCountReset: ()=> {
            vars.player.rollCount=0;
        }
    },

    UI: {
        init: ()=> {
            console.log('Initialising the UI');
            let dC = consts.depths;
            let depth = dC.board;

            // draw the background (game board)
            scene.add.image(vars.canvas.cX, vars.canvas.cY, 'gameBG').setInteractive().setName('gameBoard').setDepth(depth);

            // draw the background for the dice area
            scene.add.image(1350, 550, 'whitePixel').setName('diceBlackBG').setTint(0x0).setAlpha(0.35).setDepth(depth+2).setScale(450,450).setOrigin(0);
            scene.add.text(1500, 585, 'Player 1').setName('playerText').setFontSize(32).setFontStyle('bold').setFontFamily('Consolas').setAlign('center').setAlpha(0).setDepth(depth+3).setShadow(4,4,'#000',1);
            scene.add.text(1400, 950, 'Please roll the dice').setName('rollText').setFontSize(32).setFontStyle('bold').setFontFamily('Consolas').setAlign('center').setAlpha(0).setDepth(depth+3).setShadow(4,4,'#000',1);

            // DICE
            // draw the dice and animate them into position
            let alpha = consts.alphas.ZERO;
            let scale = 0.75;
            let diceScale = 5;
            let diceDepth = dC.dice;
            
            depth = dC.dice-1;
            let positions = [[1500,700], [1650,700], [1500,840], [1650,840]];
            let dropShadows = []
            let dice = []
            positions.forEach( (_p, _i)=> {
                dropShadows.push(scene.add.image(_p[0], _p[1], 'dice').setFrame('diceBG').setName(`d${_i+1}_Shadow`).setScale(scale).setAlpha(alpha).setDepth(depth));
                dice.push(scene.add.image(_p[0], _p[1], 'dice').setName(`dice${_i+1}`).setScale(diceScale).setAlpha(alpha).setInteractive().setDepth(diceDepth).setData({ points: 1, rollNumber: 0 }));
            })

            // now the counter for after the dice has been rolled
            scene.add.text(1575, 775, '4').setColor('red').setName('pointsCount').setFontSize(96).setScale(3).setFontStyle('bold').setFontFamily('Consolas').setAlign('center').setAlpha(0).setDepth(depth+1).setOrigin(0.5).setShadow(2,2,'#000',3);

            // animate the shadows
            // drop the dice into place
            vars.animate.diceDropShadows(dropShadows);
            vars.animate.diceDrop(dice);
            // END OF DICE

            // COUNTERS
            let bPs = vars.boardPositions;
            let startPosWhite = [ bPs.wS.x, bPs.wS.y];
            let startPosBlack = [ bPs.bS.x, bPs.bS.y];
            [1,2,3,4,5,6].forEach( (_c)=> {
                scene.add.image(startPosWhite[0], startPosWhite[1],'counters').setFrame('wS').setDepth(depth).setAlpha(0).setName(`counterw_${_c}`).setData('moveTo','');
                scene.add.image(startPosBlack[0], startPosBlack[1],'counters').setFrame('bS').setDepth(depth).setAlpha(0).setName(`counterb_${_c}`).setData('moveTo','');
            })
            // END OF COUNTERS

            // pop up bg
            //scene.add.image(vars.canvas.cX, vars.canvas.cY, 'whitePixel').setTint()

            vars.animate.initBarrier();

        },

        playerUpdate: (_p)=> {
            // is the player var valid?
            if (_p!==1 && _p!==2) { console.error(`Invalid player number (${_p})`); return false; }
            let icon = _p===1 ? '🦳' : '🦱';
            console.log(`Next player is ${icon}`);
            // it is. update the UI
            scene.children.getByName('playerText').setText(`Player ${_p}`)
        },

        showMessage: ()=>{

        },

        showPlayerText: ()=> {
            let pT = scene.children.getByName('playerText');
            let rT = scene.children.getByName('rollText');

            let dur=1000;
            if (vars.DEBUG) { dur=0; }

            scene.tweens.add({
                targets: [pT, rT], alpha: 1,
                duration: dur
            })
        },

        showPointsCount: ()=> {
            let points = vars.player.pointsTotal;
            let pC = scene.children.getByName('pointsCount');
            pC.setText(points);
            vars.animate.pointsCount(pC, true);
        }
    }

}