import { createConfig } from './lib/createConfig'
import { minMaxNumber, select } from './lib/definitions'

export const config = createConfig({
    core: {
        tickTime: 200,
        devTilesSize: 60,
    },

    renderer: {
        tileSize: 1,
        dayAndNightMode: true,
        dayAndNightTimeScale: 256,
        dayAndNightTimeStart: 0,
    },

    tree: {
        hp: 300,
        removeTickCount: 10,
        newTreeTicks: { min: 100, max: 1000 },
        newTreeRange: [-3, -2, 2, 3],
    },

    lumberjack: {
        hp: 100,
        choppingDamage: 20,
        gatheringSpeed: 5,
        capacity: 50,
    },

    configTest: {
        bool: false,
        number: 20,
        string: 'Hello',
        select: select('first', ['first', 'second', 'third']),
        minMax: minMaxNumber(100, 1, 1000),
    },
})
