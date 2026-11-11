import { config } from '+config'
import '+game/actors'
import { BarracksActor } from '+game/actors/buildings/barracks/BarracksActor'
import {
    GalleryActor,
    GalleryStairsActor,
} from '+game/actors/buildings/gallery/GalleryActor'
import { GuildhallActor } from '+game/actors/buildings/guildhall/GuildhallActor'
import { SmallRockActor } from '+game/actors/RockActor'
import { HumanActor } from '+game/actors/units/human/HumanActor'
import { Game } from '+game/Game'
import { HumanPlayer } from '+game/player/HumanPlayer'
import { createCliffShelfGeometry, pickCliffShelfTop } from '+game/renderer/lib/createCliffShelfGeometry'
import { StandingSurfaceRenderer } from '+game/renderer/StandingSurfaceRenderer'
import { MeadowTile, StepTile, Tile, WallTile, WaterTile } from '+game/world/Tile'
import { World } from '+game/world/World'

import { expect, test } from 'bun:test'
import { Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three'

import { Pathfinding } from './Pathfinding'
import { toStep } from './StandingSurfaces'

const flatWorld = () =>
    new World(
        Array.from({ length: 32 }, () =>
            Array.from({ length: 32 }, () =>
                Object.assign(new MeadowTile(), { height: 0 }),
            ),
        ),
    )

function fixture() {
    const player = new HumanPlayer()
    return { player, game: new Game(flatWorld(), [player]) }
}

test('walks up and down a rock, restores standing height from a save, and drops to restored ground on removal', async () => {
    const { game, player } = fixture()
    const rock = game.spawnActor(SmallRockActor, player, [12, 12])!
    const human = game.spawnActor(HumanActor, player, [11, 12])!
    const top = toStep([...game.pf.surfaces.all()][0]!)
    const order = await human.setPathTo(top)
    expect(order).toEqual([top])
    human.move()
    expect(human.standingPosition).toEqual(top)
    expect(game.world.getTile([12, 12]).height).toBe(0)
    expect(game.pf.surfaces.height(top)).toBeCloseTo(0.41)

    const loaded = Game.fromJSON(JSON.parse(JSON.stringify(game.toJSON())))
    const restored = loaded.getActorById(human.id) as HumanActor
    expect(restored.standingPosition).toEqual(top)
    expect(loaded.pf.surfaces.height(restored.standingPosition)).toBeCloseTo(0.41)

    await human.setPathTo([11, 12])
    human.move()
    expect(human.standingPosition).toEqual({ x: 11, y: 12, surface: undefined })

    const second = loaded.spawnActor(HumanActor, loaded.players[0]!, [11, 12])!
    await second.setPathTo(top)
    expect(second.hasPath()).toBe(true)
    loaded.removeActor(loaded.getActorById(rock.id)!)
    expect(second.hasPath()).toBe(false)
    expect(restored.surface).toBeUndefined()
    expect(restored.position).toEqual([12, 12])
    expect(loaded.world.getTile(restored.position).canWalk).toBe(true)
})

test('layered movement rejects solid sides, steep rises, and unlinked levels at the same coordinates', async () => {
    const pf = new Pathfinding(new World([[new Tile(), new Tile(), new Tile()]]))
    pf.surfaces.replace('object', [
        {
            id: 'lower',
            position: [1, 0],
            height: 0.9,
            ground: [[0, 0]],
            links: ['upper'],
        },
        { id: 'upper', position: [2, 0], height: 2.1, ground: [], links: ['lower'] },
    ])
    const lower = { x: 1, y: 0, surface: 'lower' }
    const upper = { x: 2, y: 0, surface: 'upper' }
    expect(pf.canMove({ x: 1, y: 0 }, lower)).toBe(false)
    expect(pf.canMove({ x: 2, y: 0 }, lower)).toBe(false)
    expect(pf.canMove(lower, upper)).toBe(false)
    expect(pf.canMove(upper, lower)).toBe(false)
    expect(await pf.findMovementPath({ x: 0, y: 0 }, upper)).toBeUndefined()
})

test('a designated surface can connect ground tiles separated by an obstacle', async () => {
    const pf = new Pathfinding(new World([[new Tile(), new WallTile(), new Tile()]]))
    pf.surfaces.replace('bridge', [
        {
            id: 'deck',
            position: [1, 0],
            height: 0.8,
            ground: [
                [0, 0],
                [2, 0],
            ],
            links: [],
        },
    ])
    const route = pf.findMovementPath({ x: 0, y: 0 }, { x: 2, y: 0 })
    pf.tick()
    expect(await route).toEqual([
        { x: 1, y: 0, surface: 'deck' },
        { x: 2, y: 0 },
    ])
})

test.each([0, 1, 2, 3])(
    'building layouts connect to their rotated approaches (%i)',
    async (rotation) => {
        for (const Building of [BarracksActor, GuildhallActor]) {
            const { game, player } = fixture()
            const building = game.spawnActor(Building, player, [16, 16], rotation)!
            expect(building).toBeDefined()
            const surfaces = [...game.pf.surfaces.all()]
            const [startX, startY] = surfaces[0]!.ground[0]!
            const human = game.spawnActor(HumanActor, player, [startX, startY])!
            if (Building === GuildhallActor)
                expect(surfaces.filter(({ group }) => group)).toHaveLength(9)
            const destinations =
                Building === GuildhallActor
                    ? [surfaces[12]!, surfaces[13]!]
                    : [surfaces.at(-1)!]
            for (const destination of destinations) {
                const target = toStep(destination)
                const fromUpperFloor = !!human.surface
                const route = await human.setPathTo(target)
                if (fromUpperFloor) {
                    expect(route?.every((step) => step.surface)).toBe(true)
                    expect(route).toContainEqual(toStep(surfaces[14]!))
                    expect(game.world.getTile(surfaces[14]!.position).canWalk).toBe(true)
                }
                expect(route?.at(-1)).toEqual(target)
                while (human.hasPath()) human.move()
                expect(human.standingPosition).toEqual(target)
            }
            expect((await human.setPathTo([startX, startY]))?.at(-1)).toEqual({
                x: startX,
                y: startY,
            })
            game.removeActor(building)
            expect(human.surface).toBeUndefined()
            expect(human.hasPath()).toBe(false)
        }
    },
)

test('separate gallery modules join end to end with the stairs', async () => {
    const { game, player } = fixture()
    const stairs = game.spawnActor(GalleryStairsActor, player, [12, 15])!
    expect(game.pf.canStep([11, 13], [12, 13])).toBe(true)
    expect(game.pf.canStep([12, 13], [13, 13])).toBe(true)
    expect(game.pf.canStep([11, 15], [12, 15])).toBe(false)
    const gallery = game.spawnActor(GalleryActor, player, [12, 12])!
    game.spawnActor(GalleryActor, player, [12, 11])!
    const side = game.spawnActor(GalleryActor, player, [13, 11])!
    const human = game.spawnActor(HumanActor, player, [12, 17])!
    const target = toStep(game.pf.surfaces.get(`building:${gallery.id}:0`)!)
    const sideTarget = toStep(game.pf.surfaces.get(`building:${side.id}:0`)!)
    expect(game.pf.canMove(target, sideTarget)).toBe(false)
    const path = await human.setPathTo(target)
    expect(path?.map(({ x, y }) => [x, y])).toEqual(
        [16, 15, 14, 13, 12].map((y) => [12, y]),
    )
    game.removeActor(stairs)
    expect(human.hasPath()).toBe(false)
    expect(await human.setPathTo(target)).toBeUndefined()
})

test('units can reach a gallery beside the top of the stairs', async () => {
    const { game, player } = fixture()
    game.spawnActor(GalleryStairsActor, player, [12, 15])!
    const gallery = game.spawnActor(GalleryActor, player, [11, 13])!
    const human = game.spawnActor(HumanActor, player, [12, 17])!
    const target = toStep(game.pf.surfaces.get(`building:${gallery.id}:0`)!)

    const path = await human.setPathTo(target)
    expect(path?.map(({ x, y }) => [x, y])).toEqual([
        [12, 16],
        [12, 15],
        [12, 14],
        [12, 13],
        [11, 13],
    ])
})

test('the raised marker receives movement clicks near the edge of the square', () => {
    const { game } = fixture()
    const position = [5, 5] as const
    game.pf.surfaces.replace('deck', [
        { id: 'deck', position: [...position], height: 2.4, ground: [], links: [] },
    ])
    const renderer = new StandingSurfaceRenderer(game.pf.surfaces)
    const size = config.renderer.tileSize
    const raycaster = new Raycaster(
        new Vector3(5.47 * size, 10 * size, 5 * size),
        new Vector3(0, -1, 0),
    )
    const previous = config.debug.standingSurfaceMarkers
    try {
        for (const value of [undefined, true, false] as const) {
            if (value === undefined) {
                Reflect.deleteProperty(config.debug, 'standingSurfaceMarkers')
            } else {
                config.debug.standingSurfaceMarkers = value
            }
            expect(renderer.pick(raycaster)).toEqual({ x: 5, y: 5, surface: 'deck' })
            expect(renderer.group.children[0]?.visible).toBe(value === true)
        }
    } finally {
        config.debug.standingSurfaceMarkers = previous
        renderer.destroy()
    }
})

test.each([2, 3])('a %i-wide cliff shelf matches the mesh and is reachable in both directions', async (size) => {
    const world = new World(
        Array.from({ length: 16 }, () =>
            Array.from({ length: 16 }, (_, x) =>
                Object.assign(x < 7 ? new StepTile() : size === 2 && x >= 9 ? new WaterTile() : new Tile(), {
                    height: x < 7 ? 5 : 0,
                }),
            ),
        ),
    )
    const pf = new Pathfinding(world)
    const spots = [...pf.surfaces.all()]
    expect(spots).toHaveLength(size ** 2)
    const entrance = spots.find(({ ground }) => ground.length)!
    const [x, y] = entrance.ground[0]!
    const ground = { x, y }
    expect(Math.abs(entrance.height - world.getTile([x, y]).height)).toBeLessThan(0.3)
    const target = toStep(spots.at(-1)!)
    const path = await pf.findMovementPath(ground, target)
    expect(path?.at(-1)).toEqual(target)
    expect((await pf.findMovementPath(target, ground))?.at(-1)).toEqual(ground)
    expect(world.getTile([target.x, target.y]).height).toBe(0)

    const geometry = createCliffShelfGeometry(world, 1)
    const material = new MeshBasicMaterial()
    expect(new Set(spots.map(({ height }) => height)).size).toBeGreaterThan(1)
    const mesh = new Mesh(geometry, material)
    for (const {
        position: [spotX, spotY],
        height,
    } of spots) {
        const raycaster = new Raycaster(
            new Vector3(spotX, 10, spotY),
            new Vector3(0, -1, 0),
        )
        expect(raycaster.intersectObject(mesh)[0]?.point.y).toBeCloseTo(height)
    }
    const outerX = Math.max(...spots.map(({ position }) => position[0]))
    const outerSpot = spots.filter(({ position }) => position[0] === outerX)[1]!
    const edgeX = outerX + (size === 3 ? 0.4 : 0.25)
    const edgeZ = outerSpot.position[1]
    const edgeRay = new Raycaster(
        new Vector3(edgeX, 10, edgeZ),
        new Vector3(0, -1, 0),
    )
    const edgeHit = edgeRay.intersectObject(mesh)[0]!
    expect(pickCliffShelfTop(edgeHit, edgeX, edgeZ)?.id).toBe(outerSpot.id)
    const middleX = spots.reduce((sum, { position }) => sum + position[0], 0) / spots.length
    const sideZ = Math.max(...spots.map(({ position }) => position[1])) + 0.6
    const sideRay = new Raycaster(new Vector3(middleX, 10, sideZ), new Vector3(0, -1, 0))
    const sideHit = sideRay.intersectObject(mesh)[0]!
    expect(pickCliffShelfTop(sideHit, middleX, sideZ)?.position[1]).toBeCloseTo(sideZ - 0.6)
    geometry.dispose()
    material.dispose()
})
