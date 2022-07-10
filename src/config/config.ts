import { createConfig } from './lib/createConfig'
import { colorInput, minMaxNumber, select } from './lib/definitions'

export const { config, resetConfig, saveConfig } = createConfig({
    core: {
        tickTime: 200,
        devTilesSize: 60,
        orbitalControls: false,
        cameraFov: 60,
        cameraFar: 350,
        cameraNear: 0.1,
    },

    renderer: {
        tileSize: 1,
        fog: true,
        fogTransparency: 3,
        dayAndNightMode: true,
        dayAndNightTimeScale: 500,
        dayAndNightTimeStart: -500,
        shadow: true,
        treeWaving: true,
        wireframe: true,
        light: false,
    },

    barracks: {
        hp: 1000,
    },

    house: {
        hp: 1000,
        newChildCountMin: 10,
        newChildCountMax: 30,
    },
    tree: {
        hp: 300,
        removeTickCount: 10,
        newTreeTicksMin: 50,
        newTreeTicksMax: 10000,
        newTreeRange: [-3, -2, 2, 3],
    },

    boar: {
        hp: 80,
        randomWalkChance: 0.01,
        attackDistance: 1.5,
        lookEnemyDistance: 8,
        attackDamage: 3,
    },

    human: {
        hp: 100,
        randomWalkChance: 0.01,
        walkAroundHomeDistance: 7,
        attackDistance: 1.5,
        attackDamage: 5,
    },

    woodCutter: {
        hp: 100,
        choppingDamage: 20,
        gatheringSpeed: 5,
        capacity: 50,
        attackDamage: 15,
    },

    guardian: {
        hp: 100,
        attackDamage: 25,
    },

    configTest: {
        bool: false,
        number: 20,
        string: 'Hello',
        select: select('first', ['first', 'second', 'third']),
        minMax: minMaxNumber(100, 1, 1000),
        color: colorInput(0xabc123),
    },
})
