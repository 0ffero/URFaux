vars.debugFN = {
    attackLaneInit: ()=> {

        console.groupCollapsed('Initialising counters...');
        let bPs = vars.boardPositions;
        ['a1','a2','a3','a4'].forEach( (_pos, _i)=> {
            let cName = vars.player.counters.black.atStart.pop();
            bPs[_pos].takenByPlayer=2;
            bPs[_pos].counterName=cName;
            let cO = vars.phaserObject.quickGet(cName);
            cO.setData('boardPosition',_pos);
            let x = bPs[_pos].x; let y = bPs[_pos].y;
            cO.setAlpha(1).setPosition(x,y).setFrame(`b${_pos}`).setData({ x: x, y: y });
            console.log(`  > Added black counter to position ${_pos}`);
        }); // <-- this semi-colon is needed or else the white counters will fail o.0 (Im missing something, but cant figure out what)
        // im assuming the interp is seeing something like
        // [array].fE(()=>{})[newArray].fE(()=>{})
        // and chrome (/browsers?) dont deal with it well.

        ['w4','w2'].forEach( (_a,_i)=> {
            let cName = vars.player.counters.white.atStart.pop();// `counterw_${6-_i}`;
            bPs[_a].takenByPlayer=1;
            bPs[_a].counterName=cName;
            let aO = vars.phaserObject.quickGet(cName);
            aO.setData('boardPosition',_a);
            let x = bPs[_a].x; let y = bPs[_a].y;
            aO.setAlpha(1).setPosition(x,y).setFrame(_a).setData({ x: x, y: y });
            console.log(`  > Added white counter to position ${_a}`);
        })
        console.groupEnd();
        vars.debugFN.updateDebugBoard()
    },

    bounceTestCounters: ()=> {
        console.warn('Bounce Test has been disabled'); return false;
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
        let positions = ['w4','w3','w2','w1','w6','w5','a1','a2','a3','a4','a5','a6','a7','a8','b4','b3','b2','b1','b6','b5'];
        let xStart = x = 1660;
        let y = 60;
        let spacing = 35;
        let debugDepth = consts.depths.debug;
        console.groupCollapsed('Creating DEBUG Board');
        /* let start = {
            white: [ vars.boardPositions.wS.x,vars.boardPositions.wS.y ],
            black: [ vars.boardPositions.bS.x,vars.boardPositions.bS.y ]
        } */
        positions.forEach( (_bP)=> {
            let colour = _bP[0]; let pos = ~~(_bP[1]);
            let reds = consts.colours.hex.reds;
            let greens = consts.colours.hex.greens;
            let tint = colour === 'w' || colour==='b' ? greens[pos-1] : reds[pos-1];
            let tintString = tint.toString(16);
            while (tintString.length<6) { tintString = '0' + tintString; }
            tintString = '#' + tintString;
            console.log(`Adding position ${_bP} at ${x}, ${y}. Tint is ${tintString}`);
            let posInt = _bP[1];
            if (posInt==6 && _bP[0]!=='a') { x+=spacing*2; }
            let dbp = scene.add.image(x,y,'debugBoardPieces').setDepth(debugDepth).setFrame(0).setName(`dbgBP_${_bP}`).setAlpha(0.8).setTint(tint).setData({ originalColour: tint });
            scene.groups.debug.add(dbp);
            x+=spacing;
            if (_bP==='w1' || _bP==='b1') { // show the atStart counter
                let frameColour = _bP[0];
                let tint = frameColour === 'b' ? 'black' : 'white';
                scene.add.text(x,y,'6').setName(`dbg${frameColour}AtStart`).setDepth(debugDepth).setOrigin(0.5).setColor(tint).setFontSize(32).setFontFamily('Consolas');
                scene.add.text(x+spacing,y,'0').setName(`dbg${frameColour}AtEnd`).setDepth(debugDepth).setOrigin(0.5).setColor(tint).setFontSize(32).setFontFamily('Consolas');
            }
            if (_bP==='w5') { x=xStart; y+=spacing; }
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
            scene.add.image(x,y,'counters').setFrame(_pos).setDepth(consts.depths.counters).setName(`counter${col}_${count}`);
            count++;
        })
    },

    updateDebugBoard: ()=> {
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

        vars.phaserObject.quickGet('dbgwAtStart').setText(vars.player.counters.white.atStart.length);
        vars.phaserObject.quickGet('dbgbAtStart').setText(vars.player.counters.black.atStart.length);
        vars.phaserObject.quickGet('dbgwAtEnd').setText(vars.boardPositions.wE.counterName.length);
        vars.phaserObject.quickGet('dbgbAtEnd').setText(vars.boardPositions.bE.counterName.length);
        if (vars.DEBUG) { console.groupEnd(); }
    }
}