var vars = {
    DEBUG: false,

    version: 0.25,

    // APP
    animate: {
        bouncingCounters: [],

        init: function() {
            
        },

        counterBounceTweensStop: ()=> {
            console.log(`💀 Killing bounce tweens.`);
            vars.animate.bouncingCounters.forEach( (_bC)=> {
                let obj = _bC.targets[0];
                _bC.stop(); // stop the bounce animation
                let x = obj.getData('x'); let y = obj.getData('y');
                obj.setPosition(x,y); // place the object in its original spot
            })
            vars.animate.bouncingCounters = [];
        },

        counterToNewPosition: (_object)=> {
            let targetPosition = _object.getData('moveTo');
            let startPosition = _object.getData('moveFrom');
            let gV = vars.game;
            if (!startPosition.includes('S') && gV.startingCounter!='') { // if this isnt a start counter, but there is one visible
                // we need to hide that start counter
                let counterName = gV.startingCounter;
                let hideMe = vars.phaserObject.quickGet(counterName);
                gV.startingCounter = '';
                scene.tweens.add({
                    targets: hideMe,
                    alpha: 0,
                    duration: consts.durations.counterMove
                })
                // and push it back into the starting array
                let pC;
                if (counterName.replace('counter','')[0]==='w') {
                    console.log(`🞉 Pushing WHITE counter back onto start position`);
                    pC = vars.player.counters.white;
                } else {
                    console.log(`🞅 Pushing BLACK counter back onto start position`);
                    pC = vars.player.counters.black;
                }
                pC.atStart.push(counterName);
            }
            console.log(`Moving counter with name ${_object.name} to ${targetPosition}`);
            vars.animate.counterBounceTweensStop();
            let counterMoves = vars.game.generateBoardPath(startPosition, targetPosition);
            if (vars.DEBUG) { console.log(counterMoves);}
            let dur = consts.durations.counterMove;
            let total = counterMoves.length-1;

            // if this counter isnt moving from the start position
            // we have to remove the piece from the current board first
            if (!startPosition.includes('S')) {
                let oldPos = vars.boardPositions[startPosition];
                oldPos.takenByPlayer=0; oldPos.counterName='';
            }
            // now start moving the counter
            let onComplete = vars.animate.counterUpdateFrame;
            counterMoves.forEach( (_m, _i)=> {
                let lastCounter = [_m[0], false];
                let x = _m[1].x; let y = _m[1].y;
                if (_i === total) { lastCounter[1] = true; }
                scene.tweens.add({
                    targets: _object,
                    x: x, y: y,
                    duration: dur, delay: _i*dur,
                    onComplete: onComplete, onCompleteParams: [lastCounter]
                })

            })
        },

        counterUpdateFrame: (_t, _o, _lastCounter)=> {
            let object = _o[0];
            let cName = object.name;
            let bPos = _lastCounter[0];
            let lastMove = _lastCounter[1];
            // UPDATE THE COUNTERS FRAME TO THE NEW POSITION
            object.setFrame(bPos);
            // set this counters position using "set data on _o"

            if (lastMove===true) {
                // WE NEED TO UPDATE THE COUNTER OBJECTS DATA
                let x = object.x; let y = object.y;
                object.setData({ boardPosition: bPos, moveFrom: '', moveTo: '', x: x, y: y });
                // UPDATE THE BOARD POSITIONS
                let bP = vars.boardPositions[bPos];
                bP.takenByPlayer = vars.player.current;
                let win = false;
                if (bPos.includes('E')) {
                    bP.counterName.push(cName);
                    // check for win
                    let win = vars.game.checkForWin(bP);
                } else {
                    bP.counterName=cName;
                }

                if (win===true) {
                    // show win message etc TODO
                    vars.UI.showMessage(`PLAYER ${vars.player.current} WINS!`, -1);
                    return false;
                }


                // TEST IF THE PLAYER LANDED ON A "FREE SHOT" SQUARE
                let pCol = cName.replace('counter','')[0];
                if (bPos===`${pCol}4` || bPos===`${pCol}6` || bPos===`a4`) { // the current player gets another shot
                    vars.player.nextPlayer(true);
                } else { // next players shot
                    vars.player.nextPlayer();
                }

            }
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

        initBarrier: ()=> {
            let depth = consts.depths.board+1;
            barrier = 'newBarrier';
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

        movableCounterBounce: (_o)=> {
            vars.animate.bouncingCounters.push(scene.tweens.add({
                targets: _o,
                y: _o.y-20,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Quad'
            }))
        },

        pointsCount: (_p, _show=true)=> {
            if (_p===null) { _p=scene.children.getByName('pointsCount'); } // when showing the points, the points text object is passed in, otherwise we have to grab it
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

        showMessage: (_msg, _dur)=> { // variables have already been confirmed by this point
            let bg = vars.phaserObject.quickGet('popupBG');
            // set the message
            let msgText = vars.phaserObject.quickGet('popupText');
            msgText.setText(_msg).setOrigin(0.5);

            // now animate the popup
            let yoyo = true; let hold = _dur;
            if (_dur===-1) { // this pop up doesnt disappear until its clicked
                yoyo = false;
                hold = null;
            }
            let duration = consts.durations.popup;
            // MESSAGE TEXT
            scene.tweens.add({
                targets: msgText,
                alpha: 1,
                yoyo: yoyo, hold: hold, duration: duration*2,
                ease: 'Power1'
            })
            // BACKGROUND
            scene.tweens.add({
                targets: bg,
                alpha: 0.9,
                yoyo: yoyo, hold: hold, duration: duration*2,
                ease: 'Power1'
            })
        },

        startingCounter: (_cID, _moveTo) => {
            let playerColour = _cID.replace('counter','')[0] === 'w' ? 'white' : 'black';
            console.log(`Showing starter counter for ${playerColour}`);
            let counter = vars.phaserObject.quickGet(_cID);
            counter.setData({ 'moveTo': _moveTo, 'moveFrom': _moveTo[0] + 'S' });
            scene.tweens.add({
                targets: counter,
                alpha: 1,
                duration: 333
            })
            vars.animate.movableCounterBounce(counter);
        }
    },

    audio: {
        dice: [],

        init: function() {
            scene.sound.volume=0.1;
        },

        playSound: function(_key) {
            scene.sound.play(_key);
        },

        rollDice: ()=> {
            vars.audio.playSound(shuffle(vars.audio.dice)[0]);
        }
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
        startingCounter: '',

        init: ()=>{

        },

        checkForWin: (_counterArray)=> {
            if (!Array.isArray(_counterArray)) {
                console.error('Check for win requires an array to be passed to it!');
                return false;
            }
            return _counterArray.length === 6 ? true : false;
        },

        diceUpdate: (_tween, _object)=> {
            // this can handle onYoyo and onComplete
            let complete = false;
            let maxRolls = consts.dice.maxRolls;
            if (Array.isArray(_object)) {
                _object = _object[0];
                complete=true;
                console.log(`Dice Update (onComplete) for ${_object.name}`);
            } else {
                console.log(`Dice Update (onYoyo) for ${_object.name}`);
            }

            // get a random die face
            let rollNumber = _object.getData('rollNumber');
            if (rollNumber<maxRolls) {
                rollNumber++;
                let frameName = -1;
                // i had to add a better luck system as 0 was being thrown, like, a lot
                // chance of throwing a 1 is now 50f/50a;
                // where as the original chances were 25f/75a
                if (vars.player.betterLuck===true) {
                    frameName = vars.player.betterLuckFn();
                } else {
                    frameName = shuffle(Phaser.Utils.Array.NumberArray(1,4,'dice'))[0];
                }
                frameName==='dice1' ? _object.setData('points', 1) : _object.setData('points', 0);
                _object.setData('rollNumber', rollNumber);
                _object.setFrame(frameName);

                if (complete===true && rollNumber!==maxRolls) {
                    vars.animate.randomiseDice(_object);
                } else if (rollNumber===maxRolls) {
                    console.log(`  ${_object.name} has rolled ${maxRolls} times`);
                    
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
                            console.log(`Player threw a 0. Showing pop up message`);
                            let players = vars.player.getCurrent();
                            let msg = `Player ${players[0]} threw a 0.\n\nPlayer ${players[1]}, please throw the dice.`;
                            vars.UI.showMessage(msg);
                            // reset the player variables
                            vars.player.nextPlayer('skip');
                            return false;
                        }

                        // we have valid moves
                        // bounce the counters that can move

                        debugger;
                    }
                }
            }
        },

        generateBoardPath: (_startPosition, _endPosition)=> {
            if (_startPosition.length!==2 || _endPosition.length!==2) {
                console.error(`Start position (${_startPosition}) or end position (${_endPosition}) is invalid`);
                return false;
            }

            // get the board path for the players colour
            // each board position takes 333ms to traverse
            // as the max roll is 4 this means the total time for movement is 1.333 seconds
            let colour = _startPosition[0] === 'w' ? 'white' : 'black';
            let path = consts.playerPaths[colour];
            let bPs = vars.boardPositions;
            let counterPath = [];
            let foundStart = false;
            let foundEnd = false;
            path.forEach( (_p)=> {
                if (_endPosition===_p) { // this is the destinaation for the counter
                    console.log('Found the end position');
                    counterPath.push([_p, bPs[_p]]);
                    foundEnd = true;
                }

                if (foundStart===true && foundEnd===false) {
                    counterPath.push([_p, bPs[_p]]);
                }

                if (_startPosition===_p && foundStart===false) {
                    console.log('Found the start position');
                    foundStart=true;
                }
            })
            return counterPath;
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
            let validMoves = [
                // format is CURRENT POSITION, NEW POSITION, AND ORIGINAL PLAYER (IF SOMEONES ALREADY ON THE SQUARE)
            ];

            // if there are still counters to enter the board
            // START POSITION COUNTERS
            if (pV.counters[cPColour].atStart.length>0) {
                let counterID = pV.counters[cPColour].atStart.pop();
                let moveToPosition = board[points];
                if (bPs[moveToPosition].takenByPlayer===0) { // CHECK THAT THE MOVE TO POSITION ISNT ALREADY TAKEN BY CURRENT PLAYER
                    validMoves.push([`${cPColour[0]}S`,moveToPosition, null]);
                    vars.animate.startingCounter(counterID, moveToPosition);
                    vars.game.startingCounter = counterID;
                }
            }

            // ALL OTHER COUNTERS ON THE BOARD
            // limit the search for counters to "colours End" minus "points"
            let ignoreFrom = board[board.length-points];
            let found = false;
            board.every( (_p, _i)=> {
                if (_p===ignoreFrom) { found=true; }
                if (found===true) { return false; }
                // then we can check each of the positions for a valid move
                let takenByPlayer = bPs[_p].takenByPlayer;
                let counterID = bPs[_p].counterName;
                if (takenByPlayer === currentPlayer) {
                    console.log(`Found a counter at board position ${_p} for player ${currentPlayer}`);
                    // check board position += points for counter
                    let newPos = board[_i+points];
                    let op = bPs[newPos].takenByPlayer;
                    if (op!==currentPlayer && newPos!=='a4') {
                        if (bPs[newPos].takenByPlayer!==currentPlayer) {
                            validMoves.push([_p, newPos, op]);
                            // bounce this counter
                            let _o = vars.phaserObject.quickGet(counterID);
                            _o.setData({ moveTo: newPos, moveFrom: _p });
                            vars.animate.movableCounterBounce(_o);
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

        diceEnable: ()=> {
            // move the counter to the position on the board

            // re-enable the dice
            let diceArray = vars.game.getDiceObjects();
            vars.input.diceEnable(diceArray, true);
            // reset all the dice data
            diceArray.forEach( (d)=> { vars.game.resetDiceData(d); })
        },

        resetDiceData: (_o)=> {
            _o.setData({ rollNumber: 0 })
            //_o.setFrame('dice1');
        },

        rollDice: ()=> {
            // disable input - this needs re-written to simply disable all dice
            //vars.input.setEnabled(false);
            // change the roll text
            vars.UI.rollTextSwitch();
            // play dice roll sound
            vars.audio.rollDice();

            // animate the 4 dice
            let diceArray = vars.game.getDiceObjects();
            vars.input.diceEnable(diceArray, false);
            console.groupCollapsed('🎲 Rolling the Dice')
            vars.animate.randomiseDice(diceArray);

            // highlight current players pieces that can move
            // this is done in after all dice have been randomised 4 times. Its handled in game.diceUpdate
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
                } else if (oName.includes('counter')) {
                    vars.animate.counterToNewPosition(gameObject);
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
            /* vars.input.enabled=!_opt;
            console.log(`Input has been set to ${!_opt.toString()}`); */
        }

    },

    particles: {
        init: function() {
            // particles are stored here
        }
    },

    player: {
        betterLuck: true, // this changes the chances of the die to roll a one from 25% to 50% as a lot of 0's were being thrown
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
            cV.white.atStart = Phaser.Utils.Array.NumberArray(1,6,'counterw_');
            cV.black.atStart = Phaser.Utils.Array.NumberArray(1,6,'counterb_');
        },

        betterLuckFn: ()=> {
            console.log(' ...Better Luck Function');
            let frameName = shuffle([1,2])[0];
            if (frameName===1) {
                frameName = 'dice1';
            } else {
                frameName = shuffle(Phaser.Utils.Array.NumberArray(2,4,'dice'))[0];
            }
            return frameName;
        },

        getCurrent: ()=> {
            let players = vars.player.current === 1 ? [1,2] : [2,1];
            return players;
        },

        nextPlayer: (_anotherShot=false)=> {
            let pV = vars.player;
            let msg = '';
            if (_anotherShot===false || _anotherShot==='skip') {
                // update the current player and text
                pV.current = pV.current === 1 ? 2 : 1;
                if (_anotherShot!=='skip') { msg = `Player ${pV.current}\n\nPlease roll the dice`; }
                vars.UI.playerUpdate(pV.current);
            } else {
                msg = `Player ${pV.current}\n\nYou landed on a free shot sqaure\n\nPlease roll the dice again`;
            }

            if (_anotherShot!=='skip') { // show pop up message if applicable
                vars.UI.showMessage(msg, 1000);
            }

            // reset the player vars
            vars.player.pointsTotal=0;
            vars.player.diceComplete=0;

            // hide the points (roll) text
            vars.animate.pointsCount(null, false);

            // switch the roll text
            vars.UI.rollTextSwitch();

            // enable the dice
            vars.game.diceEnable();


            if (vars.DEBUG) {
                vars.debugFN.updateDebugBoard();
            }
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
            scene.add.text(1400, 935, 'Please roll the dice').setName('rollText').setFontSize(32).setFontStyle('bold').setFontFamily('Consolas').setAlign('center').setAlpha(0).setDepth(depth+3).setShadow(4,4,'#000',1).setData('old','');

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
                scene.add.image(startPosWhite[0], startPosWhite[1],'counters').setFrame('wS').setDepth(depth).setAlpha(0).setName(`counterw_${_c}`).setData({moveFrom: '', moveTo: '', x: startPosWhite[0], y: startPosWhite[1], boardPosition: '' }).setInteractive();
                scene.add.image(startPosBlack[0], startPosBlack[1],'counters').setFrame('bS').setDepth(depth).setAlpha(0).setName(`counterb_${_c}`).setData({moveFrom: '', moveTo: '', x: startPosBlack[0], y: startPosBlack[1], boardPosition: '' }).setInteractive();
            })
            // END OF COUNTERS

            // pop up bg
            let msgDepth = consts.depths.message;
            scene.add.image(vars.canvas.cX, vars.canvas.cY, 'whitePixel').setName('popupBG').setTint('#000').setScale(vars.canvas.width, vars.canvas.height).setDepth(msgDepth-1).setAlpha(0);
            scene.add.text(vars.canvas.cX, vars.canvas.cY, '...').setName('popupText').setColor('#ff0').setFontSize(96).setFontStyle('bold').setFontFamily('Consolas').setAlign('center').setAlpha(0).setDepth(msgDepth).setShadow(8,8,'#000',2);

            // barrier for a4
            vars.animate.initBarrier();

        },

        playerUpdate: (_p)=> {
            // is the player var valid?
            if (_p!==1 && _p!==2) { console.error(`Invalid player number (${_p})`); return false; }
            // it is. update the UI
            let icon = _p===1 ? '🦳' : '🦱';
            console.log(`Next player is ${icon}`);
            scene.children.getByName('playerText').setText(`Player ${_p}`)
        },

        rollTextSwitch: ()=> {
            let txtObj = scene.children.getByName('rollText');
            let oldText = txtObj.getData('old');
            let newText='';
            if (oldText==='') { newText = 'Please roll the dice'; }
            txtObj.setText(oldText).setData('old', newText);
        },

        showMessage: (_message, _duration=2000)=>{
            if (_message.length===0) {
                console.error('The message length was 0!')
                return false;
            }

            vars.animate.showMessage(_message, _duration);
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