var vars = {
    DEBUG: false,

    version: 0.6,

    // APP
    animate: {
        popupWait: -1,
        shieldTween: false,

        bouncingCounters: [],

        init: function() {
            console.log('  ..initialising animations and vars');
             vars.animate.popupWait=0;
        },

        counterBounceTweensStop: ()=> {
            if (vars.DEBUG) { console.log(`💀 Killing bounce tweens.`); }
            vars.animate.bouncingCounters.forEach( (_bC)=> {
                let obj = _bC.targets[0];
                _bC.stop(); // stop the bounce animation
                let x = obj.getData('x'); let y = obj.getData('y');
                obj.setPosition(x,y); // place the object in its original spot
            })
            vars.animate.bouncingCounters = [];
        },

        counterFadeOut: (_t,_o)=> {
            console.log(`Fading out ${_o[0].name}`);
            let bPs = vars.boardPositions;
            let frameName = `${_o[0].frame.name[0]}S`;
            let x = bPs[frameName].x; let y = bPs[frameName].y;
            _o[0].setFrame(frameName).setDepth(_o[0].depth-1);
            _o[0].setData({ boardPosition: '', x: x, y: y });
            scene.tweens.add({
                targets: _o[0],
                alpha: 0,
                duration: 500
            })
        },

        counterToEndPosition: (_oName)=> {
            vars.DEBUG ? console.log(`Dropping counter ${_oName} to end position`) : null;
            let ctr = vars.phaserObject.quickGet(_oName);
            if (!ctr) {
                console.error(`The counter (${_oName}) was NOT found!`);
                return false;
            }

            // black counters require a small offset to the x position
            let col = _oName.replace('counter','')[0];
            let xOffset = col === 'b' ? -20: 0;

            // set the counters depth based on the amount of counters at end position
            let completed = vars.player.counters.white.completed.length;
            let depth = consts.depths.countersComplete + completed;
            depth += col === 'b' ? 10 : 0; // move the black counters above the board (white depths = 2-8, black depths = 12-18)
            ctr.setData({ finalDepth: depth });

            // figure out the drop amount in px
            let maxDrop = 60;
            let counterYDrop = maxDrop - (completed * 10)
            // and animate
            scene.tweens.add({
                targets: ctr,
                x: ctr.x+xOffset, y: ctr.y+counterYDrop,
                duration: 500,
                onComplete: (_t, _o)=> { _o[0].setDepth(~~(_o[0].getData('finalDepth'))); _o[0].data.remove('finalDepth'); }
            })
        },

        counterToNewPosition: (_object)=> {
            let startPosition = _object.getData('moveFrom');
            let targetPosition = _object.getData('moveTo');
            vars.DEBUG ? console.log(`Moving from ${startPosition} to ${targetPosition}`) : null;
            let objectColour = _object.name.replace('counter','')[0];
            let gV = vars.game;
            let pV = vars.player;
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
                let counterIcon = '🞅';
                if (counterName.replace('counter','')[0]==='w') {
                    counterIcon = '🞉';
                    vars.DEBUG ? console.log(` ${counterIcon} Pushing WHITE counter back onto start position`) : null;
                    pC = pV.counters.white;
                } else {
                    vars.DEBUG ? console.log(` ${counterIcon} Pushing BLACK counter back onto start position`) : null;
                    pC = pV.counters.black;
                }
                pC.atStart.push(counterName);
            } else if (gV.startingCounter!=='') {
                gV.startingCounter='';
            }
            vars.DEBUG ? console.log(` 🞅 🡺 Moving counter with name ${_object.name} to ${targetPosition}`) : null;
            vars.animate.counterBounceTweensStop();
            let counterPath = objectColour === 'w' ? [...consts.playerPaths.white] : [...consts.playerPaths.black];
            let counterMoves = gV.generateBoardPath(startPosition, targetPosition, counterPath);
            vars.DEBUG ? console.log(counterMoves) : null;
            let dur = consts.durations.counterMove;
            let total = counterMoves.length-1;

            // if this counter isnt moving from the start position
            // we have to remove the piece from the current board first
            if (!startPosition.includes('S')) {
                let oldPos = vars.boardPositions[startPosition];
                oldPos.takenByPlayer=0; oldPos.counterName='';
            }

            // NOW. If we are moving from a4, we need to remove the shield
            startPosition === 'a4' ? vars.animate.showBarrier(false) : null;

            // increase the counters depth so it moves above the other counters
            _object.setDepth(_object.depth+1);
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

        counterToStart: (_cObject)=> {
            vars.DEBUG ? console.log(`Sending ${_cObject.name} to start position`) : null;
            let path = vars.game.generateBackToStartPath(_cObject);

            if (!path) {
                 console.error('Unable to generate path for this counter!');
                 console.log(`Name of counter ${_cObject.name}`);
                 console.log(_cObject);
                 return false;
            }

            // increase the counters depth so it moves above the other counters
            _cObject.setDepth(_cObject.depth+1);
            let bPs = vars.boardPositions;
            path.forEach( (_dest, _i)=> {
                let x = bPs[_dest].x; let y = bPs[_dest].y;

                let oC = _i===path.length-1 ? vars.animate.counterFadeOut: null;
                let dur = 125;
                scene.tweens.add({
                    targets: _cObject,
                    x: x, y: y,
                    duration: dur, // maximim duration will be 7 (attack squares when starting at a8) + 4 (starting sqaures) + 1 (when reaching the start sqaure) * 125 = 1.5s
                    delay: _i*dur,
                    onComplete: oC
                })
            })
        },

        counterUpdateFrame: (_t, _o, _lastCounter)=> {
            let object = _o[0];
            let cName = object.name;
            vars.DEBUG ? console.log(`Updating counter frame for ${cName}`) : null;
            let bPos = _lastCounter[0];
            let frameName = bPos[0]==='a' ? cName.replace('counter','')[0] + bPos : bPos;
            let lastMove = _lastCounter[1];
            // UPDATE THE COUNTERS FRAME TO THE NEW POSITION
            object.setFrame(frameName);
            // set this counters position using "set data on _o"

            if (lastMove===true) {
                vars.DEBUG ? console.log(`  > The counter has reached its destination`) : null;
                let pV = vars.player;
                // WE NEED TO UPDATE THE COUNTER OBJECTS DATA
                let x = object.x; let y = object.y;
                object.setData({ boardPosition: bPos, moveFrom: '', moveTo: '', x: x, y: y });
                // IF TAKING IS NOT EMPTY, TAKE THE PIECE. WE NEED TO DO THIS BEFORE UPDATING THE BOARD FOR THE ATTACKING PLAYER
                let taking = object.getData('taking');
                if (taking!=='') { vars.game.takePiece(taking); }

                // decrease the counters depth so it moves above the other counters
                object.setDepth(object.depth-1);

                // UPDATE THE BOARD POSITIONS
                let bP = vars.boardPositions[bPos];
                bP.takenByPlayer = pV.current;
                let win = false;
                if (bPos.includes('E')) {
                    bP.counterName.push(cName);
                    vars.animate.counterToEndPosition(cName);
                    // check for win
                    win = vars.game.checkForWin(bP.counterName);
                } else {
                    bP.counterName=cName;
                }

                if (win===true) {
                    // show win message etc TODO
                    pV.win = true;
                    pV.wins[pV.current]++;
                    vars.UI.showMessage(`PLAYER ${pV.current} WINS!`, -1);
                    return false;
                }


                // NO WIN STATE FOUND

                // TEST IF THE PLAYER LANDED ON A "FREE SHOT" SQUARE
                let pCol = cName.replace('counter','')[0];
                if (bPos===`${pCol}4` || bPos===`${pCol}6` || bPos===`a4`) { // the current player gets another shot
                    if (bPos==='a4') {
                        vars.animate.showBarrier(true);
                    }
                    vars.player.nextPlayer(true);
                } else { // next players shot
                    vars.player.nextPlayer();
                }

                // disable all counters
                vars.input.countersEnable(false);
            }
        },

        diceDrop: (_targets)=> {
            vars.DEBUG ? console.log(`Dropping the dice.`) : null;
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
            vars.DEBUG ? console.log(`Adding dice drop shadows`) : null;
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
            let depth = consts.depths.shield;
            let delay = 10;
            let a = scene.add.image(1047, 251, 'shielded').setName('shield_1').setDepth(depth).setAlpha(0.3).setTint(0xff0000);
            // set the shields data
            a.setData({ h: 0, rev: false, currentDelay: delay, maxDelay: delay });

            vars.animate.shieldTween = scene.tweens.add({
                targets: a, alpha: 1,
                yoyo: true, repeat: -1,
                duration: 500,
                onUpdate: (_t, _o)=> {
                    let delay = _o.getData('currentDelay');
                    if (delay!==0) { delay--; _o.setData('currentDelay', delay); return false; }

                    // we only get here if the delay is 0
                    // so, reset that delay
                    _o.setData('currentDelay', _o.getData('maxDelay'));
                    // and update the colour of the shield
                    let rev = _o.getData('rev'); let colour = _o.getData('h');
                    rev ? colour-- : colour++ ;
                    _o.setData('h', colour);
                    let color = new Phaser.Display.Color.HSLToColor(colour/256, 1, 0.50).color;
                    _o.setTint(color);

                    // is the new colour 0 or maxCol? if so reverse the counter direction
                    let maxCol = consts.colours.shieldMaxColour;
                    if (maxCol!==255) {
                        colour===0 || colour===maxCol ? _o.setData('rev', !rev) : null;
                    } else {
                        colour===maxCol ? _o.setData('h', 0) : null;
                    }
                }
            });

            setTimeout( ()=> {
                // sometimes, if debug is on, a4 will be taken (basically used for testing), otherwise hide the shield
                if (vars.boardPositions.a4.takenByPlayer===0) {vars.animate.showBarrier(false, true); }
            }, 750)

            //let b = scene.add.image(1047, 251, 'shielded').setName('shield_2').setDepth(depth).setAlpha(1).setTint(0x008000).setVisible(false);
            /* scene.tweens.add({
                targets: b, alpha: 0.05,
                yoyo: true, repeat: -1,
                duration: 1000
            }) */
            vars.DEBUG ? console.log(`Barrier for square a4 has been initialised`) : null;
        },

        loadingImageSwitch: ()=> {
            let duration = 1000;
            if (vars.DEBUG) { duration = 0; }
            let depth = consts.depths.loading;
            // fade out the loading text
            let oldText = vars.phaserObject.quickGet('loadingText');
            scene.tweens.add({
                targets: oldText, alpha: 0,
                duration: duration,
                onComplete: vars.phaserObject.destroy
            })

            // fade out the old loading image
            let oldImage = vars.phaserObject.quickGet('loadingBG');
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
            vars.DEBUG ? console.log(`    %c... bouncing movable counter with name ${_o.name}`, 'color: yellow') : null;
            vars.animate.bouncingCounters.push(scene.tweens.add({
                targets: _o,
                y: _o.y-20,
                duration: 1000,
                yoyo: true, repeat: -1,
                ease: 'Quad'
            }))
        },

        pointsCount: (_p, _show=true)=> {
            if (_p===null) { _p=vars.phaserObject.quickGet('pointsCount'); } // when showing the points, the points text object is passed in, otherwise we have to grab it
            let alpha = _show === true ? 1 : 0;
            scene.tweens.add({
                targets: _p,
                alpha: alpha,
                diration: 500
            })
        },

        randomiseDice: (_diceArray)=> {
            if (Array.isArray(_diceArray)) { // all 4 dice have been passed (default entry point)
                vars.DEBUG ? console.log(`Randomising all dice`) : null;
                _diceArray.forEach( (dO,i)=> {
                    scene.tweens.add({
                        targets: dO, alpha: 0,
                        duration: 250, delay: i*125,
                        yoyo: true, onYoyo: vars.game.diceUpdate,
                        onComplete: vars.game.diceUpdate
                    })
                })
            } else { // single die has been passed
                console.log(` > Looping for die ${_diceArray.name.replace('dice','')}`);
                scene.tweens.add({
                    targets: _diceArray, alpha: 0,
                    duration: 250,
                    yoyo: true, onYoyo: vars.game.diceUpdate,
                    onComplete: vars.game.diceUpdate
                })
            }
        },

        showBarrier: (_show=true, _init=false)=> { // this deals with showing and hiding the barrier
            // when a players counter lands on "a4" a barrier shows. when they move away from it the barrier hides
            vars.DEBUG ? console.log(`${_init ? '' : 'Player has landed on a4.' }${_show ? 'Showing' : 'Hiding' } barrier.`) : null;
            vars.phaserObject.quickGet('shield_1').setVisible(_show);
            _show ? vars.animate.shieldTween.resume() : vars.animate.shieldTween.pause();
            //vars.phaserObject.quickGet('shield_2').setVisible(_show);
        },

        showMessage: (_msg, _dur)=> { // variables have already been confirmed by this point
            vars.DEBUG ? console.log(`Generating pop up`) : null;
            let bg = vars.phaserObject.quickGet('popupBG');
            // set the message
            let msgText = vars.phaserObject.quickGet('popupText');
            msgText.setText(_msg).setOrigin(0.5);

            // now animate the popup
            let yoyo = true; let hold = _dur;
            let oC = null;
            if (_dur===-1) { // this pop up doesnt disappear until its clicked
                yoyo = false; hold = null; bg.setInteractive();
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
            console.log(`  > Showing starter counter for ${playerColour}`);
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
        volume: 0.1,

        init: function() {
            console.log('  ..initialising audio and vars');
            scene.sound.volume=vars.audio.volume;
        },

        playSound: function(_key) {
            vars.DEBUG ? console.log(`🎵 Playing audio with name ${_key}`) : null;
            scene.sound.play(_key);
        },

        rollDice: ()=> {
            vars.DEBUG ? console.log(`🎵 🎲 Selecing random dice roll audio`) : null;
            vars.audio.playSound(shuffle(vars.audio.dice)[0]);
        }
    },

    camera: {
        mainCam: null,

        init: function() {
            console.log('  ..initialising cameras and vars');
            vars.camera.mainCam = scene.cameras.main;
        },

        shake: function(_force=50) {
            vars.camera.mainCam.shake(_force);
        }
    },

    game: {
        startingCounter: '',

        init: ()=>{
            console.log('  ..initialising game and vars');
        },

        checkForWin: (_counterArray)=> {
            vars.DEBUG ? console.log(`Checking for win`) : null;
            if (!Array.isArray(_counterArray)) {
                console.error('🚨 Check for win requires an array to be passed to it!');
                return false;
            }
            return _counterArray.length === 6 ? true : false;
        },

        diceEnable: ()=> {
            // move the counter to the position on the board

            // re-enable the dice
            let diceArray = vars.game.getDiceObjects();
            vars.input.diceEnable(diceArray, true);
            // reset all the dice data
            console.groupCollapsed('Reseting all dice')
            diceArray.forEach( (d)=> { vars.game.resetDiceData(d); })
            console.groupEnd();
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

                        // the player rolled a 0 (lol)
                        if (validMoves==='points') {
                            // show some sort of error message and reset everything
                            console.log(`Player threw a 0. Showing pop up message`);
                            let players = vars.player.getCurrent();
                            let msg = `Player ${players[0]} threw a 0.\n\nPlayer ${players[1]}, please throw the dice.`;
                            vars.UI.showMessage(msg);
                            // reset the player variables
                            vars.player.nextPlayer('skip');
                            return false;
                        }

                        // roll was > 0 but no valid moves found
                        if (validMoves===false) {
                            let currentPlayer = vars.player.getCurrent();
                            // display message
                            let msg = `Player ${currentPlayer[0]}.\nNo valid moves found.\n\nPlayer ${currentPlayer[1]}, please roll the dice.`;
                            vars.UI.showMessage(msg);
                            vars.player.nextPlayer('skip');
                            return false;
                        }

                        // we have valid moves, enable counters
                        vars.input.countersEnable(true);
                        // bounce the counters that can move (done in gV.getValidMoves)

                    }
                }
            }
        },

        generateBackToStartPath: (_object)=> {
            let startPosition = _object.getData('boardPosition');
            let col=_object.name.replace('counter','')[0];
            let colour = col === 'w' ? 'white' : 'black';
            let endPosition = `${col}S`;
            vars.DEBUG ? console.log(`Generating path back to start position (${endPosition}) from ${startPosition}`) : null;
            let path = [...consts.playerPaths[colour]];
            path = path.reverse();

            let sI = -1; let eI = -1;
            path.forEach( (_cPos, _i)=> {
                if (_cPos===startPosition) { sI=_i; }
                if (_cPos===endPosition) { eI=_i; }
            })

            if (sI===-1 || eI===-1) {
                console.error('Unable to generate a path back to start');
                return false;
            }
            vars.DEBUG ? console.log(`  > path in array found. Positions ${sI} to ${eI}`) : null;
            return path.splice(sI+1,eI);
        },

        generateBoardPath: (_startPosition, _endPosition, path)=> {
            if (_startPosition.length!==2 || _endPosition.length!==2) {
                console.error(`Start position (${_startPosition}) or end position (${_endPosition}) is invalid`);
                return false;
            }

            console.log(`Finding path from ${_startPosition} to ${_endPosition}`);

            // get the board path for the players colour
            // each board position takes 333ms to traverse
            // as the max roll is 4 this means the total time for movement is 1.333 seconds
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
                diceObjects.push(vars.phaserObject.quickGet(`dice${dN}`));
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
            if (vars.player.counters[cPColour].atStart.length>0) {
                let counterID = vars.player.counters[cPColour].atStart.pop();
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
            board.every( (_p, _i)=> { // CHECK EVERY BOARD POSITION FOR THIS PLAYERS COUNTERS
                if (_p===ignoreFrom) { found=true; }
                if (found===true) { return false; }
                // then we can check each of the positions for a valid move
                let takenByPlayer = bPs[_p].takenByPlayer;
                let counterID = bPs[_p].counterName;
                if (takenByPlayer === currentPlayer) { // THIS IS THE CURRENT PLAYERS COUNTER. NOW CHECK TO SEE IF THE MOVE WOULD BE VALID
                    vars.DEBUG ? console.log(`  %cFound a counter at board position ${_p} for player ${currentPlayer}`, 'color: green; font-size: 12px;') : null;

                    // CHECK FOR VALID MOVE
                    // check board position += points for counter
                    let newPos = board[_i+points];
                    let ownedBy = bPs[newPos].takenByPlayer; // this can be 0 (no one) 1 (player 1/white) or 2 (player 2/black)
                    if (currentPlayer!==ownedBy) { // this position has been taken by the other player
                        let _o = vars.phaserObject.quickGet(counterID);
                        if (newPos!=='a4') { // if it isnt a4, then the piece can be taken, hence, valid move.
                            validMoves.push([_p, newPos, ownedBy]);
                            // deal with counters that reach the end of the board (as the counter names are in an array for this position) and dont hold a single counter name
                            let taking = bPs[newPos].counterName;
                            if (Array.isArray(taking)) { taking=''; }
                            _o.setData({ moveTo: newPos, moveFrom: _p, taking: taking });
                            // bounce this counter
                            vars.animate.movableCounterBounce(_o);
                        }
                        if (newPos==='a4' && ownedBy===0) { // if the new position is a4 and it isnt taken by a player
                            _o.setData({ moveTo: newPos, moveFrom: _p, taking: '' });
                            // bounce this counter
                            vars.animate.movableCounterBounce(_o);
                        }
                    } else {
                        vars.DEBUG ? console.log('    %c... its currently blocked :(', 'color: red') : null;
                    }
                }
                return true;
            })


            if (validMoves.length>0) {
                vars.DEBUG ? console.log(`😀 ${validMoves.length} valid move(s) found`) : null;
                vars.DEBUG ? console.log(validMoves) : null;
            } else {
                console.log('😕 No valid moves were found!');
                return false;
            }

            return validMoves;
        },

        resetDiceData: (_o, _newGame=false)=> {
            _o.setData({ rollNumber: 0 })
            vars.DEBUG ? console.log(`  Die with name ${_o.name} has been reset.`) : null;
            _newGame===false ? null : _o.setFrame('dice1');
        },

        rollDice: ()=> {
            vars.DEBUG ? console.log(`Roll Dice called.`) : null;
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
        },

        takePiece: (_objectName)=> {
            console.log(`Taking ${_objectName}`);
            // we need a few variables here as we are gonna reset most of them
            let bPs = vars.boardPositions;
            
            let takenCounterObject = vars.phaserObject.quickGet(_objectName);
            if (takenCounterObject===false) {
                console.error(`Object was NOT found!`);
                return false;
            }
        
            let colour = _objectName.replace('counter','')[0];
            // clear the board position
            let bP = takenCounterObject.getData('boardPosition');
            bPs[bP].counterName = '';
            bPs[bP].takenByPlayer = vars.player.getCurrent()[0];

            // reset the data for this object
            let cStartPos = bPs[`${colour}S`];
            //let x = cStartPos.x; let y = cStartPos.y;
            // animate the counter back to its start position
            vars.animate.counterToStart(takenCounterObject);

            // now we need to push this counter name back onto the at start var
            let colourFull = colour === 'w' ? 'white' : 'black';
            vars.player.counters[colourFull].atStart.push(_objectName);
        }

    },

    input: {
        enabled: true,

        init: function() {
            console.log('  ..initialising input and vars');
            scene.input.on('gameobjectdown', function (pointer, gameObject) {
                let iV = vars.input;
                console.log(`Pointer position: x: ${~~(pointer.position.x+0.5)}, y: ${~~(pointer.position.y+0.5)}`);
                if (iV.enabled===false) {
                    console.log('Input is currently disabled.');
                    return false;
                }

                // click functions
                let oName = gameObject.name;
                vars.DEBUG ? console.log(`🎮 Input: User clicked on ${oName}`) : null;
                if (oName.includes('dice')) {
                    console.clear();
                    // roll dice
                    vars.game.rollDice();
                } else if (oName==='loadedButton') {
                    console.clear();
                    gameObject.disableInteractive();
                    // fade out the loaded screen and text
                    // then start the game
                    let bg = vars.phaserObject.quickGet('loadedBG');
                    let btn = vars.phaserObject.quickGet('loadedButton');
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
                } else if (oName = 'popupBG') {
                    // this is the pop up background
                    if (vars.player.win===true) {
                        // restart the game
                        vars.game.restart();
                    } else {
                        console.warn(`Pop up background was clicked. But the win variable is currently false.\nThis will fire when implementing new reasons to keep the background visible.`);
                    }
                } else {
                    console.log(`🎮 Game object with name "${gameObject.name}" was clicked. No handler found.`);
                }
            })

            scene.input.on('gameobjectover', function (pointer, gameObject) {
                // over functions
            });

            scene.input.on('gameobjectout', function (pointer, gameObject) {
                // out functions
            });
        },

        countersEnable: (_enable=true)=> {
            let oldI = -1;
            let swap;
            let only = vars.player.current === 1 ? 'whiteCounters' : 'blackCounters';
            let doingText = _enable===true ? 'Enabling ' : 'Disabling ';
            ['blackCounters','whiteCounters'].forEach( (_cC, i)=> {
                swap = false;
                if (oldI!==i) { oldI=i; console.groupCollapsed(doingText + _cC); swap=true; }
                scene.groups[_cC].children.each( (_c)=> {
                    if (_enable===false) { // we are disabling the counters. Clear their data
                        _c.setData({ moveTo: '', moveFrom: '' })
                        _c.disableInteractive();
                    } else {
                        _cC === only ?  _c.setInteractive() : null; // only activate the current players counters
                    }
                });
                if (swap===true) { console.groupEnd(); }
            })
        },

        diceEnable: (_dice, _e=true)=> {
            if (_e===true) {
                vars.DEBUG ? console.log('👍 🎮 Enabling input on all dice.') : null;
                _dice.forEach( (_d)=> { _d.setInteractive(); })
            } else {
                vars.DEBUG ? console.log('🛑 🎮 Disabling input on all dice.') : null;
                _dice.forEach( (_d)=> { _d.disableInteractive(); })
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
            console.log('  ..initialising particles and vars');
        }
    },

    player: {
        betterLuck: true, // this changes the chances of the die to roll a one from 25% to 50% as a lot of 0's were being thrown
        current: 1,
        pointsTotal: 0, diceComplete: 0,
        win: false, // either: false, 1 or 2
        wins: {
            1: 0,
            2: 0,
        },

        counters: {
            white: { atStart: [], completed: [] },
            black: { atStart: [], completed: [] }
        },

        init: ()=> {
            console.log('  ..initialising player vars');
            let cV = vars.player.counters;
            cV.white.atStart = Phaser.Utils.Array.NumberArray(1,6,'counterw_');
            cV.black.atStart = Phaser.Utils.Array.NumberArray(1,6,'counterb_');
        },

        betterLuckFn: ()=> {
            console.log(' 🏋🎲...Better Luck Function');
            return shuffle([1,2])[0] === 1 ? 'dice1' : frameName = shuffle(Phaser.Utils.Array.NumberArray(2,4,'dice'))[0];
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

        reset: ()=> {
            let pV = vars.player;
            pV.current = 1; // this resets the player to 1. It should probably be set to the winning player TODO
            pV.pointsTotal = 0;
            pV.diceComplete = 0;
            pV.win = false;
        },

        rollCountReset: ()=> {
            vars.player.rollCount=0;
        }
    },

    UI: {
        init: ()=> {
            console.log('  ..initialising the UI');
            let dC = consts.depths;
            let boardDepth = dC.board;
            let diceDepth = dC.dice;
            let counterDepth = dC.counters;
            let msgDepth = dC.message;

            // draw the background (game board)
            scene.add.image(vars.canvas.cX, vars.canvas.cY, 'sandBG').setInteractive().setName('sandBG').setDepth(dC.sand);
            scene.add.image(vars.canvas.cX, vars.canvas.cY, 'boardBG').setInteractive().setName('gameBoard').setDepth(boardDepth);

            // draw the background for the dice area
            scene.add.image(1350, 550, 'whitePixel').setName('diceBlackBG').setTint(0x0).setAlpha(0.35).setDepth(diceDepth-2).setScale(450,450).setOrigin(0);
            scene.add.text(1500, 585, 'Player 1').setName('playerText').setFontSize(32).setFontStyle('bold').setFontFamily('Consolas').setAlign('center').setAlpha(0).setDepth(dC.dice).setShadow(4,4,'#000',1);
            scene.add.text(1400, 935, 'Please roll the dice').setName('rollText').setFontSize(32).setFontStyle('bold').setFontFamily('Consolas').setAlign('center').setAlpha(0).setDepth(dC.dice).setShadow(4,4,'#000',1).setData('old','');

            // DICE
            // draw the dice and animate them into position
            let alpha = consts.alphas.ZERO;
            let scale = 0.75;
            let diceScale = 5;

            let positions = consts.dice.positions;
            let dropShadows = []
            let dice = []
            positions.forEach( (_p, _i)=> {
                dropShadows.push(scene.add.image(_p[0], _p[1], 'dice').setFrame('diceBG').setName(`d${_i+1}_Shadow`).setScale(scale).setAlpha(alpha).setDepth(diceDepth-1));
                dice.push(scene.add.image(_p[0], _p[1], 'dice').setName(`dice${_i+1}`).setScale(diceScale).setAlpha(alpha).setInteractive().setDepth(diceDepth).setData({ points: 1, rollNumber: 0 }));
            })

            // now the counter for after the dice has been rolled
            scene.add.text(1575, 775, '4').setColor('red').setName('pointsCount').setFontSize(96).setScale(3).setFontStyle('bold').setFontFamily('Consolas').setAlign('center').setAlpha(0).setDepth(diceDepth+1).setOrigin(0.5).setShadow(2,2,'#000',3);

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
                let whiteCounter = scene.add.image(startPosWhite[0], startPosWhite[1],'counters').setFrame('wS').setDepth(counterDepth).setAlpha(0).setName(`counterw_${_c}`).setData({moveFrom: '', moveTo: '', x: startPosWhite[0], y: startPosWhite[1], boardPosition: '', taking: '' }).setInteractive();
                let blackCounter = scene.add.image(startPosBlack[0], startPosBlack[1],'counters').setFrame('bS').setDepth(counterDepth).setAlpha(0).setName(`counterb_${_c}`).setData({moveFrom: '', moveTo: '', x: startPosBlack[0], y: startPosBlack[1], boardPosition: '', taking: '' }).setInteractive();
                scene.groups.whiteCounters.add(whiteCounter);
                scene.groups.blackCounters.add(blackCounter);
            })
            // END OF COUNTERS

            // pop up bg
            scene.add.image(vars.canvas.cX, vars.canvas.cY, 'whitePixel').setName('popupBG').setTint('#000').setScale(vars.canvas.width, vars.canvas.height).setDepth(msgDepth-1).setAlpha(0);
            scene.add.text(vars.canvas.cX, vars.canvas.cY, '...').setName('popupText').setColor('#ff0').setFontSize(96).setFontStyle('bold').setFontFamily('Consolas').setAlign('center').setAlpha(0).setDepth(msgDepth).setShadow(8,8,'#000',2);

            // barrier for a4
            vars.animate.initBarrier();

            vars.UI.initLogo();

        },

        initLogo: ()=> {
            scene.textures.once('addtexture', function () {
                let logo = scene.add.image(vars.canvas.width-10, vars.canvas.height-10, 'logo').setDepth(consts.depths.debug).setOrigin(1,1).setScale(0.66).setAlpha(0);
                scene.tweens.add( {
                    targets: logo,
                    alpha: 0.12,
                    duration: consts.durations.oneMinute
                })
            }, this);
            scene.textures.addBase64('logo', 'data:image/png;base64,' + vars.logo);
        },

        playerUpdate: (_p)=> {
            // is the player var valid?
            if (_p!==1 && _p!==2) { console.error(`Invalid player number (${_p})`); return false; }
            // it is. update the UI
            let icon = _p===1 ? '🦳' : '🦱';
            console.log(`Next player is ${icon}`);
            vars.phaserObject.quickGet('playerText').setText(`Player ${_p}`)
        },

        rollTextSwitch: ()=> {
            let txtObj = vars.phaserObject.quickGet('rollText');
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
            let pT = vars.phaserObject.quickGet('playerText');
            let rT = vars.phaserObject.quickGet('rollText');

            let dur = vars.DEBUG ? 0 : 1000;

            scene.tweens.add({
                targets: [pT, rT], alpha: 1,
                duration: dur
            })
        },

        showPointsCount: ()=> {
            let points = vars.player.pointsTotal;
            let pC = vars.phaserObject.quickGet('pointsCount');
            pC.setText(points);
            vars.animate.pointsCount(pC, true);
        }
    }

}