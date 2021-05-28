var vars = {
    DEBUG: false,

    version: 0.973,

    clamp: Phaser.Math.Clamp,

    // APP
    animate: {
        popupWait: 0,
        shieldTween: false,
        hovering: null,

        bouncingCounters: [],

        init: function() {
            console.log('  .. 🌑🌒🌓🌕🌗🌘🌑 initialising animations and vars');
             vars.animate.popupWait=0;
        },

        changeFace: ()=> {
            let player = vars.player.current;
            let pOb = vars.phaserObject.quickGet('playerFace');
            //pOb.setTexture('playerFacesF','playerFaces2F')
            let textureName = vars.player[`p${vars.player.current}Face`][0]==='f' ? 'playerFacesF': 'playerFaces';
            let frameName = `player${player}Face`;
            scene.tweens.add({ targets: pOb, alpha: 0, yoyo: true, onYoyo: (_t, _o)=> { _o.setTexture(textureName, frameName); }, duration: 500 })
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
            let colName = col === 'w' ? 'white' : 'black';
            let xOffset = col === 'b' ? -20: 0;

            // set the counters depth based on the amount of counters at end position
            let completed = vars.player.counters[colName].completed.length;
            // update the completed var
            vars.player.counters[colName].completed.push(_oName);

            // figure out the counters final depth after move
            let depth = consts.depths.countersComplete + completed;
            depth += col === 'b' ? 10 : 0; // move the black counters above the board (white depths = 2-8, black depths = 12-18)
            ctr.setData({ finalDepth: depth });

            // figure out the drop amount (y position) in px
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
            _object.setDepth(_object.depth+2);
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
                    onStart: ()=> {
                        vars.audio.playSound(shuffle(vars.audio.countersMove)[0]);
                    },
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
            let totalWait = 0;
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
                totalWait = _i*dur;
            })
            vars.animate.popupWait = totalWait;
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

                // decrease the counters depth so it moves back to its original depth
                object.setDepth(object.depth-2);

                // UPDATE THE BOARD POSITIONS
                let bP = vars.boardPositions[bPos];
                bP.takenByPlayer = pV.current;
                let win = false;
                if (bPos.includes('E')) {
                    bP.counterName.push(cName);
                    bP.takenByPlayer=0; // the end sqaure can hold multiple counters
                    vars.animate.counterToEndPosition(cName);
                    // check for win
                    win = vars.game.checkForWin(bP.counterName);
                } else {
                    bP.counterName=cName;
                }

                if (win===true) {
                    // show win message etc
                    pV.win = true;
                    let winner = pV.current;
                    pV.wins[winner]++;
                    vars.UI.showMessage(`PLAYER ${winner} WINS!`, -1, true);
                    vars.animate.faceToCentre();
                    vars.audio.playerWinLose(winner);
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
                    onComplete: ()=> { vars.audio.playSound('sandHit'); vars.particles.available.sand.emitParticleAt(_t.x, _t.y); }//vars.camera.shake(50);
                })
            })

            setTimeout( ()=> {
                // when all four dice have falled, update the UI
                vars.UI.showPlayerText();
            }, dur*4)

            _targets.forEach( (_t,i)=>{
                // fade it in
                scene.tweens.add({ targets: _t, alpha: 1, duration: dur/2, delay: dur*i })
            })
        },

        diceDropShadows: (_targets)=> {
            vars.DEBUG ? console.log(`Adding dice drop shadows`) : null;
            let dur = 1000;
            if (vars.DEBUG) { dur=0; }
            _targets.forEach( (_t,i)=> {
                scene.tweens.add({ targets: _t, alpha: 1, duration: dur, delay: dur*i })
            })
        },

        faceToCentre: ()=> {
            vars.DEBUG ? console.log('Sending player face to centre x.') : null;
            let pf = vars.phaserObject.quickGet('playerFace');
            scene.tweens.add({ targets: pf, x: vars.canvas.cX, duration: 2000, ease: 'Quad' })
        },

        faceToStartPosition: ()=> {
            let pfPos = consts.positions.playerFace;
            let pf = vars.phaserObject.quickGet('playerFace');
            scene.tweens.add({
                targets: pf,
                x: pfPos[0],
                duration: 2000,
                ease: 'Quad'
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

        loadingBarProgressUpdate: (_fileData)=> {
            if (vars.files.loaded>=1) {
                vars.DEBUG ? console.warn(`All files have already loaded.\nAnd this isnt a stream... this may be a problem for the progress bar`) : null;
                console.log(_fileData);
                return false;
            }

            let fSName = _fileData.src.replace(/assets(\/\w+){1,2}\//,'');
            let fFV = vars.files.fileSizes;
            let fS = fFV.files;
            let before = fFV.details.loadedSize;
            let tot = fFV.details.totalSize;
            if (fS[fSName]!==undefined) {
                let bar = vars.graphics.progress.bar;
                // add this amount to the loaded size variable
                fFV.details.loadedSize+=fS[fSName];
                // convert it to a percentage
                let loadedPercent = Phaser.Math.Clamp(~~(fFV.details.loadedSize/tot*100)/100, 0.01, 1);
                vars.files.loaded = loadedPercent;
                let kb = true;
                let logText = kb ? `${~~(loadedPercent*100).toLocaleString()}% - Loaded ${fSName}. (Adding: ${(fS[fSName]/1000).toLocaleString()}KB to ${(before/1000).toLocaleString()}KB = ${(fFV.details.loadedSize/1000).toLocaleString()}KB of ${(tot/1000).toLocaleString()}KB)` : `${~~(loadedPercent*100)}% - Loaded ${fSName}. (Adding: ${(fS[fSName]).toLocaleString()} to ${before.toLocaleString()} = ${fFV.details.loadedSize.toLocaleString()} of ${tot.toLocaleString()})`;
                // console loading bar
                let led = '🞕'; let ling ='🞔';
                loadingBarVar = vars.clamp(loadedPercent,0.1,1)*10;
                let lText='';
                for (let lB=1; lB<11; lB++) {
                    lText += loadingBarVar < lB ? ling : led;
                }
                vars.DEBUG ? console.log(`${lText} ${logText}`) : null;
                // set the file to loaded
                fS[fSName] = 'Loaded';
                // refresh the loading bar graphic
                bar.object.clear();
                let grays = consts.colours.hex.grays;
                bar.object.fillStyle(grays[grays.length-1], 1);
                bar.object.fillRect(vars.canvas.cX-bar.width/2, vars.canvas.height*0.85+10, bar.width * loadedPercent, bar.height);

                if (scene.load.progress===1) {
                    console.log(`Finished loading files.`);
                    if (loadedPercent!==1) {
                        console.warn(` - All files loaded but the file list still has unloaded assets in it.`);
                        console.table(vars.files.fileSizes.files);
                    }
                }

                if (loadedPercent===1) {
                    // hide the progress bar
                    vars.DEBUG ? console.log(`🙈 🝙 Hiding the progress bar`) : null;
                    let box = vars.graphics.progress.box.object;
                    scene.tweens.add({
                        targets: [bar.object, box],
                        alpha: 0,
                        delay: 500, duration: 500
                    })
                }
            } else {
                if (vars.DEBUG !== true) { return false; } // DEBUG var is undefined for non devs
                console.warn(`${fSName}, but it was NOT found in the file list...`);
                console.warn(_fileData);
            }
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

        showMessage: (_msg, _dur, _showFace=false)=> { // variables have already been confirmed by this point
            let delay = vars.animate.popupWait;
            vars.animate.popupWait=0;
            vars.DEBUG ? console.log(`Generating pop up`) : null;
            let bg = vars.phaserObject.quickGet('popupBG');
            // set the message
            let msgText = vars.phaserObject.quickGet('popupText');
            msgText.setText(_msg).setOrigin(0.5);

            // now animate the popup
            let yoyo = true; let hold = _dur;
            if (_dur===-1) { // this pop up doesnt disappear until its clicked
                yoyo = false; hold = null; bg.setInteractive();
            }
            let duration = consts.durations.popup;
            // MESSAGE TEXT
            scene.tweens.add({
                targets: msgText,
                alpha: 1,
                yoyo: yoyo, hold: hold, duration: duration*2, delay: delay,
                ease: 'Power1'
            })
            // BACKGROUND
            scene.tweens.add({
                targets: bg,
                alpha: 0.9,
                yoyo: yoyo, hold: hold, duration: duration*2, delay: delay,
                ease: 'Power1'
            })

            if (_showFace) {
                vars.animate.showPlayerFace(yoyo, hold, duration, delay);
            }
        },

        showOptions: (_show=true)=> {
            // first, set the depth of the player face
            let pF = vars.phaserObject.quickGet('playerFace');
            let d = _show ? consts.depths.optionsScreen-2 : consts.depths.message+1;
            pF.setDepth(d);

            // now fade in/out the options
            let alpha = _show ? 1: 0;
            let duration = 500;
            scene.groups.options.children.each( (_o)=> {
                let delay = 0;
                if (alpha===0) { // if were fading out the delay should be on the background
                    delay = _o.name==='opt_BG' ? duration : delay;
                } else { // if were fading in the delay should be on everything else
                    delay = _o.name==='opt_BG' ? delay : duration;
                }

                scene.tweens.add({
                    targets: _o,
                    alpha: alpha,
                    duration: duration, delay: delay
                })
            })
        },

        showPlayerFace: (_yoyo, _hold, _duration, _delay)=> {
            let qg = vars.phaserObject.quickGet;
            let cP = vars.player.current;
            let playerFace = qg(`opt_p${cP}i`);
            if (playerFace.x!==vars.canvas.cX) { // the player face is still in position for the options page
                // before showing the face we need to reposition it
                // set its depth to > message
                let depth = consts.depths.message+1;
                playerFace.setPosition(vars.canvas.cX, 0+200).setDepth(depth);
            }

            scene.tweens.add({
                targets: playerFace,
                alpha: 1,
                yoyo: _yoyo,
                duration: _duration*2,
                hold: _hold,
                delay: _delay
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
        },

        showVolumeOptions(_show=true) {
            let container = scene.containers.volumeOptions;

            let duration = 500;
            if (_show) {
                // slide it up
                scene.tweens.add({ targets: container, y: vars.canvas.height-200, duration: duration, ease: 'Quad.easeIn' })
                // alpha to 1
                scene.tweens.add({ targets: container, duration: duration/2, alpha: 1, ease: 'Quad.easeIn' })
            } else {
                scene.tweens.add({ targets: container, y: vars.canvas.height-10, duration: duration, ease: 'Quad.easeIn', onComplete: (_t,_o)=> { _o[0].setAlpha(0.7); } })
            }
        },

        vignetteShow: (_obj)=> {
            scene.tweens.add({
                targets: _obj,
                alpha: 1,
                duration : 3000
            })
        }
    },

    audio: {
        dice: [],
        countersMove: [],
        streams: [],
        streamPlaying: false,
        sentence: [],
        volume: {
            howler: 0.18,
            phaser: 0.6,

            multiplier: -1
        },

        howlerStream: null,

        init: function() {
            console.log('  .. 🔊 initialising audio and vars');
            let aV = vars.audio;
            scene.sound.volume=aV.volume.phaser;
            aV.streams = Phaser.Utils.Array.NumberArray(0,9,'busymarketplaceFIFO');
            // as howler deals with streams which are quieter than the sound effects (my bad) we need a multiplier so we can chane the volume
            aV.volume.multiplier = aV.volume.howler/aV.volume.phaser;
            console.log(`  .. 🔊 Initialising volume multiplier (set to ${~~(aV.volume.multiplier*1000)/1000}).`);

            if (vars.DEBUG) {
                // drop the volume to base (it gets annoying after a while... is this a problem? POSSIBLE TODO)
                aV.volume.phaser = 0.1;
                aV.volume.howler = aV.volume.phaser * aV.volume.multiplier;
            }
        },

        loadStream: ()=> {
            let streamName = shuffle(vars.audio.streams)[0];
            /*scene.load.audio('ambience', `audio/streams/ambience/${stream}.ogg`, { stream: true})
            scene.load.start();*/
            // PHASERS DOCUMENTATION FOR STREAMING OBJECTS IS FUKN TERRIBLE
            // SO IVE BEEN FORCED TO SET A 10S TIMEOUT TO PLAY AMBIENCE INSTEAD OF WAITING FOR ON(CANPLAY) AS IT NEVER FIRES :s

            // AND HERES HOW EASY IT IS IN HOWLER XD
            let src = `assets/audio/streams/ambience/${streamName}.ogg`;
            let volume = vars.audio.volume.howler; // the volume of these streams are really low, so I have to set the volume to 1
            vars.audio.howlerStream = new Howl({src, html5: true, preload: true, volume: volume, autoplay: true});
            vars.DEBUG ? console.log(`🎵 Playing stream with name ${streamName}`) : null;
            vars.audio.streamPlaying = true;
        },

        playSound: function(_key) {
            vars.DEBUG ? console.log(`🎵 Playing audio with name ${_key}`) : null;
            scene.sound.play(_key);
        },

        playStream: (_key)=> {
            // TODO: THIS SHOULD BE CHANGED TO ONREADY OR ONCANPLAY SO WE DONT HAVE TO WAIT SO LONG
            // ALSO, IF THE FILE FAILS TO LOAD WITHIN 10 SECONDS, IT WILL FAIL TO PLAY!
            // NOT A BUG BUT STILL NEEDS FIXING BEFORE 1.0

            // SO AFTER A LOT OF FUCKING ABOUT, IT DOESNT APPEAR YOU CAN ON(READY) A SOUND, SO THE TIMEOUT STAYS.
            // TODO: THIS MEANS THAT IM GOING TO HAVE USE HOWL OR SOMETHING INSTEAD.
            // FUCKING PHASER :S
            // WHEN PEOPLE TELL YOU PHASERS DOCUMENTATION IS GREAT, ATTEMPT TO USE A VARIABLE LIKE STREAM WHERE THERES ONLY TWO MENTIONS OF IT
            // ONE ON NOTES
            // AND THE 2ND IN EXAMPLES, WHICH ASSUMES YOU WANT TO STREAM ON CREATE. WITH NO EXPLANATION OF WHAT IT WAITS ON BEFORE INITIALISING IN ITS CREATE FUNCTION - I ASSUME WE JUST HAVE TO GUESS AS PER FUKN USUAL

            // ITS POSSIBLE I COULD MESS ABOUT WITH MY LOADER CODE. START LOADING THE STREAM BUT IGNORE IT WHEN ADDING TO THE FILESIZE COUNTER
            // BUT IM NOT TAKING THE CHANCE WHEN HOWL CAN DO IT NO PROBLEM
            
            // SIDE NOTE: IT TOOK ME ABOUT 30 SECONDS TO DOWNLOAD HOWLER AND IMPLEMENT THIS (vars.audio.loadStream)
            setTimeout( ()=> {
                vars.DEBUG ? console.log(`🎵 Playing stream with name ${_key}`) : null;
                scene.sound.add(_key).play();
            }, 10000);
        },

        playerWinLose: (_winner)=> {
            vars.audio.sentenceBuild('pwin');
        },

        rollDice: ()=> {
            vars.DEBUG ? console.log(`🎵 🎲 Selecting random dice roll audio`) : null;
            vars.audio.playSound(shuffle(vars.audio.dice)[0]);
        },

        say: ()=> {
            _sentence=vars.audio.sentence;
            // this takes an array (or 'sentence') and says each word one after the other
            if (Array.isArray(_sentence) && _sentence.length!==0) {
                let aV = vars.audio;
                let word = aV.sentence.splice(0,1)[0];
                let isWord = true;
                if (word==='pause') {
                    isWord=false;
                    vars.DEBUG ? console.log(`Word is 'pause'. Waiting 250ms`) : null;
                } else { // its a voice
                    vars.DEBUG ? console.log(`🗩 Word is ${word}. Saying it.`) : null;
                }

                if (isWord) {
                    scene.sound.add(word).on('complete', vars.audio.say).play();
                } else {
                    setTimeout( ()=> {
                        vars.audio.say();
                    }, 500)
                }
                vars.DEBUG ? console.log(`  ${_sentence.length} word(s) left to say`) : null;
            } else {
                vars.DEBUG ? console.log(`🙊 No more words left to say.`) : null;
            }
        },

        sentenceBuild: (_what)=> {
            let player = vars.player.getCurrent()
            player[0] = player[0].toString();
            player[1] = player[1].toString();
            let aV = vars.audio;
            let sentence = aV.sentence;

            // if we already have a sentence, we need to add a pause between the old one and this one.
            let sLength = sentence.length;
            if (sLength>0) {
                sentence.push('pause', 'pause');
            }
            let fail = false;
            switch (_what) {
                case 'pwin': sentence.push('player', player[0], 'pause', 'youWin', 'pause', 'player', player[1], 'pause', 'youLose', 'pause', 'gameOver'); break;
                case 'proll': sentence.push('player', player[0], 'pause', 'rollDice'); break;
                case 'rollagain': sentence.push('player', player[0], 'pause', 'rollAgain'); break;
                case 'rolled': sentence.push('youRolledA', vars.player.pointsTotal.toString()); break;
                case 'novalid': sentence.push('noValid'); break;
                default: console.warn(`Unknown sentence requested (${_what})`); fail=true; break; 
            }

            if (fail) { return false; }

            //vars.audio.sentence = sentence;
            if (vars.DEBUG) {
                console.log(`🗫 Built sentence`);
                console.log(sentence);
                console.log('Saying it...');
            }
            sLength===0 ? vars.audio.say() : null;
        },

        volumeSet: ()=> { // incoming volume will be 0 -> 1
            let aV = vars.audio;
            let vV = aV.volume;
            if (vars.audio.howlerStream!==null) {
                vars.audio.howlerStream.volume(vV.howler);
            }
            scene.sound.setVolume(vV.phaser);
            console.log(`🔊 Setting non ambience volume to ${vV.phaser}. Ambience volume is now ${vV.howler}`);
        },

        volumeChange: (_increase)=> {
            if (_increase !== false && _increase !== true) { return false; }
            let vV = vars.audio.volume;
            let mult = vV.multiplier;
            let inc = _increase ? 0.1 : -0.1;
            vV.phaser = vars.clamp(~~((vV.phaser + inc)*100)/100,0.1,1);
            vV.howler = ~~(vV.phaser * mult *100)/100;
            vV.howler = ~~(vV.howler*100)/100;

            // update the volume bar
            let volBar = scene.containers.volumeOptions.getByName('gfx_volBar');
            let maxWidth = 600;
            let thisWidth = maxWidth*vV.phaser;

            vars.audio.volumeSet();

            scene.tweens.add({
                targets: volBar,
                scaleX: thisWidth,
                duration: 200
            })
            // MAKE SURE THIS LINE WORKS!
            scene.sound.volume = vV.phaser;
        }
    },

    camera: {
        mainCam: null,

        init: function() {
            console.log('  .. 📷 initialising cameras and vars');
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

        diceEnable: (_enable=true, _newGame=false)=> {
            // re-enable the dice
            let diceArray = vars.game.getDiceObjects();
            vars.input.diceEnable(diceArray, true);
            // reset all the dice data
            console.groupCollapsed('🎲 Reseting all dice')
            diceArray.forEach( (d)=> { vars.game.resetDiceData(d, _newGame); })
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

                        if (vars.force!==undefined) { // if dice force is enabled
                            if (vars.force!==-1) {
                                console.log(`🏋🎲 %cForcing Dice Roll to ${vars.force}`, 'color: green; font-weight: bold; font-size: 14px;');
                                vars.player.pointsTotal=vars.force;
                            } else {
                                console.log(`🏋🎲 %cForce is ON but force value is not set.`,'color: red; background-color: white; font-size: 14px;');
                            }
                        }

                        // check for zero protection
                        // this stops a player throwing a zero twice in a row
                        vars.player.checkZeroProtection();

                        // show the counter
                        vars.UI.showPointsCount();

                        // VOICE
                        vars.audio.sentenceBuild('rolled');

                        // by this point, if zero protection was enabled for this player, they will at least have a roll of 1
                        let validMoves = vars.game.getValidMoves();

                        // the player rolled a 0 (lol)
                        if (validMoves==='points') {
                            // show some sort of error message and reset everything
                            console.log(`Player threw a 0. Showing pop up message`);
                            let players = vars.player.getCurrent();
                            let msg = `Player ${players[0]} threw a 0.\n\nPlayer ${players[1]}, please roll the dice.`;
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

                            // we need to add a voice here saying no move found TODO
                            vars.audio.sentenceBuild('novalid');

                            return false;
                        }

                        // we have valid moves
                        if (vars.player.current===2 && vars.player.CPU) {   // is it the computers shot?
                            vars.player.AI.getBestMove(validMoves);                   // this deals with everything
                                                                            // ( ie it: figures out best counter to move, stops the bouncing counters, moves the counter and moves on to the next player)
                            return false;                                   // so we just return false here
                        }



                        // if we get to this point valid moves were found and it isnt the CPU's shot

                        // player isnt CPU, enable counters
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
                } else {
                    vars.player.counters[cPColour].atStart.push(counterID); // fixes the disappearing counter bug
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
                    if (currentPlayer!==ownedBy || newPos[1]==='E') { // this position has been taken by the other player
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
                            validMoves.push([_p, newPos, 0]);
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

        resetBoard: ()=> {
            vars.DEBUG ? console.groupCollapsed('Resetting all board positions'): null;
            for (bP in vars.boardPositions) {
                vars.DEBUG ? console.log(bP) : null;
                let thisBP = vars.boardPositions[bP];
                vars.DEBUG ? console.log(thisBP) : null;
                thisBP.takenByPlayer=0;
                if (!bP.includes('E')) {
                    thisBP.counterName='';
                } else {
                    thisBP.counterName=[];
                }
                vars.DEBUG ? console.log(thisBP) : null;
                vars.DEBUG ? console.log('-----------------------------------------------------------------') : null;
            }
            vars.DEBUG ? console.groupEnd() : null;
        },

        resetCounters: ()=> {
            // reset the vars
            vars.player.init();

            // reset the counter objects
            let bPs = vars.boardPositions;
            ['blackCounters','whiteCounters'].forEach( (_cC, i)=> {
                scene.groups[_cC].children.each( (_c)=> {
                    let xy = _c.name.includes('w') ? [ bPs.wS.x, bPs.wS.y] : [ bPs.bS.x, bPs.bS.y];
                    _c.setData({ moveFrom : '', moveTo: '', boardPosition: '', x: xy[0], y: xy[1] });
                    vars.DEBUG ? console.log(_c.data.list) : null;
                })
            })
        },

        resetDiceData: (_o, _newGame=false)=> {
            _o.setData({ rollNumber: 0 })
            vars.DEBUG ? console.log(`  Die with name ${_o.name} has been reset.`) : null;
            _newGame===false ? null : _o.setFrame('dice1');
        },

        restart: ()=> {
            console.log(`Restart requested...`);
            let aV = vars.animate;
            // send the player face back to start position
            aV.faceToStartPosition();

            // reset all dice + vars
            // ive decided to disable the dice when resetting them as ill
            // be implementing a screen between the pop up and the new game
            vars.phaserObject.quickGet('pointsCount').setText('4');
            vars.game.diceEnable(false, true);

            // reset all counters + vars
            vars.game.resetCounters();

            // reset player vars
            vars.player.reset();

            // reset the board var
            vars.game.resetBoard();

            // hide the pop up
            vars.UI.showStartScreen();
        },

        rollDice: ()=> {
            vars.DEBUG ? console.log(`Roll Dice called.`) : null;
            // disable input - this needs re-written to simply disable all dice
            //vars.input.setEnabled(false);
            // change the roll text
            vars.UI.rollTextSwitch();
            // play dice roll sound
            vars.audio.playSound('diceShakeRoll');
            setTimeout(()=> { vars.audio.rollDice();}, consts.durations.diceEndRoll);

            // animate the 4 dice
            let diceArray = vars.game.getDiceObjects();
            vars.input.diceEnable(diceArray, false);
            console.groupCollapsed('🎲 Rolling the Dice')
            vars.animate.randomiseDice(diceArray);

            // highlight current players pieces that can move
            // this is done in after all dice have been randomised 4 times. Its handled in game.diceUpdate
        },

        start: ()=> {
            console.log('%c*********************\n*** Starting Game ***\n*********************', 'font-size: 16px; background-color: #004400; font-weight: bold;');
            // hide all the options stuff
            vars.animate.showOptions(false);
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
            //let cStartPos = bPs[`${colour}S`];
            //let x = cStartPos.x; let y = cStartPos.y;
            // animate the counter back to its start position
            vars.animate.counterToStart(takenCounterObject);

            // now we need to push this counter name back onto the at start var
            let colourFull = colour === 'w' ? 'white' : 'black';
            vars.player.counters[colourFull].atStart.push(_objectName);
        }

    },

    graphics: {
        highlighted: null,

        progress: {
            bar: {
                object: null,
                width: 620,
                height: 30
            },
            box: {
                object: null,
                width: 640,
                height: 50
            }
        },

        glowObject: ()=> {
            scene.plugins.get('rexGlowFilterPipeline').add(gameObject, { intensity: 1 });
        },

        grayScaleObject: ()=> {
            scene.plugins.get('rexgrayscalepipelineplugin').add(gameObject, { intensity: 1 });
        },

        highlightObject: (_oName)=> {
            // grab it
            let gameObject = vars.phaserObject.quickGet(_oName);
            // highlight it
            scene.plugins.get('rexoutlinepipelineplugin').add(gameObject).setOutlineColor(0x000080).setThickness(6)
            // remember it
            vars.graphics.highlighted = _oName;
        },

        highlightedObjectReset: (_oName)=> {
            let highlighted = vars.graphics.highlighted;
            // check that this is the object that was highlighted
            if (highlighted===_oName) {
                vars.graphics.highlighted = null;
                let gameObject = vars.phaserObject.quickGet(highlighted)
                scene.plugins.get('rexoutlinepipelineplugin').remove(gameObject);
            } else {
                console.error(`Highlighted object sent to updater (${_oName}) is not the same as the h var (${highlighted})`);
                debugger;
            }
        },

        particleBounds: ()=>{
            vars.particles.bounds = new Phaser.Geom.Rectangle(0, 0, 1920, 1080-10);
        }

    },

    input: {
        enabled: true,
        clickedOn: null,

        init: function() {
            vars.DEBUG ? console.log('  .. 🎮 initialising input and vars') : null;
            vars.DEBUG ? vars.input.enableCombos() : null;
            scene.input.on('gameobjectdown', function (pointer, gameObject) {
                let iV = vars.input;
                if (iV.enabled===false) {
                    console.log('Input is currently disabled.');
                    return false;
                }

                vars.input.clicked(gameObject);
            })

            scene.input.on('gameobjectover', function (pointer, gameObject) {
                // over functions
                let oName = gameObject.name;
                if (oName==='') { 
                    // we also have to empty out the new debug vars
                    if (vars.DEBUG) {
                        let qg = vars.phaserObject.quickGet;
                        quickGet('overDebugText').setText('Over: N/A');
                        quickGet('overDataDebugText').setText('Data: N/A');
                    }
                    return false;
                }
                // DEBUG STUFF
                if (vars.DEBUG) {
                    quickGet('overDebugText').setText(`Over: ${oName}`);
                    let msg = '';
                    if (gameObject.data!==null) {
                        let textArray = [];
                        let list = gameObject.data.list;
                        for (let a in list) {
                            textArray.push(`\n${a}: ${list[a]==='' ? 'EMPTY' : list[a]}`);
                        }
                        msg = `DATA:\n${textArray}`;
                    } else {
                        msg = 'DATA: N/A'
                    }
                    quickGet('overDataDebugText').setText(msg);
                }

                if (oName.includes('opt')) {
                    if (oName.includes('Arrow')) {
                        if (!gameObject.getData('over')) {
                            vars.DEBUG? console.log(`Moved over a button (${oName}) - attaching tween`) : null;
                            gameObject.setData('over',true);
                            vars.animate.hovering = scene.tweens.add({ targets: gameObject, scale: 1.1, duration: 250, yoyo: true, repeat: -1 })
                        }
                    }
                }

                if (oName === 'loadedButton') {
                    vars.graphics.highlightObject(oName);
                }

                if (oName ==='volOptBG') {
                    if (scene.containers.volumeOptions!==undefined) {
                        if (scene.containers.volumeOptions.y===vars.canvas.height-10) {
                            vars.animate.showVolumeOptions(true);
                        }
                    }
                }
            });

            scene.input.on('gameobjectout', function (pointer, gameObject) {
                if (gameObject.name==='gameBoard') { return false; }
                let oName = gameObject.name;
                if (oName==='') { return false; }

                // VOLUME BAR -> EXIT
                if (gameObject.name === 'volOptBG') {
                    if (scene.containers.volumeOptions!==undefined  && pointer.y<880) {
                        if (scene.containers.volumeOptions.y===880) {
                            vars.animate.showVolumeOptions(false);
                        }
                    }
                }

                if (oName === 'loadedButton') {
                    vars.graphics.highlightedObjectReset(oName);
                }

                if (vars.animate.hovering===null) { return false; }

                console.log(`Moved away from a button (${oName}) - destroying its tween`);
                if (oName.includes('opt')) {
                    vars.animate.hovering.targets[0].setData('over', false).setScale(1);
                    vars.animate.hovering.stop();
                    vars.animate.hovering=null;
                }
                return false;
            });
        },

        clicked: (gameObject)=> {
            // click functions
            let oName = gameObject.name;
            vars.DEBUG ? console.log(`🎮 Input: User clicked on ${oName}`) : null;
            if (oName.includes('dice')) {
                console.clear();
                // roll dice
                vars.game.rollDice();
            } else if (oName==='loadedButton') {
                console.clear();
                setTimeout( ()=> {
                    vars.input.clickedOn=null;
                },100)
                gameObject.disableInteractive();
                // fade out the loaded screen and text
                // then start the game
                let bg = vars.phaserObject.quickGet('loadedBG');
                let btn = vars.phaserObject.quickGet('loadedButton');
                500;
                let dur = vars.DEBUG ? 0 : 500;
                scene.tweens.add({ targets: [bg,btn], alpha: 0, duration: dur, onComplete: vars.phaserObject.destroy })

                // make the loaded button explode into sand
                vars.input.clickedOn = 'loadedButton';
                vars.particles.available.sandExplosion.emitParticle();
                // play menu ok sound - changed to sand hit to match particles
                vars.audio.playSound('sandHit'); //menuOK

                setTimeout( ()=> {
                    vars.init(3);
                }, dur*(4/5))

                // load an ambience stream
                vars.audio.loadStream();

            } else if (oName.includes('counter')) {
                vars.animate.counterToNewPosition(gameObject);
            } else if (oName === 'popupBG') {
                // this is the pop up background
                if (vars.player.win===true) {
                    // restart the game
                    vars.game.restart();
                } else {
                    console.warn(`Pop up background was clicked. But the win variable is currently false.\nThis will fire when implementing new reasons to keep the background visible.`);
                }
            } else if (oName.includes('Arrow')) {
                vars.audio.playSound('menuClick');
                vars.UI.changePlayerFace(gameObject);
            } else if (oName === 'optPlay') {
                gameObject.disableInteractive();
                // sand explosion
                vars.input.clickedOn='optPlay';
                vars.particles.available.sandExplosion.emitters.list[0].setQuantity(512).setScale(0.2).setLifespan(2000);
                vars.particles.available.sandExplosion.emitParticle();
                // play menu ok sound
                vars.audio.playSound('menuOK');

                vars.init(4);
                vars.game.start();
            } else if (oName.includes('volume')) {
                switch (oName) {
                    case 'volumeDown': vars.audio.volumeChange(false); break;
                    case 'volumeUp': vars.audio.volumeChange(true); break;
                }
            } else if(oName==='volOptBG') {
                vars.UI.showVolumeOptions();
            } else {
                console.log(`🎮 Game object with name "${gameObject.name}" was clicked. No handler found.`);
            }
        },

        countersEnable: (_enable=true)=> {
            let oldI = -1;
            let swap;
            let only = vars.player.current === 1 ? 'whiteCounters' : 'blackCounters'; // only needed when enabling counters
            let doingText = _enable===true ? 'Enabling ' : 'Disabling ';
            ['blackCounters','whiteCounters'].forEach( (_cC, i)=> {
                swap = false;
                if (oldI!==i) { oldI=i; console.groupCollapsed(doingText + _cC); swap=true; }
                scene.groups[_cC].children.each( (_c)=> {
                    if (_enable===false) { // we are disabling the counters. Clear their data
                        _c.setData({ moveTo: '', moveFrom: '', taking: '' })
                        _c.disableInteractive();
                    } else {
                        if (_cC === only) {
                            _c.setInteractive(); // enable the counter
                            _c.input.hitArea.setSize(_c.width, _c.height); // we also need to update the hit area as is isnt updated automatically (coz Phaser)
                        } 
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

        enableCombos: ()=> {
            let sIK = scene.input.keyboard;

            // dice force
            sIK.createCombo('force4',   { resetOnMatch: true });
            sIK.createCombo('force3',   { resetOnMatch: true });
            sIK.createCombo('force2',   { resetOnMatch: true });
            sIK.createCombo('force1',   { resetOnMatch: true });
            sIK.createCombo('force0',   { resetOnMatch: true });
            sIK.createCombo('forceOff', { resetOnMatch: true });

            // player force
            sIK.createCombo('p1', { resetOnMatch: true });
            sIK.createCombo('p2', { resetOnMatch: true });

            sIK.on('keycombomatch', function (event) {
                let comboName = '';
                event.keyCodes.forEach( (cC)=> {
                    comboName += String.fromCharCode(cC);
                })
                if (comboName.includes('FORCE')) {
                    let force = comboName.replace('FORCE', '');
                    vars.force = force === 'OFF' ?  -1 : ~~(force);
                    console.log(`Force has been set to ${force}`);
                    quickGet('dbgTextForce').setText(`Force: ${force}`);
                } else if (comboName==='P1' || comboName==='P2') {
                    vars.player.current = ~~(comboName[1]);
                    quickGet('playerText').setText(`Player ${vars.player.current}`)
                }
            })
        },

        setEnabled: (_opt=true)=> {
            /* vars.input.enabled=!_opt;
            console.log(`Input has been set to ${!_opt.toString()}`); */
        }

    },

    particles: {

        available: { sand: null },

        init: function() {
            // particles are stored here
            console.log('  .. 🎆 initialising particles and vars');

            // sand hit
            vars.particles.diceGroundHitInit();

            // sand explosion for the loaded image
            vars.particles.sandExplosionInit();

            /* scene.input.on('pointerdown', function (pointer) {
                vars.particles.available.sand.emitParticleAt(pointer.x, pointer.y);
            }); */
        },

        diceGroundHitInit: ()=> {
            let depth = consts.depths.diceBG+1;
            vars.particles.available.sand = scene.add.particles('sandParticleImage').setDepth(depth);
            vars.particles.available.sand.createEmitter({
                angle: { start: 0, end: 360, steps: 128 },
                alpha: 0.8,
                lifespan: 1000,
                tint: 0x745003,
                speed: { min: 100, max: 550 },
                quantity: 512,
                scale: { start: 0.5, end: 0 },
                on: false
            });
        },

        sandExplosionInit: (_src=logoSource)=> {
            let depth = consts.depths.loading+1;
            vars.particles.available.sandExplosion = scene.add.particles('sandParticleImage').setDepth(depth);
            vars.graphics.particleBounds();
            let vs = {
                fall: {
                    lifespan: 3000, gravityX: 0, gravityY: 1000, bounceMin: 0.3, bounceMax: 0.5, quantity: 1024, angleMin: 0, angleMax: 360, steps: 128
                },
                wind: {
                    lifespan: 2000, gravityX: 300, gravityY: 0, bounceMin: 0, bounceMax: 0, quantity: 512, angleMin: 0, angleMax: 0, steps: 0
                }
            }
            let thisV = vs.fall;
            vars.particles.available.sandExplosion.createEmitter({
                x: 0, y: 0,
                scale: 0.3,
                speed: { min: 100, max: 300 },
                tint: 0xEEB300,
                lifespan: thisV.lifespan,
                gravityX: thisV.gravityX,
                gravityY: thisV.gravityY,
                angle: { start: thisV.angleMin, end: thisV.angleMax, steps: thisV.steps },
                alpha: { start: 1, end: 0 }, blendMode: 'ADD',
                quantity: thisV.quantity,
                bounce: { min: thisV.bounceMin, max: thisV.bounceMax },
                bounds: vars.particles.bounds,
                emitZone: { type: 'random', source: _src },
                on: false
            });
        },

        sandExplosionRun: (_oName=null)=> {
            if (_oName===null) { return false; }
            else {
                let qg = vars.phaserObject.quickGet;
                let obj = qg(_oName);
                if (obj!==undefined) {

                } else {
                    console.error(`Object with name ${_oName} was not found!`);
                }
            }
        }
    },

    player: {
        betterLuck: true, // this changes the chances of the die to roll a one from 25% to 50% as a lot of 0's were being thrown
        current: 1,
        CPU: false,
        p1Face: 'male',
        p2Face: 'female',
        zeroProtected: { player1: false, player2: false },
        pointsTotal: 0, diceComplete: 0,
        win: false, // either: false, 1 or 2
        wins: { 1: 0, 2: 0, },

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

        checkZeroProtection: (_player=vars.player.current)=> {
            // the last dice has been rolled and the total was 0
            // if the player rolled a 0 on their previous shot as well
            // we force a 1
            // when we enter this function, the last dice has been rolled, so the 0 IS the players actual roll at this point
            let pV = vars.player;
            let pName = `player${_player}`;

            if (pV.pointsTotal!==0) { // the the points total > 0
                console.log(`Player didnt throw a zero. Resetting 0 protection and returning false`);
                pV.zeroProtected[pName]=false; // reset the zero protection
                return false;
            }

            // is the current player zero protected?
            if (pV.zeroProtected[pName]) {
                console.log(`🏋🎲 Player ${pV.current} is Zero Protected. Forcing a 1 and removing zero protection.`);
                // force a 1
                pV.pointsTotal=1;
                vars.phaserObject.quickGet('dice4').setFrame('dice1');
                pV.zeroProtected[pName]=false;
            } else {
                // player is NOT protected, so they should be protected for their next throw
                console.log(`😇🍀 %cPlayer ${pV.current} wasnt zero protected. They are now.%c 🍀😇`, 'font-weight: bold; color: #008800; background-color: gold; font-size: 16px','');
                pV.zeroProtected[pName] = true;
            }
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
                if (_anotherShot!=='skip') { msg = `Roll the dice`; }
                vars.UI.playerUpdate(pV.current);
                vars.audio.sentenceBuild('proll');

                // change the player face
                vars.animate.changeFace();
            } else {
                msg = `You landed on a free shot\n\nRoll the dice`;
                vars.audio.sentenceBuild('rollagain');
            }

            if (_anotherShot!=='skip') { // show pop up message if applicable
                vars.UI.showMessage(msg, 1000, true);
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
        /*
        ◄████████████████████████►
        ◄███► START OF INITS ◄███►
        ◄████████████████████████►
        */
        init: ()=> {
            console.log('  ..initialising the UI');

            vars.UI.initLogo();
            vars.UI.initOptionsScreen();

            // the volume options are built in stage 2 from inside vars.containers
        },

        initErrorScreen: ()=> {
            let g = scene.groups.errorScreen;
            let depth = consts.depths.error;
            let eBG   = scene.add.image(vars.canvas.cX, vars.canvas.cY, 'whitePixel').setScale(vars.canvas.width, vars.canvas.height).setTint(0x800000).setName('errorBG').setDepth(depth-1).setAlpha(0);
            let title = scene.add.text(vars.canvas.cX, 150, 'Fatal Error', { fontSize: '36px', fontStyle: 'bold', stroke: '#000', strokeThickness: 5 }).setDepth(consts.depths.error).setOrigin(0.5).setName('errorTextTitle').setAlpha(0);
            let msg   = scene.add.text(vars.canvas.cX, vars.canvas.cY, 'Error message will be in here.', { fontSize: '28px', stroke: '#000', strokeThickness: 5 }).setDepth(consts.depths.error).setOrigin(0.5).setName('errorTextMessage').setAlpha(0);
            g.addMultiple([eBG,title,msg]);
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
            scene.textures.addBase64('logo', 'data:image/png;base64,' + vars.game.logo);
        },

        initGameScreen: ()=> {
            let dC = consts.depths;
            let boardDepth = dC.board;
            let diceBGDepth = dC.diceBG;
            let diceDepth = dC.dice;
            let counterDepth = dC.counters;
            let msgDepth = dC.message;

            // draw the background (game board)
            scene.add.image(vars.canvas.cX, vars.canvas.cY, 'sandBG').setInteractive().setName('sandBG').setDepth(dC.sand);
            scene.add.image(vars.canvas.cX, vars.canvas.cY, 'boardBG').setInteractive().setName('gameBoard').setDepth(boardDepth);

            // add game PLAYER FACES
            let pfPos = consts.positions.playerFace;
            let pFace = scene.add.image(pfPos[0], pfPos[1], 'playerFaces', 'player1Face').setName('playerFace').setOrigin(0).setDepth(consts.depths.optionsScreen-2); // this depth changes when the game starts
            scene.tweens.add({ targets: pFace, y: pFace.y-25, yoyo: true, repeat: -1, duration: 500, ease: 'Quad' })

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
                dropShadows.push(scene.add.image(_p[0], _p[1], 'dice').setFrame('diceBG').setName(`d${_i+1}_Shadow`).setScale(scale).setAlpha(alpha).setDepth(diceBGDepth));
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
                let whiteCounter = scene.add.sprite(startPosWhite[0], startPosWhite[1],'counters').setFrame('wS').setDepth(counterDepth).setAlpha(0).setName(`counterw_${_c}`).setData({moveFrom: '', moveTo: '', x: startPosWhite[0], y: startPosWhite[1], boardPosition: '', taking: '' }).setInteractive();
                let blackCounter = scene.add.sprite(startPosBlack[0], startPosBlack[1],'counters').setFrame('bS').setDepth(counterDepth).setAlpha(0).setName(`counterb_${_c}`).setData({moveFrom: '', moveTo: '', x: startPosBlack[0], y: startPosBlack[1], boardPosition: '', taking: '' }).setInteractive();
                scene.groups.whiteCounters.add(whiteCounter);
                scene.groups.blackCounters.add(blackCounter);
            })
            // END OF COUNTERS

            // pop up bg
            scene.add.image(vars.canvas.cX, vars.canvas.cY, 'whitePixel').setName('popupBG').setTint('#000').setScale(vars.canvas.width, vars.canvas.height).setDepth(msgDepth-1).setAlpha(0);
            scene.add.text(vars.canvas.cX, vars.canvas.cY, '...').setName('popupText').setColor('#ff0').setFontSize(96).setFontStyle('bold').setFontFamily('Consolas').setAlign('center').setAlpha(0).setDepth(msgDepth).setShadow(8,8,'#000',2);

            // barrier for a4
            vars.animate.initBarrier();
        },

        initOptionsScreen: ()=> {
            let depth = consts.depths.optionsScreen;
            scene.groups.options = scene.add.group();
            let cV = vars.canvas;
            let offsetX = 350;
            let p1x = cV.cX - offsetX;
            let p2x = cV.cX + offsetX;
            let tY = 0 + 550;
            let pY = 0 + 300;

            let bg = scene.add.image(cV.cX, cV.cY, 'whitePixel').setName('opt_BG').setTint(0x0).setDepth(depth-1).setScale(vars.canvas.width, vars.canvas.height);
            let p1Title = scene.add.image(p1x, tY, 'options').setName('opt_p1t').setFrame('optPlayer1').setDepth(depth);
            let p2Title = scene.add.image(p2x, tY, 'options').setName('opt_p2t').setFrame('optPlayer2').setDepth(depth);
            let p1Image = scene.add.image(p1x, pY, 'options').setName('opt_p1i').setFrame('faceMale').setDepth(depth);
            let p2Image = scene.add.image(p2x, pY, 'options').setName('opt_p2i').setFrame('faceFemale').setDepth(depth);
            
            let optPlay = scene.add.image(cV.cX, cV.height-200, 'options').setFrame('optPlay').setName('optPlay').setDepth(depth).setInteractive();
            let optPlayText = scene.add.image(cV.cX, cV.height-200, 'options').setFrame('optPlayText').setName('optPlayText').setDepth(depth);

            scene.groups.options.addMultiple([bg,p1Title,p2Title,p1Image,p2Image,optPlay,optPlayText]);

            // add the 4 "select player" buttons
            let y = 300;
            [p1Image,p2Image].forEach( (_p)=> {
                ['optArrowLeft','optArrowRight'].forEach( (_a)=> {
                    let x = _a.includes('Left') ? _p.x-250 : _p.x+250;
                    let arrow = scene.add.image(x, y, 'options').setFrame(_a).setName(`${_a}_${_p.name.replace('opt_','')}`).setDepth(depth).setInteractive().setData({ over: false });
                    scene.groups.options.add(arrow);
                })
            })
            
        },

        initVolumeOptions: ()=> {
            console.log(`  .. 🔈🔉🔊 initialising Volume options`);
            let container = scene.containers.volumeOptions;

            // add a background
            let bg = scene.add.image(0,0,'whitePixel').setName('volOptBG').setScale(vars.canvas.width, 200).setTint(0x0).setAlpha(0.8).setOrigin(0).setInteractive();
            // add the 3 volume buttons
            volMute = scene.add.image(100, 100, 'optionsVolume').setFrame('volumeMute').setName('volumeMute').setInteractive();
            volDown = scene.add.image(250, 100, 'optionsVolume').setFrame('volumeDown').setName('volumeDown').setInteractive();
            volUp = scene.add.image(400, 100, 'optionsVolume').setFrame('volumeUp').setName('volumeUp').setInteractive();

            let w = 620; let h = 70;
            let x = 550; let y = 100;
            volbarBG = scene.add.image(x, y, 'whitePixel').setTint(0x0000B2).setName('gfx_volBarBG').setScale(w,h).setOrigin(0,0.5);

            w = 600; h = 50;
            w*=vars.audio.volume.phaser;
            volbar = scene.add.image(x+10, y, 'whitePixel').setTint(0x31D2F7).setName('gfx_volBar').setScale(w,h).setOrigin(0,0.5);

            // add everything to the container
            container.add([bg,volMute,volDown,volUp,volbarBG, volbar]);
            setTimeout( ()=> { vars.UI.showVolumeOptions(false); }, 1000)

        },
        /*
        ◄████████████████████████►
        ◄███►  END OF INITS  ◄███►
        ◄████████████████████████►
        */




        changePlayerFace: (_object)=> { // the object entering here is the arrow
            let player = _object.name.includes('p1') ? 1 : 2;
            let direction = _object.name.includes('Left') ? 'l' : 'r';
            let imageArray = ['faceFemale','faceMale','faceCPU'];
            let pImage = vars.phaserObject.quickGet(`opt_p${player}i`);
            let currentFrameName = pImage.frame.name;
            vars.DEBUG ? console.log(`${direction==='l' ? 'Left' : 'Right' } arrow was clicked for player ${player}`) : null;

            let aPos = -1;
            imageArray.forEach( (_iN, _i)=> {
                if (aPos===-1) {
                    if (_iN===currentFrameName) { aPos = _i; }
                }
            })

            let frameName = null;
            if (aPos!==-1) {
                if (direction==='r') {
                    if (aPos === imageArray.length-1) { aPos=0; } else { aPos+=1; }
                    if (player===1 & aPos===imageArray.length-1) { aPos=0; }
                } else {
                    if (aPos === 0) { aPos=imageArray.length-1; } else { aPos-=1; }
                    if (player===1 & aPos===imageArray.length-1) { aPos=1; }
                }
            } else {
                console.log(`Array position is invalid!`);
                return false;
            }
            frameName = imageArray[aPos];

            if (player===1) {
                vars.player.p1Face = frameName.includes('Male') ? 'male' : 'female';
            } else if (player===2) {
                switch (frameName) {
                    case 'faceFemale': vars.player.p2Face='female'; vars.player.CPU=false; break;
                    case 'faceMale':   vars.player.p2Face='male';   vars.player.CPU=false; break;
                    case 'faceCPU':    vars.player.p2Face='female'; vars.player.CPU=true;  break;
                    // faceCPU needs updating as we currently dont have a 2 tone version of the CPU yet. TODO
                }
            }

            if (vars.DEBUG) {
                vars.phaserObject.quickGet('playerDebugText').setText(`Player 1: ${vars.player.p1Face}\nPlayer 2: ${vars.player.p2Face} (CPU: ${vars.player.CPU.toString()})`);
            }

            pImage.setFrame(frameName);
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

        showErrorScreen: (_msg='')=> {
            if (_msg.length===0) { _msg = 'ERROR:\n\nNo error message was passed.'; }
            let g = scene.groups.errorScreen;
            g.children.each( (_o)=> {
                if (_o.name==='errorTextMessage') { _o.setText(_msg).setOrigin(0.5); }
                _o.setAlpha(1);
            })
        },

        showMessage: (_message, _duration=2000, _showPlayer=false)=>{
            if (_message.length===0) {
                console.error('The message length was 0!')
                return false;
            }

            vars.animate.showMessage(_message, _duration, _showPlayer);
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
        },

        showStartScreen: ()=> {
            
        },

        showVolumeOptions: (_show=true)=> {
            if (scene.containers.volumeOptions.y===vars.canvas.height-10) {
                _show = true;
            } else {
                _show = false;
            }
            vars.animate.showVolumeOptions(_show);
        }
    }

}