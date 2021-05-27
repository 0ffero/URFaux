/*

Possible Moves:

Non Taking Moves:

Fall on AT4 - Highest Priority ─────────────────────────────┐
                                                            │
Fall on a re-roll - Very High priority                      │
                                                            │
Landing on END - Medium High Priority 						│
                                                            │
Landing on starter spaces - Medium Priority 				├─────► THESE ARE TESTED FOR "THREAT" PRIORITY IF MORE THAN ONE COUNTER HAS THE SAME "MOVE" PRIORITY
                                                            │
Landing on attack square 6 to 8 - Medium Low 				│
                                                            │
First 4 ATTACK squares - Lowest Priority ───────────────────┘



Taking Moves:

Fall on a re-roll - Highest priority ───────────────────────────────┐
                                                                    │
First 4 ATTACK squares - High Priority                              │
                                                                    │
Landing on starter spaces - Medium Priority                         │
                                                                    │
Landing on attack square 6 to 8 - Medium Low (based on threat) ─────┘

*/

/*
Rules to check for:
    1) Are they moving to a free shot? 
        yes: 
            a4 ?                                                        impetus to move = 50 pts + safety bonus of 20 points (?)
            Wait... a4 is a no brainer. if its available, go ahead and take it
            b4 b6 ?                                                     50 pts (if b6, current positions threat will be taken into consideration. b4s threat is always 0)

    2) Is the piece currently in danger?
        yes:
            4 attackers: = 10 pts   (high chance of being taken.        impetus to move = 10        (low)           )
            3 attackers: = 20 pts   (high-ish chance of being taken.    impetus to move = 20        (medium)        )
            2 attackers: = 30 pts   (medium chance of being taken.      impetus to move = 30        (medium/high)   )
            1 attacker:  = 40 pts   (low chance to be taken.            impetus to move = 40        (high)          )

    3) If this counter was moved, determine threat level of new position
        3 attackers: -30 points     (highest chance of being taken.     impetus to move reduction of 30 - major threat after move)
        2     "    : -20   "        (medium chance of being taken.      impetus to move reduction of 20 - medium threat after move)
        1     "    : -10   "        (low chance of being taken.         impetus to move reduction of 10 - minor threat of being taken after move)
        0     "    : +10   "        (no chance of being taken if moved. impetus to move             +10)

    4) Is taking on move?
        yes:         +10 points

    5) moveTo is a1-a3, a5-a8, b1-b3, b5, b6, bE
        Is moveTo = a1, a2 or a3 ?  -10 points (these positions are pretty dangerous and should only be considered in a pinch)
        Is moveTo = a5 ?            -30 points (requires a 4 or more to be safe)
        Is moveTo = a6 ?            -20 points (requires a 3 or more to be safe)
        Is moveTo = a7 or a8?       -10 points (requires a 2/1 or more to be safe)
        Is moveTo = b1-b3 ?         +10 points (safe moves, but should only be considered if no other good moves were found)
        Is moveTo = b5 or b6        +20 (+40?) points // this should really be considered over most other moves. Atm the max reduction due to 4 attackers is -40. this probably needs counteracted completely
        Is moveTo = bE ?            +10 points


*/

/*
BOARD OVERVIEW

[W4][W3][W2][W1][--][**][W6][W5]    <-- -- = WS, ** = WE
[A1][A2][A3][A4][A5][A6][A7][A8]
[B4][B3][B2][B1][--][**][B6][B5]    <-- -- = BS, ** = BE

*/


/*
FIGURE OUT THREAT LEVEL BASED ON HOW MANY COUNTERS CAN CURRENTLY TAKE A PIECE
AS WELL AS WHAT ITS THREAT LEVEL WILL DROP OR INCREASE TO BY MOVING
*/

if (vars.player.AI===undefined) {
    vars.player.AI = {};
}



vars.player.AI.blockAttacks = (playerCounters, paths, boardPositions, _moveToStr, detail)=> {
    // BUILD THE PC ATTACK AND PC BLOCK OBJECTS
    let pCAttack = {}
    let pCBlocks = {}
    let takingArray; let taking;
    // FOR EACH PLAYER COUNTER, WE TEST IF THERES A BLACK COUNTER WITHIN ITS REACH
    playerCounters.forEach( (_pC)=> {
        let pPos = _pC[1];
        let counterName = _pC[0];
        // find the position in the white path
        let found = false;
        let reachPos = -1;
        let maxPos = 11;
        let thisPath = [...paths.white].splice(1,maxPos); // positions w1 (throwing a 4) -> a7 (throwing a 1) can reach any counters on the attack lane, so they are all added here
        thisPath.forEach( (_wP,_i)=> {
            if (_wP===pPos && !found) { // search for this counters position on path. If these are equal, weve found it
                found=true; reachPos = _i;
                // this is the array of positions this player counter can move to, based on roll (ie 1,2,3 or 4)
                let a = thisPath.splice(reachPos+1,4); // thankfully splice needs no error control. Requesting more positions than ARE available will simply respond with what IS available
                //_pC.push(a);
                detail ? takingArray = [] : null;
                detail ? taking = 0 : null;
                a.forEach( (_wPos, __i)=> { // a is the path of this counter
                    if (_wPos!=='a4' && boardPositions[_wPos].takenByPlayer===2) { // with a throw of __i, white can take this position which is held by the CPU (unless current position is a4 which is untakable)
                        detail ? takingArray.push([_wPos,true,boardPositions[_wPos].counterName]) : null;
                        detail ? taking+=.25 : null;

                        // add the data for the pc attack array
                        if (!Array.isArray(pCAttack[boardPositions[_wPos].counterName])) { pCAttack[boardPositions[_wPos].counterName] = []}
                        pCAttack[boardPositions[_wPos].counterName].push(pPos);
                    } else if (_moveToStr.includes(_wPos)) { // a throw of __i is a destination for a CPU counter
                        if (!Array.isArray(pCBlocks[_wPos])) { pCBlocks[_wPos] = []}
                        pCBlocks[_wPos].push([counterName, pPos, __i]);
                    } else {
                        detail ? takingArray.push([_wPos,false,null]) : null;
                    }
                })
                detail ? _pC.push([taking, takingArray]) : null;
            }
        })
    })

    return { pCAttack: pCAttack, pCBlocks: pCBlocks }
}

vars.player.AI.checkRule = (ruleNumber, movableData, score, pCAttack=null, pCBlocks=null)=> {
    let _m = movableData;
    let cName = _m[0];
    let movingTo = _m[1];
    let taking = _m[2];
    switch (ruleNumber) {
        case 1:
            // RULE 1) Are they moving to a free shot?
            if (movingTo==='a4' || movingTo==='b6' || movingTo==='b4') { // free shot square
                _m[6]=true;
                let maxScore = 50; let bonus = 30;
                switch (movingTo) {
                    case 'a4': // untakable free shot square - highest priority - this is our move!
                        score+=maxScore+bonus;
                        _m[4].push(`Counter would be moving to a4. Points +80}`);
                        break;
                    case 'b4': case 'b6': // free shot square - medium-high priority (NOTE: b4 should only be taken when a4 isnt available)
                        score+=maxScore+(bonus/2);
                        _m[4].push(`Counter would be moving to b4 or b6 (free shot square). Points +65}`);
                        break;
                }
            }
            return [_m, score];
            break;
        case 2:
            // RULE 2) Is the piece currently in danger?
            if (pCAttack[cName]!==undefined) { // this counter can be taken
                // from how many positions? if its only takable by 1 counter its gets a higher urge to move
                let attackers = pCAttack[cName].length; // this will be 4,3,2 or 1
                let points = ((5-attackers) * 0.25) * 40;

                // maximum points will be as follows
                // 4 counters attacking this position -> 10 points
                // 3    "         "       "     "     -> 20   "
                // 2    "         "       "     "     -> 30   "
                // 1    "         "       "     "     -> 40   "
                _m[3] += points;
                _m[4].push(`Counter can be taken by ${attackers} player counter(s). Points +${points}`);
            }
            return _m;
            break;
        case 3:
            if (pCBlocks[movingTo] !== undefined) {
                let attackers = pCBlocks[movingTo].length;
                let penalty = attackers * 10;
                // deduct those points from the current total
                _m[3] -= penalty;
                _m[5].push(`If this counter moves it will be attackable by ${attackers}. Points -${penalty}`);
                let bonus = 0;
                if (movingTo==='a1'  && taking) { bonus = 30; } else if ((movingTo==='a2' || movingTo==='a3') && taking) { bonus = 20; }
                _m[3] += bonus;
            } else {
                _m[3] += 10;
                _m[4].push(`If this counter moves it will be safe from attackers. Points +10`);
            }
            return _m;
            break;
        case 4:
            // RULE 4) Is this counter taking on move?
            if (taking) { score += 10; _m[4].push(`Move would be taking a player counter. Points +10`); } // if were taking a player counter;
            return [_m, score];
            break;
        case 5:
            // RULE 5) moveTo is a1-a3, a5-a8, b1-b3, b5, b6
            if (movingTo==='a1' || movingTo==='a2' || movingTo==='a3') {
                // however, if we are taking they get an extra bonus for bravado
                score += taking ? 20 : 0;
                score-=10;
                _m[5].push(`Move is to a1, a2 or a3 (pretty dangerous board positions - however, losing a position doesnt cost a lot). Points ${score.toString()}`);
            } else if (movingTo==='a5') {
                score-=30;
                _m[5].push(`Move is to a5 (non optimal for getting to safety on next throw - 4 required!). Points -30`);
            } else if (movingTo==='a6') {
                score-=20;
                _m[5].push(`Move is to a6 (requires a 3+ to reach safety on next throw - not great). Points -20`);
            } else if (movingTo==='a7' || movingTo==='a8') {
                score-=10;
                _m[5].push(`Move is to a7 or a8 (Not recommended, but pretty safe move as a roll of only 1 or 2 is required to reach safety). Points -10`);
            } else if (movingTo==='b1' || movingTo==='b2' || movingTo==='b3') {
                score+=5;
                _m[4].push(`Move is to b1, b2 or b3 (safe, but a low priority). Points +10`);
            } else if (movingTo==='b5' || movingTo==='b6') { // extra points are given for reaching the 'safe area'
                score+=10;
                _m[4].push(`CPU would be moving to the safe area at the end of the board (${movingTo}). Points +10`);
            } else if (movingTo==='bE') {
                score+=20;
                _m[4].push(`CPU would be moving to the end square. Points +20`);
            }
            return [_m, score];
            break;
        case 6:
            // check 6 is only for taking moves on a1-a3.
            // we need to test what the defensive strength is before and after the move
            if ((movingTo==='a1' || movingTo==='a2' || movingTo==='a3') && taking) {
                debugger;
                // yeah, we need to know where this counter is coming from...
                let strengths = vars.player.AI.getStacks(movingFrom, movingTo);
            }
        default:
            console.error(`Unknown rule number (${ruleNumber}), returning false`);
            debugger;
            return false;
            break;
    }
}

vars.player.AI.determineBestMove = (_moveList)=> {
    let bestMoves = [];
    let highestImpulse = -Infinity;
    _moveList.forEach( (_m)=> {
        if (_m[3]>=highestImpulse) {
            if (_m[3]===highestImpulse) {
                bestMoves.push([_m[0], _m[4], _m[5]]);
            } else {
                bestMoves = [[_m[0], _m[4], _m[5]]];
            }
            highestImpulse = _m[3];
        }
    })
    vars.DEBUG ? console.log(`Highest impulse: ${highestImpulse}`) : null;
    vars.DEBUG ? console.table(bestMoves) : null;

    if (bestMoves.length>1) { // there were multiple "best" moves. Choose one based on positives and negatives
        console.log(`\nOK, there are still more than 1 "best" moves. Testing the good against the bad`);
        let bestMove = -Infinity;
        let averages = []
        bestMoves.forEach( (_b)=> {
            let thisAverage = _b[1].length - _b[2].length;
            if (thisAverage >= bestMove) { // this equals the best move so far
                if (thisAverage > bestMove) { // better than it (so replace whatevers there)
                    bestMove = thisAverage;
                    averages = [[bestMove, _b[0]]];
                } else { // its equal to the best move, so add it to the list
                    averages.push([bestMove, _b[0]]);
                }
            }
        })

        if (averages.length===1) { // only one "real" best move
            let counterName = averages[0][1];
            vars.DEBUG ? console.log(`  .. after testing good v bad, only 1 move is "best". Returning ${counterName}`) : null;
            return averages[0][1];
        } else { // okay... there are still multiple options, we simply randomise them and return one
            let selected = shuffle(averages)[0][1];
            vars.DEBUG ? console.log(`  .. even after testing there are still multiple "best" moves. At this point either will do.\n  .. returning ${selected}`) : null;
            return selected;
        }

    } else { // only one best move found
        vars.DEBUG ? console.log(`\n\nOnly one best move was found. Returning ${bestMoves[0][0]}`) : null;
        return bestMoves[0][0]; // returns the counter name for the best move
    }
}

vars.player.AI.getMovesCPU = (_movables)=> {
    console.clear();
    // convert the movables into something we can use
    let boardPositions = Object.assign(vars.boardPositions); // this duplicates the board positions object so we can modify it
    let movable = [];
    let countersAtStart = vars.player.counters.black.atStart;
    let cpuAtStart = countersAtStart.length; // "was" tested for, no longer needed? POSSIBLE TODO
    _movables.forEach( (_vM)=> {
        let cName = boardPositions[_vM[0]].counterName;
        if (cName!='') {
            let taking = _vM[2]===0 ? false : true;
            movable.push([cName, _vM[1], taking]); 
        } else {
            // confirm that this is the starting position for black before doing anything else
            if (_vM[0]==='bS') {
                // in general, we should already have a floating counter by this points, so grab it
                // yup, this is the start position for black. grab the next counter
                vars.player.AI.popped = vars.game.startingCounter;
                let counterName = vars.player.AI.popped; // this needs pushed back on to the pile if it isnt used! TODO coz its bathtime
                // we have to add the data to this counter in case its selected (it could be done later, but due to the way the functions plays out, the required vars will no longer be available, so another var would be needed ie pointless)
                let object = vars.phaserObject.quickGet(counterName);
                object.setData({ moveFrom: _vM[0], moveTo: _vM[1] }); // OK So Ive only just noticed that 'board position' and 'move from' will never be different. There must be a reason for this. WILL BE FIXED FOR V.09ͤ α TODO
                movable.push([ counterName, _vM[1], false ]);
            }
        }
    })

    if (!Array.isArray(movable)) {
        let msg = 'The array of movables is invalid.';
        console.log(msg);
        vars.UI.showErrorScreen(msg);
        return false;
    }

    let paths = Object.assign(consts.playerPaths);

    let roll = vars.player.pointsTotal; // now unused POSSIBLE TODO (REMOVE)
    // get the white counters
    let playerCounters = [];
    paths.white.forEach((_wP)=> {
        if (_wP!=='wS' && _wP!=='wE') {
            let playerID = boardPositions[_wP].takenByPlayer;
            let cName = boardPositions[_wP].counterName;
            if (playerID===1 && cName!=='') {
                playerCounters.push([cName, _wP]);
            }
        }
    })

    console.log('Board Positions ...')
    console.table(boardPositions);
    console.log('---------------------------------------------------');

/*
   ◄██████████████████████████████►
   ◄███► SET UP TAKING STRING ◄███►
   ◄██████████████████████████████►
*/
    // set up the taking string (used for assessing threat after moving to new position)
    let moveToStr = '';
    movable.forEach( (_m)=>{
        moveToStr += _m[1] + ',';
    })
    moveToStr = moveToStr.length > 0 ? moveToStr.substr(0, moveToStr.length-1): '';

    let detail = false;


    let response = vars.player.AI.blockAttacks(playerCounters, paths, boardPositions, moveToStr, detail);
    let pCAttack = response.pCAttack;
    let pCBlocks = response.pCBlocks;
    // empty the response variable as it isnt needed any more
    response = null;

    console.log('PC attack object (shows what counters are under attack)...')
    console.table(pCAttack); // needed when checking whether our black counter should move based on attackers
    console.log('\nPC blocks object (shows what counters would be under attack is one of the black counters moved here)...')
    console.table(pCBlocks); // needed when checking whether after moving a black counter would cause it to have attackers
    // END OF BUILD PLAYER OBJECTS



/*
   ◄█████████████████████████████►
   ◄███► CHECK RULES 2 AND 3 ◄███►
   ◄█████████████████████████████►
*/
    // TEST AGAINST THE RULES SHOWN ABOVE
    // we need to add a threat level based on how many enemy counters can take each counter (using pCAttack)
    playerCounters = detail ? console.table(playerCounters) : null; // <-- if detail is on, show it, otherwise nullify the var (the detail isnt really needed unless debuging)
    console.log('\n\nAssessing Threat Levels (rules 2 and 3)...');
    movable.forEach( (_m)=> {
        // let moveTo = _m[1]; let cTaking = _m[2];
        if (_m[3]===undefined) { _m.push(0,[],[], false); } // _m[3] = points, _m[4] = resons to move, _m[5] = reasons against moving, _m[6] is optimal move?

        // RULE 2) Is the piece currently in danger?
        let rule2 = vars.player.AI.checkRule(2, _m, null, pCAttack);
        _m = rule2;

        // RULE 3) If this counter was moved, determine threat level of new position
        // check if the moveTo is in the pc blocks
        let rule3 = vars.player.AI.checkRule(3, _m, null, null, pCBlocks);
        _m = rule3;
    })

/*
   ◄████████████████████████████████►
   ◄███► CHECK RULES 1, 4 AND 5 ◄███►
   ◄████████████████████████████████►
*/
    console.log('\n\nAssessing Rules 1, 4 & 5...');
    // as rule 1 contains the check for optimal move, we can ignore everything after finding one - note it might be better to first check which free square were moving to possible TODO
    // more info: as an example, if both b4 and a4 can be taken then a4 should probably be choosen over any other position as its on the attack lane AND is untakable
    // so, main priority is a4 as b4 could be taken on the next free throw. If we take b4, the next throw might not land the other counter on a4 (hence a4 is actually safer even though b4 is untakable as a4 is firther up the board and closer to home)
    // this means ignoring the optimal move at this point. waiting for all counters to come back with impulse and checking for multiple free shots. if theres only one, fine. if there are multiple (yes, even including b6, probably)
    // MAJOR TODO
    movable.forEach( (_m)=>{ // hence this has been changed to foreach (from .some) and the return has been removed
        let score = 0;

        // RULE 1) Are they moving to a free shot?
        let rule1 = vars.player.AI.checkRule(1, _m, score);
        _m = rule1[0]; score = rule1[1]; // *1 as the score is built in, I may just change these rules to return the score embeded in _m POSSIBLE TODO
        rule1=null;


        // RULE 4) Is this counter taking on move?
        let rule4 = vars.player.AI.checkRule(4, _m, score); // same here *1
        _m = rule4[0]; score = rule4[1];
        rule4=null;


        // RULE 5) moveTo is a1-a3, a5-a8, b1-b3, b5, b6
        let rule5 = vars.player.AI.checkRule(5, _m, score); // same here *1
        _m = rule5[0]; score = rule5[1];
        rule5=null;

        // update the score for this counter
        _m[3]+=score;
    })
    console.log(`Movable counter array looks like:`);
    console.table(movable);

    // figure out best move
    let bestMove = vars.player.AI.determineBestMove(movable);
    console.log(`Best move would be by ${bestMove}`);
    return bestMove;

}

vars.player.AI.getStacks = (_from, _to)=> {
    let blackStartPositions = [...consts.playerPaths.black].splice(1, 4)
    let whiteStartPositions = [...consts.playerPaths.white].splice(1, 4)

    let strengths =  { black: 0, white: 0 };
    let bPs = vars.boardPositions;
    whiteStartPositions.forEach( (_p, _i)=> {
        if (bPs[_p].takenByPlayer===1) {
            strengths.white+=Math.pow(2,_i);
        }
    })

    blackStartPositions.forEach( (_p, _i)=> {
        if (bPs[_p].takenByPlayer===2) {
            strengths.white+=Math.pow(2,_i);
        }
    })

    console.log(`\n\nCurrent defensive strengths:`);
    console.table(strengths);

    let strengthsAfterMove = { black: 0, white: 0 }
    // update the bPs
    let fauxBoard = Object.assign(bPs);
    fauxBoard[_from].takenByPlayer=0;
    fauxBoard[_from].counterName='';
    fauxBoard[_to].takenByPlayer=2;
    fauxBoard[_to].counterName='counterb_temp';

    whiteStartPositions.forEach( (_p, _i)=> {
        if (fauxBoard[_p].takenByPlayer===1) {
            strengthsAfterMove.white+=Math.pow(2,_i);
        }
    })

    blackStartPositions.forEach( (_p, _i)=> {
        if (fauxBoard[_p].takenByPlayer===2) {
            strengthsAfterMove.white+=Math.pow(2,_i);
        }
    })

    console.log(`\n\nAttack strengths after move:`);
    console.table(strengthsAfterMove);

    // attack strength after move
    let whiteAttackLane = [...consts.playerPaths.white].splice(1,7); // even though this is the white lane, both white and black use the attack lane
    let aLS = '';
    whiteAttackLane.forEach( (_a)=> {
        if (fauxBoard[_a].takenByPlayer===1) {

        } else if (fauxBoard[_a].takenByPlayer===2) {

        }
        aLS+=fauxBoard[_a].takenByPlayer.toString();
    })
    console.log(aLS);
}

vars.player.AI.popped = null;



/*
   ◄████████████████████████████████►
   ◄███► ENTRY POINT FOR THE AI ◄███►
   ◄████████████████████████████████►
*/
vars.player.AI.getBestMove = (_movables)=> {
    // OK, so we have already bounced the counters that are movable
    let counterName = vars.player.AI.getMovesCPU(_movables); // will return counterb_x or false
    console.log(`The selected counter is ${counterName}`);
    if (!counterName || !counterName.includes('counterb_')) {
        let msg = `The counter name doesnt appear to be valid`;
        vars.UI.showErrorScreen(`ERROR:\n\n${msg}\nCounter Name: ${counterName}\n\nThis needs fixing and is unrecoverable.\n\nIf the console is open, execution will stop.`);
        console.error(msg);
        return false;
    }

    // if we get this far, a valid counter was found
    // stop all the counter bounces etc and move the counter.
    // As PCs are extremely fast these days, Ive put in a 1 second pause before all that is done, to simulate "thinking"
    // otherwise the dice would roll and the AI would know (basically) instantly what the best move is.
    // POSSIBLE TODO - CHANGE THE 1 SECOND TIMEOUT TO SOMETHING MORE SUBSTANTIAL?
    setTimeout( ()=> {
        if (vars.player.AI.popped!==null && counterName!==vars.player.AI.popped) {
            // we arent moving the starting counter, push it back on to the atStart
            let popped = vars.player.AI.popped;
            vars.player.counters.black.atStart.push(popped);
            let object = vars.phaserObject.quickGet(popped);
            object.setData({ moveFrom: '', moveTo: '', boardPosition: '' }); // seriously, my next iteration of this game is gonna use classes.. holy moo...
            vars.player.AI.popped=null;
            vars.game.startingCounter = '';
            // we also need to hide the counter as cTNP doesnt reset it for some reason (honestly not sure if its meant to, might be done in an earlier function? WEIRD TODO
            object.setAlpha(0);
        } else {
            // we are moving the starting counter, reset the vars
            vars.player.AI.popped=null;
            vars.game.startingCounter = '';
        }
        let cObj = vars.phaserObject.quickGet(counterName);
        vars.animate.counterToNewPosition(cObj);
    },1000)
}