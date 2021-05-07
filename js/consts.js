const consts = {
    alphas: {
        ZERO: 0,
        HALF: 0.5,
        FULL: 1
    },

    colours: {
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
        positions: [[1500,700], [1650,700], [1500,840], [1650,840]]
    },

    depths: {
        debug: 254,
        sand: 1,
        countersComplete: 2, // depth of counters when they get to their finish position
        board: 10,
        counters: 15, // depth while counters are on the board
        dice: 15,
        shield: 20,
        loading: 50,
        message: 80
    },

    durations: {
        counterMove: 333,
        popup: 500,
        oneMinute: 60000
    },

    playerPaths: {
        // players start "off" the board in position wS/bS, follow their path and are "safe" when reaching wE/bE
        white: ['wS','w1','w2','w3','w4','a1','a2','a3','a4','a5','a6','a7','a8','w5','w6','wE'],
        black: ['bS','b1','b2','b3','b4','a1','a2','a3','a4','a5','a6','a7','a8','b5','b6','bE']
    }
}