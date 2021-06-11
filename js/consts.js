const consts = {
    alphas: {
        ZERO: 0,
        HALF: 0.5,
        FULL: 1
    },

    colours: {
        init: ()=> {
            let cC = consts.colours;
            cC.hex.grays = [];
            cC.html.grays = [];
            let graysHex = cC.hex.grays;
            let graysHTML = cC.html.grays;
            let inc = 0x111111
            let colour=0x0;
            console.groupCollapsed('🎨 Setting up gray colours');
            while (colour<=0xffffff) {
                graysHex.push(colour);
                let html = `#${colour.toString(16)}`;
                html +=html.length===2 ? '00000' : '';
                graysHTML.push(html);
                vars.DEBUG ? console.log(`Added colour: ${html}`) : null;
                colour+=inc;
            }
            console.groupEnd();
        },

        html: {
            greens: ['#00b000','#00bb00','#00d000','#00dd00', '#00f000', '#00ff00'],
            reds: ['#900000', '#990000', '#b00000', '#bb0000', '#d00000', '#dd0000', '#f00000', '#ff0000']
        },
        hex: {
            greens: [0x00b000,0x00bb00,0x00d000,0x00dd00, 0x00f000, 0x00ff00],
            reds: [0x900000, 0x990000, 0xb00000, 0xbb0000, 0xd00000, 0xdd0000, 0xf00000, 0xff0000]
        },
        shieldMaxColour: 48
    },

    dice: {
        maxRolls: 3*2,
        positions: [[1600,700], [1750,700], [1600,840], [1750,840]]
    },

    defaultLightningHits: [
        [-492, 750 ],
        [-535, 1001],
        [ -86, 1047],
        [   2, 1037],
        [ 472, 1006],
        [ 753, 1001],
        [ 851,  782]
    ],

    depths: {
        sand: 1,
        countersComplete: 2, // depth of counters when they get to their finish position
        board: 10,
        diceBG: 12,
        counters: 15, // depth while counters are on the board
        dice: 15,
        shield: 20,
        weather: 30,
        vignette: 35,
        playerFace: 40,
        optionsScreen: 45,
        loading: 50,
        volumeOptions: 70,
        message: 80,
        error: 100, // basically if an error screen is shown, its on top of everything else for obvious reasons
        pointer: 150,
        debug: 255,
    },

    durations: {
        counterMove: 333,
        diceEndRoll: 2000,
        popup: 250,
        oneMinute: 60000
    },

    playerPaths: {
        // players start "off" the board in position wS/bS, follow their path and are "safe" when reaching wE/bE
        white: ['wS','w1','w2','w3','w4','a1','a2','a3','a4','a5','a6','a7','a8','w5','w6','wE'],
        black: ['bS','b1','b2','b3','b4','a1','a2','a3','a4','a5','a6','a7','a8','b5','b6','bE']
    },

    positions: {
        playerFace: [50,50],
        counters: {
            white: [0,0],
            black: [1,1],
        }
    }
}