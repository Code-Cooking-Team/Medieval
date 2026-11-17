import { config } from '+config'
import '+game/actors'
import { WoodCampActor } from '+game/actors/buildings/woodCamp/WoodCampActor'
import { TreeActor } from '+game/actors/flora/tree/TreeActor'
import { HumanActor } from '+game/actors/units/human/HumanActor'
import { Game } from '+game/Game'
import { HumanPlayer } from '+game/player/HumanPlayer'
import type { Position } from '+game/types'
import { Tile } from '+game/world/Tile'
import { World } from '+game/world/World'

import { expect, test } from 'bun:test'

import type { WoodcutterProfession } from './WoodcutterProfession'

function fixture() {
    const player = new HumanPlayer()
    const world = new World(
        Array.from({ length: 32 }, () => Array.from({ length: 48 }, () => new Tile())),
    )
    const game = new Game(world, [player])
    const camp = game.spawnActor(WoodCampActor, player, [8, 15])!
    const worker = (position: Position) => {
        const actor = game.spawnActor(HumanActor, player, position)!
        camp.interact([actor])
        return actor
    }
    const tree = (position: Position) => {
        const actor = game.spawnActor(TreeActor, player, position)!
        actor.spawnNewTree = () => {}
        return actor
    }
    return { game, camp, worker, tree }
}

const job = (actor: HumanActor) => actor.profession as WoodcutterProfession

async function tickUntil(game: Game, done: () => boolean) {
    for (let tick = 0; tick < 180 && !done(); tick++) {
        game.tick()
        await Bun.sleep(1)
    }
    expect(done()).toBe(true)
}

test('woodcutters reserve distinct trees and wait when every tree is taken', async () => {
    const { game, worker, tree } = fixture()
    const workers = Array.from({ length: 5 }, () => worker([17, 15]))
    const trees = [
        [18, 15],
        [18, 16],
        [19, 15],
        [19, 16],
    ].map(([x, y]) => tree([x!, y!]))
    await tickUntil(game, () =>
        workers.slice(0, 4).every((actor) => actor.lastAction?.kind === 'chop'),
    )
    expect(new Set(workers.map((actor) => job(actor).treeId))).toEqual(
        new Set([...trees.map(({ id }) => id), undefined]),
    )

    const assigned = job(workers[0]!)
    const fallen = trees.find(({ id }) => id === assigned.treeId)!
    fallen.hit(fallen.hp)
    const replacement = tree([20, 15])
    await tickUntil(game, () =>
        workers.some((actor) => job(actor).treeId === replacement.id),
    )
    expect(workers.some((actor) => job(actor).treeId === fallen.id)).toBe(false)
})

test('a woodcutter returns to the same tree after unloading and reloading', async () => {
    const { game, camp, worker, tree } = fixture()
    const actor = worker([25, 15])
    const assigned = tree([26, 15])
    const nearCamp = tree([16, 15])
    const profession = job(actor)
    await tickUntil(game, () => actor.lastAction?.kind === 'chop')
    profession.fromJSON({
        ...profession.toJSON(),
        collectedTreeHP: config.woodcutter.capacity,
    })
    await tickUntil(game, () => camp.woodStock > 0)
    const loaded = Game.fromJSON(JSON.parse(JSON.stringify(game.toJSON())))
    const savedActor = loaded.getActorById(actor.id) as HumanActor
    await tickUntil(loaded, () => savedActor.lastAction?.kind === 'chop')
    expect(savedActor.lastAction?.target).toEqual(assigned.position)
    expect(job(savedActor).treeId).toBe(assigned.id)
    expect((loaded.getActorById(nearCamp.id) as TreeActor).hp).toBe(nearCamp.maxHp)
})

test('a move order retargets the woodcutter on arrival and keeps the new tree after unloading', async () => {
    const { game, camp, worker, tree } = fixture()
    const actor = worker([17, 15])
    const original = tree([18, 15])
    const destination = tree([30, 15])
    await tickUntil(game, () => actor.lastAction?.kind === 'chop')
    expect(job(actor).treeId).toBe(original.id)

    const profession = job(actor)
    profession.fromJSON({
        ...profession.toJSON(),
        collectedTreeHP: config.woodcutter.capacity,
    })
    void actor.orderMoveTo([29, 15])
    await tickUntil(game, () => profession.treeId === destination.id)
    expect(actor.position).toEqual([29, 15])
    await tickUntil(game, () => actor.lastAction?.target[0] === destination.position[0])
    expect(camp.woodStock).toBe(config.woodcutter.capacity)
    expect(profession.treeId).toBe(destination.id)
})

test('older saves with duplicate tree assignments recover on the next ticks', async () => {
    const { game, worker, tree } = fixture()
    const workers = [worker([17, 15]), worker([17, 15])]
    const trees = [tree([18, 15]), tree([18, 16])]
    for (const actor of workers) {
        const profession = job(actor)
        profession.fromJSON({
            ...profession.toJSON(),
            treeId: trees[0]!.id,
            machineState: 'ChoppingTree',
        })
    }

    const loaded = Game.fromJSON(JSON.parse(JSON.stringify(game.toJSON())))
    const savedWorkers = workers.map(({ id }) => loaded.getActorById(id) as HumanActor)
    await tickUntil(loaded, () =>
        savedWorkers.every((actor) => actor.lastAction?.kind === 'chop'),
    )
    expect(new Set(savedWorkers.map((actor) => job(actor).treeId))).toEqual(
        new Set(trees.map(({ id }) => id)),
    )
})
