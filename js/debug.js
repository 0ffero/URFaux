vars.debugFN = {
    bounceTestCounters: ()=> {
        [1,2,3,4,5,6,7,8].forEach( (_cN)=> {
            let a = vars.phaserObject.quickGet(`counterw_${_cN}`);
            let b = vars.phaserObject.quickGet(`counterb_${_cN}`);
            vars.animate.movableCounterBounce(a);
            vars.animate.movableCounterBounce(b);
        })
    },

    showDebugBoard:()=> {
        let positions = ['w4','w3','w2','w1','w5','w6','a1','a2','a3','a4','a5','a6','a7','a8','b4','b3','b2','b1','b5','b6'];
        let xStart = x =1660;
        let y = 60;
        let spacing = 35;
        let frame=0;
        console.groupCollapsed('Creating DEBUG Board');
        positions.forEach( (_bP)=> {
            console.log(`Adding position ${_bP} at ${x}, ${y}`);
            let posInt = _bP[1];
            if (posInt==5 && _bP[0]!=='a') { x+=spacing*2; }
            let dbp = scene.add.image(x,y,'debugBoardPieces').setDepth(consts.depths.debug).setFrame(frame).setName(`dbgBP_${_bP}`).setAlpha(0.5);
            scene.groups.debug.add(dbp);
            x+=spacing;
            if (_bP==='w6') { x=xStart; y+=spacing; frame++; }
            if (_bP==='a8') { x=xStart; y+=spacing; frame++; }
        })
        console.groupEnd();
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
    },

    updateDebugBoard: ()=> {
        // first, remove all current tints
        scene.groups.debug.children.each( (c)=> {
            c.clearTint();
        })
        // now update the board
        let bPs = vars.boardPositions;
        for (bP in bPs) {
            if (bPs[bP].takenByPlayer!==0) {
                let dbg = vars.phaserObject.quickGet(`dbgBP_${bP}`);
                console.log(`Updating the debug board position ${bP}`);
                dbg.setTint(0x00ff00);
            }
        }
    }
}