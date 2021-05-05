vars.debugFN = {
    bounceTestCounters: ()=> {
        [1,2,3,4,5,6,7,8].forEach( (_cN)=> {
            let a = vars.phaserObject.quickGet(`counterw_${_cN}`);
            let b = vars.phaserObject.quickGet(`counterb_${_cN}`);
            vars.animate.movableCounterBounce(a);
            vars.animate.movableCounterBounce(b);
        })
    },

    showCounterData: ()=> {
        let oldI = -1;
        let swap;
        ['blackCounters','whiteCounters'].forEach( (_cC, i)=> {
            swap = false;
            if (oldI!==i) {
                oldI=i;
                console.groupCollapsed(_cC);
                swap=true;
            }
            scene.groups[_cC].children.each( (_c)=> {
                console.log(_c.name);
                console.log(_c.data.list);
            });
            if (swap===true) {
                console.groupEnd();
            }
        })
    },

    showDebugBoard:()=> {
        let positions = ['w4','w3','w2','w1','w5','w6','a1','a2','a3','a4','a5','a6','a7','a8','b4','b3','b2','b1','b5','b6'];
        let xStart = x =1660;
        let y = 60;
        let spacing = 35;
        console.groupCollapsed('Creating DEBUG Board');
        positions.forEach( (_bP)=> {
            let colour = _bP[0]; let pos = ~~(_bP[1]);
            let reds = consts.colours.hex.reds;
            let greens = consts.colours.hex.greens;
            let tint = colour === 'w' || colour==='b' ? greens[pos-1] : reds[pos-1];
            let tintString = tint.toString(16);
            while (tintString.length<6) {
                tintString = '0' + tintString;
            }
            tintString = '#' + tintString;
            console.log(`Adding position ${_bP} at ${x}, ${y}. Tint is ${tintString}`);
            let posInt = _bP[1];
            if (posInt==5 && _bP[0]!=='a') { x+=spacing*2; }
            let dbp = scene.add.image(x,y,'debugBoardPieces').setDepth(consts.depths.debug).setFrame(0).setName(`dbgBP_${_bP}`).setAlpha(0.8).setTint(tint).setData({ originalColour: tint });
            scene.groups.debug.add(dbp);
            x+=spacing;
            if (_bP==='w6') { x=xStart; y+=spacing; }
            if (_bP==='a8') { x=xStart; y+=spacing; }
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
            scene.add.image(x,y,'counters').setFrame(_pos).setDepth(consts.depths.board+1).setName(`counter${col}_${count}`);
            count++;
        })
    },

    updateDebugBoard: ()=> {
        // first, remove all current tints
        // now update the board
        let bPs = vars.boardPositions;
        if (vars.DEBUG) { console.groupCollapsed('Updating Debug Board'); }
        for (bP in bPs) {
            if (!bP.includes('S') && !bP.includes('E')) {
                let frame = bPs[bP].takenByPlayer;
                let dbg = vars.phaserObject.quickGet(`dbgBP_${bP}`);
                if (vars.DEBUG) { console.log(`Updating the debug board position ${bP}`); }
                let tint = frame!==0 ? 0xffffff : dbg.getData('originalColour');
                dbg.setFrame(frame).setTint(tint);
            }
        }
        if (vars.DEBUG) { console.groupEnd(); }
    }
}