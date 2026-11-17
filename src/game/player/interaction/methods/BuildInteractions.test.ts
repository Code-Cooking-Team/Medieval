import { config } from '+config'
import { Game } from '+game/Game'
import { HumanPlayer } from '+game/player/HumanPlayer'
import { type Renderer } from '+game/Renderer'
import { GroundRenderer } from '+game/renderer/GroundRenderer'
import { ActorType } from '+game/types'
import { Tile } from '+game/world/Tile'
import { World } from '+game/world/World'

import { expect, test } from 'bun:test'
import { PerspectiveCamera, Scene } from 'three'

import { BuildInteractions } from './BuildInteractions'

test('an oblique mouse ray shows the Guildhall preview and places it on click', () => {
    const player = new HumanPlayer()
    const world = new World(
        Array.from({ length: 80 }, () => Array.from({ length: 80 }, () => new Tile())),
    )
    const game = new Game(world, [player])
    const texture = config.renderer.texture
    config.renderer.texture = false
    const ground = new GroundRenderer(game)
    config.renderer.texture = texture
    const [width, depth] = world.getRealSize()
    ground.group.position.set(-width / 2, 0, -depth / 2)
    ground.init()

    const canvas = document.createElement('canvas')
    const scene = new Scene()
    const camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight)
    camera.position.set(0, 2, 3)
    camera.lookAt(0, 0, 0)
    const renderer = {
        webGLRenderer: { domElement: canvas },
        rtsCamera: { camera },
        scene,
        groundDistance: ground.groundDistance.bind(ground),
    } as unknown as Renderer

    player.selectBuilding(ActorType.Guildhall, undefined, true)
    const interactions = new BuildInteractions(game, renderer, player)
    interactions.enable()
    try {
        const pointer = {
            clientX: window.innerWidth / 2,
            clientY: window.innerHeight / 2,
        }
        canvas.dispatchEvent(new PointerEvent('pointermove', pointer))
        const preview = scene.children[0]?.children[0]
        expect(preview?.visible).toBe(true)
        expect(preview?.userData.valid).toBe(true)

        canvas.dispatchEvent(new MouseEvent('click', pointer))
        expect(game.findActorsByType(ActorType.Guildhall)[0]?.position).toEqual([40, 40])
    } finally {
        interactions.disable()
        ground.destroy()
    }
})
