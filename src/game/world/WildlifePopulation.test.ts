import '+game/actors'
import { TreeActor } from '+game/actors/flora/tree/TreeActor'
import { DeerActor } from '+game/actors/units/deer/DeerActor'
import { Game } from '+game/Game'
import { NaturePlayer } from '+game/player/NaturePlayer'
import { ActorType, type Position } from '+game/types'

import { expect, test } from 'bun:test'

import { ForestTile, WaterTile } from './Tile'
import { TileType } from './types'
import { World } from './World'

function fixture() {
    const nature = new NaturePlayer()
    const world = new World(
        Array.from({ length: 60 }, () =>
            Array.from({ length: 60 }, () => new ForestTile()),
        ),
    )
    const game = new Game(world, [nature])
    return { game, nature }
}

test('seeds capped populations in forest clearings and restores gradual recovery', () => {
    const { game, nature } = fixture()
    const trees: Position[] = []
    for (let y = 5; y < 60; y += 10) {
        for (let x = 5; x < 60; x += 10) {
            trees.push([x, y])
            game.spawnActor(TreeActor, nature, [x, y])
        }
    }
    game.wildlife!.seed(17)

    const deer = game.findActorsByType(ActorType.Deer)
    const boars = game.findActorsByType(ActorType.Boar)
    expect(deer).toHaveLength(24)
    expect(boars).toHaveLength(6)
    for (const {
        position: [x, y],
    } of [...deer, ...boars]) {
        expect(game.world.getTile([x, y]).type).toBe(TileType.Forest)
        expect(
            trees.some(([tx, ty]) => Math.max(Math.abs(x - tx), Math.abs(y - ty)) === 1),
        ).toBe(true)
    }

    for (const animal of [deer[0]!, deer[1]!, boars[0]!]) animal.hit(animal.hp)
    game.tick(45_000)
    const loaded = Game.fromJSON(game.toJSON())
    loaded.tick(44_999)
    expect(loaded.findActorsByType(ActorType.Deer)).toHaveLength(22)
    expect(loaded.findActorsByType(ActorType.Boar)).toHaveLength(5)
    loaded.tick(1)
    expect(loaded.findActorsByType(ActorType.Deer)).toHaveLength(23)
    expect(loaded.findActorsByType(ActorType.Boar)).toHaveLength(5)
    loaded.tick(90_000)
    expect(loaded.findActorsByType(ActorType.Deer)).toHaveLength(24)
    expect(loaded.findActorsByType(ActorType.Boar)).toHaveLength(6)

    loaded.spawnActor(DeerActor, loaded.players[0]!, [0, 0])
    loaded.tick(180_000)
    expect(loaded.findActorsByType(ActorType.Deer)).toHaveLength(25)
    expect(loaded.findActorsByType(ActorType.Boar)).toHaveLength(6)
})

test('legacy saves wait before recovery and retry once forest habitat is available', () => {
    const { game, nature } = fixture()
    game.spawnActor(TreeActor, nature, [20, 20])
    game.world.setMultipleTiles((set) => {
        for (let y = 19; y <= 21; y++) {
            for (let x = 19; x <= 21; x++) {
                if (x !== 20 || y !== 20) set([x, y], new WaterTile())
            }
        }
    })
    const saved = game.toJSON()
    delete saved.wildlife
    const loaded = Game.fromJSON(saved)
    loaded.tick(90_000)
    expect(loaded.findActorsByType(ActorType.Deer)).toHaveLength(0)

    loaded.world.setTile([21, 20], new ForestTile())
    loaded.tick(4_999)
    expect(loaded.findActorsByType(ActorType.Deer)).toHaveLength(0)
    loaded.tick(1)
    expect(loaded.findActorsByType(ActorType.Deer)[0]?.position).toEqual([21, 20])
})
