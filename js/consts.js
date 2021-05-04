const consts = {
    alphas: {
        ZERO: 0,
        HALF: 0.5,
        FULL: 1
    },

    dice: {
        maxRolls: 3*2
    },

    depths: {
        debug: 254,

        board: 5,
        counters: 10,
        dice: 10,
        loading: 50,
        message: 80
    },

    durations: {
        counterMove: 333,
        popup: 500
    },

    playerPaths: {
        // players start "off" the board in position wS/bS, follow their path and are "safe" when reaching wE/bE
        white: ['wS','w1','w2','w3','w4','a1','a2','a3','a4','a5','a6','a7','a8','w5','w6','wE'],
        black: ['bS','b1','b2','b3','b4','a1','a2','a3','a4','a5','a6','a7','a8','b5','b6','bE'],
    }
}