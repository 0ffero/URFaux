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

vars.player.AI.getMovesCPU = ()=> {
    console.clear();
    let cpuAtStart = vars.player.counters.black.atStart.length; // currently forcing this to 2 for testing purposes
    cpuAtStart+=2; // remember to remove

    let useTempData = true;
    let boardPositions = Object.assign(vars.boardPositions); // this duplicates the board positions object so we can modify it
    // FORCING TEST DATA
    useTempData ? boardPositions = {
        "wS": { "x": 1022, "y": 184, "takenByPlayer": 0, "counterName": "" },
        "w1": { "x": 917,  "y": 230, "takenByPlayer": 0, "counterName": "" },
        "w2": { "x": 759,  "y": 305, "takenByPlayer": 1, "counterName": "counterw_5" },
        "w3": { "x": 577,  "y": 386, "takenByPlayer": 0, "counterName": "" },
        "w4": { "x": 361,  "y": 486, "takenByPlayer": 1, "counterName": "counterw_6" },
        "bS": { "x": 1320, "y": 337, "takenByPlayer": 0, "counterName": "" },
        "b1": { "x": 1210, "y": 406, "takenByPlayer": 0, "counterName": "" },
        "b2": { "x": 1047, "y": 517, "takenByPlayer": 2, "counterName": "counterb_3" },
        "b3": { "x": 851,  "y": 642, "takenByPlayer": 0, "counterName": "" },
        "b4": { "x": 603,  "y": 808, "takenByPlayer": 0, "counterName": "" },
        "a1": { "x": 468,  "y": 626, "takenByPlayer": 2, "counterName": "counterb_6" },
        "a2": { "x": 698,  "y": 501, "takenByPlayer": 0, "counterName": "" },
        "a3": { "x": 886,  "y": 400, "takenByPlayer": 2, "counterName": "counterb_4" },
        "a4": { "x": 1046, "y": 313, "takenByPlayer": 2, "counterName": "counterb_2" },
        "a5": { "x": 1179, "y": 242, "takenByPlayer": 2, "counterName": "counterb_5" },
        "a6": { "x": 1290, "y": 181, "takenByPlayer": 0, "counterName": "" },
        "a7": { "x": 1390, "y": 127, "takenByPlayer": 0, "counterName": "" },
        "a8": { "x": 1477, "y": 81,  "takenByPlayer": 1, "counterName": "counterw_4" },
        "w5": { "x": 1352, "y": 35,  "takenByPlayer": 0, "counterName": "" },
        "w6": { "x": 1260, "y": 76,  "takenByPlayer": 0, "counterName": "" },
        "wE": { "x": 1152, "y": 127, "takenByPlayer": 0, "counterName": [] },
        "b5": { "x": 1626, "y": 132, "takenByPlayer": 0, "counterName": "" },
        "b6": { "x": 1547, "y": 187, "takenByPlayer": 0, "counterName": "" },
        "bE": { "x": 1457, "y": 255, "takenByPlayer": 0, "counterName": [] }
    } : null;

    // movable will be passed to this function by get movable counters
    // ATM WERE FORCING TEST DATA
    movable = [
        ['counterb_3','a2',false],  // counter name, position its moving to, and whether its taking or not
        ['counterb_5','b5',false],
        ['counterb_2','a8',true],
        ['counterb_4','a7',false]
    ];

    if (cpuAtStart>0 || useTempData) { // CPU has counters that are still to enter the board. Add a counter to the bS position
        useTempData ? cName = 'counterb_1' : console.log(`Still to be added. Pop a counter from the atStart array`);
        boardPositions.bS.counterName = cName;
        movable.push([cName, 'b4', false]);
    }

    paths = {
        "white": [ "wS", "w1", "w2", "w3", "w4", "a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "w5", "w6", "wE" ],
        "black": [ "bS", "b1", "b2", "b3", "b4", "a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "b5", "b6", "bE" ]
    }

    roll = 4
    playerCounters = [
        ['counterw_5','w2'],
        ['counterw_6','w4'],
        ['counterw_4','a7']
    ];

    console.log('Board Positions ...')
    console.table(boardPositions);
    console.log('---------------------------------------------------');

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



    // TEST AGAINST THE RULES SHOWN ABOVE
    // we need to add a threat level based on how many enemy counters can take each counter (using pCAttack)
    playerCounters = detail ? console.table(playerCounters) : null; // <-- if detail is on, show it, otherwise nullify the var (the detail isnt really needed unless debuging)
    console.log('\n\nAssessing Threat Levels (rules 2 and 3)...');
    movable.forEach( (_m)=> {
        let cName = _m[0];// let moveTo = _m[1]; let cTaking = _m[2];
        if (_m[3]===undefined) { _m.push(0,[],[]); } // _m[3] = points, _m[4] = resons to move, _m[5] = reasons against moving

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
            _m[4].push(`Counter can be taken by ${attackers} player counters. Points +${points}`);
        }
        
        // RULE 3) If this counter was moved, determine threat level of new position
        // check if the moveTo is in the pc blocks
        let moveTo = _m[1];
        if (pCBlocks[moveTo] !== undefined) {
            let attackers = pCBlocks[moveTo].length;
            let penalty = attackers * 10;

            // deduct those points from the current total
            _m[3] -= penalty;
            _m[5].push(`If this counter moves it will be attackable by ${attackers}. Points -${penalty}`);
        } else {
            _m[3] += 10;
            _m[4].push(`If this counter moves it will be safe from attackers. Points +10`);
        }
    })

    console.log('\n\nAssessing Rules 1, 4 & 5...');
    let optimalMoveFound = false;
    movable.forEach( (_m)=>{
        let score = 0;
        let counterName = _m[0]; let movingTo = _m[1];

        // RULE 1) Are they moving to a free shot?
        if (movingTo==='a4' || movingTo==='b6' || movingTo==='b4') { // free shot square
            let maxScore = 50; let bonus = 20;
            switch (movingTo) {
                case 'a4': // untakable free shot square - highest priority - this is our move!
                    score+=maxScore+bonus;
                    _m[4].push(`Counter would be moving to a4. Points +70}`);
                    optimalMoveFound=true;
                    break;
                case 'b4': case 'b6': // free shot square - medium priority?
                    score+=maxScore;
                    _m[4].push(`Counter would be moving to b4 or b6 (free shot square). Points +50}`);
                    break;
            }
        }



        // RULE 4) Is this counter taking on move?
        let rule4 = vars.player.AI.checkRule(4, _m, score);
        if (rule4===false) {
            // error returned
            return false;
        }
        _m = rule4[0]; score = rule4[1];
        rule4=null;



        // RULE 5) moveTo is a1-a3, a5-a8, b1-b3, b5, b6
        let rule5 = vars.player.AI.checkRule(5, _m, score);
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
    debugger;

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


vars.player.AI.checkRule = (ruleNumber, movableData, score)=> {
    let _m = movableData;
    switch (ruleNumber) {
        case 1:
            ;
            break;
        case 2:
            ;
            break;
        case 3:
            ;
            break;
        case 4:
            // RULE 4) Is this counter taking on move?
            let taking = _m[2];
            if (taking) { score += 10; _m[4].push(`Move would be taking a player counter. Points +10`); } // if were taking a player counter;
            return [_m, score];
            break;
        case 5:
            // RULE 5) moveTo is a1-a3, a5-a8, b1-b3, b5, b6
            let movingTo = _m[1];
            if (movingTo==='a1' || movingTo==='a2' || movingTo==='a3') {
                score-=10;
                _m[5].push(`Move is to a1, a2 or a3 (pretty dangerous board positions). Points -10`);
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
                score+=10;
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
    console.log(`Highest impulse: ${highestImpulse}`);
    console.table(bestMoves);

    if (bestMoves.length>1) { // there were multiple "best" moves. Choose one based on positives and negatives
        console.log(`OK, there are still more than 1 "best" moves. Testing the good against the bad`);
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
            console.log(`  .. after testing good v bad, only 1 move is "best". Returning ${counterName}`);
            return averages[0][1];
        } else { // okay... there are still multiple options, we simply randomise them and return one
            let selected = shuffle(averages)[0][1];
            console.log(`  .. even after testing there are still multiple "best" moves. At this point either will do.\n  .. returning ${selected}`);
            return selected;
        }

    } else { // only one best move found
        console.log(`Only one best move was found. Returning ${bestMoves[0][0]}`);
        return bestMoves[0][0]; // returns the counter name for the best move
    }
}