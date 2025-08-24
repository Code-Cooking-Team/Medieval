import { Diagonals } from '+game/renderer/lib/DiagonalsPlaneGeometry'

import { createConfig } from './lib/createConfig'
import { colorInput } from './lib/definitions'

export const { config, resetConfig, saveConfig } = createConfig({
    core: {
        tickTime: 250,
        orbitalControls: false,
        unfocusedFpsLimit: 5,
    },
    camera: {
        fov: 60,
        far: 350,
        near: 0.1,
        minHeight: 2.0,
        maxHeight: 8.0,
    },

    debug: {
        logSelected: true,
        wireModel: false,
        groundWireframe: false,
    },

    renderer: {
        exposure: 1,
        tileSize: 0.1,
        texture: true,
        fog: true,
        fogTransparency: 3,
        dayAndNightMode: true,
        dayAndNightTimeScale: 600,
        dayAndNightTimeStart: 1,
        shadow: true,
        treeWaving: true,
        light: false,
        diagonals: 'random' as Diagonals,
    },

    postProcessing: {
        postprocessingEnabled: true,

        bloomEnabled: true,
        bloomStrength: 1.25,
        bloomThreshold: 0.45,
        bloomRadius: 0.45,

        outlineEnabled: true,
        outlineEdgeStrength: 2.0,
        outlineEdgeGlow: 0.0,
        outlineEdgeThickness: 0.2,
        outlinePulsePeriod: 0,

        FXAAEnabled: true,
        bokehEnable: true,
        bokehAperture: 0.002,
        bokehMaxBlur: 0.01,

        gammaCorrectionShader: true,
    },

    walkableRenderer: {
        movementSmoothness: 5,
        rotationSmoothness: 10,
    },

    barracks: {
        hp: 1000,
    },

    wall: {
        hp: 1000,
    },

    guildhall: {
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
        color: colorInput(0x63523c),
    },

    woodcutter: {
        hp: 100,
        choppingDamage: 20,
        gatheringSpeed: 30,
        capacity: 50,
        attackDamage: 15,
        color: colorInput(0x134714),
    },

    guardian: {
        hp: 100,
        attackDamage: 25,
        color: colorInput(0x225c43),
    },
})
