export const SPORT_CONFIG = {
    tableTennis: {
        name: "Table Tennis",
        pointsToWin: 11,
        deuceAt: 10,
        pointCap: null,
        maxGames: 5,
        hasSingles: true,
        hasDoubles: true,
    },
    badminton: {
        name: "Badminton",
        pointsToWin: 21,
        deuceAt: 20,
        pointCap: 30,
        maxGames: 3,
        hasSingles: true,
        hasDoubles: true,
    }
}

export type SportKey = keyof typeof SPORT_CONFIG;

export const DEFAULT_SPORT: SportKey = "tableTennis";