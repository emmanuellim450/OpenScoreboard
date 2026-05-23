export const supportedSports = {
    tableTennis: {
        displayName: "Table Tennis",
        hasScoringTypes: false,
        defaults: {
            bestOf: 5,
            isDoubles: false,
            pointsToWinGame: 11
        }
    },
    pickleball: {
        displayName: "Pickleball",
        hasScoringTypes: true,
        defaults: {
            bestOf: 1,
            isDoubles: true,
            pointsToWinGame: 11,
        },
        scoringTypes: {
            normal: {
                displayName: "Normal"
            },
            rally: {
                displayName: "Rally Scoring",
                defaults: {
                    pointsToWinGame: 21
                }
            }
        }
    },
    badminton: {
        displayName: "Badminton",
        hasScoringTypes: true,
        defaults: {
            bestOf: 3,
            isDoubles: false,
            pointsToWinGame: 21,
            pointCap: 30
        },
        scoringTypes: {
            bwfTraditional: {
                displayName: "BWF Traditional (3x21)",
                defaults: {
                    pointsToWinGame: 21,
                    pointCap: 30,
                    bestOf: 3
                }
            },
            bwf2027: {
                displayName: "BWF 2027 (3x15)",
                defaults: {
                    pointsToWinGame: 15,
                    pointCap: 21,  // at 20-all, next point wins
                    bestOf: 3
                }
            }
        }
    }
}