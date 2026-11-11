import { expect, test } from 'bun:test'
import '+game/actors'
import { HunterHutActor } from '+game/actors/buildings/hunterHut/HunterHutActor'
import { BoarActor } from '+game/actors/units/boars/BoarActor'
import { DeerActor } from '+game/actors/units/deer/DeerActor'
import { HumanActor } from '+game/actors/units/human/HumanActor'
import { Game } from '+game/Game'
import { HumanPlayer } from '+game/player/HumanPlayer'
import { NaturePlayer } from '+game/player/NaturePlayer'
import { ActorType } from '+game/types'
import { Tile, WallTile } from '+game/world/Tile'
import { World } from '+game/world/World'

import { type HunterProfession } from './HunterProfession'

const fixture = () => {
    const player = new HumanPlayer()
    const nature = new NaturePlayer()
    const world = new World(
        Array.from({ length: 40 }, () => Array.from({ length: 52 }, () => new Tile())),
    )
    const game = new Game(world, [player, nature])
    const hut = game.spawnActor(HunterHutActor, player, [10, 10])!
    const human = game.spawnActor(HumanActor, player, [10, 16])!
    hut.interact([human])
    const hunter = human.profession as HunterProfession
    const deer = () => game.spawnActor(DeerActor, nature, [12, 16])!
    return { game, player, nature, hut, human, hunter, deer }
}

function tickUntil(game: Game, done: () => boolean, limit = 240) {
    for (let i = 0; i < limit && !done(); i++) game.tick()
    expect(done()).toBe(true)
}

test('assigns only living owned humans and equips a spear without losing an existing load', () => {
    const { game, hut, human, hunter } = fixture()
    expect(human.getEquippedItem('Hands')).toBe('spear')
    expect(hunter.hutId).toBe(hut.id)
    hunter.carriedMeat = 20
    hut.interact([human])
    expect(human.profession).toBe(hunter)
    expect(hunter.carriedMeat).toBe(20)
    const outsider = game.spawnActor(HumanActor, new HumanPlayer(), [20, 20])!
    expect(hut.interact([outsider])).toBe(false)
    expect(outsider.profession).toBeUndefined()
    human.hp = 0
    expect(hut.interact([human])).toBe(false)
})

test('ordinary hits give no meat; the killing blow yields one load and delivery increases stock', () => {
    const { game, hut, human, hunter, deer } = fixture()
    const prey = deer()
    human.tick()
    expect(prey.hp).toBeLessThan(prey.maxHp)
    expect(hunter.carriedMeat).toBe(0)
    expect(hut.meatStock).toBe(0)
    prey.hp = 1
    human.tick()
    expect(prey.isDead()).toBe(true)
    expect(game.getActorById(prey.id)).toBeUndefined()
    expect(hunter.carriedMeat).toBe(20)
    human.target = prey
    human.tick()
    expect(hunter.carriedMeat).toBe(20)
    tickUntil(game, () => hut.meatStock === 20)
    expect(hunter.carriedMeat).toBe(0)
})

test('catches a fleeing deer on an open map and returns the meat', () => {
    const { game, hut, deer } = fixture()
    const prey = deer()
    prey.position = [26, 20]
    tickUntil(game, () => prey.isFleeing)
    tickUntil(game, () => hut.meatStock === 20)
    expect(game.getActorById(prey.id)).toBeUndefined()
})

test('does not proactively hunt boars, but retaliates and collects meat on a defensive kill', () => {
    const { game, nature, human, hunter } = fixture()
    const boar = game.spawnActor(BoarActor, nature, [11, 16])!
    human.tick()
    expect(boar.hp).toBe(boar.maxHp)
    expect(hunter.preyId).toBeUndefined()
    human.hit(5, boar)
    expect(human.target).toBe(boar)
    boar.hp = 1
    human.tick()
    expect(boar.isDead()).toBe(true)
    expect(hunter.carriedMeat).toBe(30)
    expect(human.profession).toBe(hunter)
})

test('retaliation interrupts pursuit and delivery without losing already carried meat', () => {
    const { game, nature, human, hunter, deer } = fixture()
    const prey = deer()
    human.tick()
    expect(hunter.preyId).toBe(prey.id)
    hunter.carriedMeat = 20
    const boar = game.spawnActor(BoarActor, nature, [11, 16])!
    human.hit(5, boar)
    boar.hp = 1
    human.tick()
    expect(hunter.carriedMeat).toBe(50)
    expect(human.target).toBeUndefined()
})

test('two hunters cannot claim the same kill, nor a kill made by another unit', () => {
    const { game, player, hut, human, hunter, deer } = fixture()
    const other = game.spawnActor(HumanActor, player, [11, 16])!
    hut.interact([other])
    const second = other.profession as HunterProfession
    const prey = deer()
    prey.hp = 1
    second.preyId = prey.id
    human.tick()
    other.tick()
    expect(hunter.carriedMeat + second.carriedMeat).toBe(20)
    const next = deer()
    second.preyId = next.id
    next.hit(1000, new HumanActor(game, player))
    other.tick()
    expect(second.carriedMeat).toBe(0)
})

test('full storage accepts only available space and retains the remainder until space opens', () => {
    const { game, hut, human, hunter } = fixture()
    hut.collectMeat(495)
    hunter.carriedMeat = 20
    human.position = hut.getDeliveryPosition()
    human.tick()
    expect(hut.meatStock).toBe(500)
    expect(hunter.carriedMeat).toBe(15)
    for (let i = 0; i < 20; i++) human.tick()
    expect(hunter.carriedMeat).toBe(15)
    hut.meatStock = 480
    tickUntil(game, () => hunter.carriedMeat === 0)
    expect(hut.meatStock).toBe(495)
})

test('reroutes to a reachable owned hut after removal, never delivering to an enemy hut', () => {
    const { game, player, hut, hunter } = fixture()
    const enemyHut = game.spawnActor(HunterHutActor, new HumanPlayer(), [22, 10])!
    const replacement = game.spawnActor(HunterHutActor, player, [35, 10])!
    hunter.carriedMeat = 20
    game.removeActor(hut)
    tickUntil(game, () => replacement.meatStock === 20)
    expect(enemyHut.meatStock).toBe(0)
    expect(hunter.hutId).toBe(replacement.id)
})

test('waits with its load when no hut exists and resumes when one is placed', () => {
    const { game, player, hut, hunter } = fixture()
    hunter.carriedMeat = 30
    game.removeActor(hut)
    for (let i = 0; i < 20; i++) game.tick()
    expect(hunter.carriedMeat).toBe(30)
    const replacement = game.spawnActor(HunterHutActor, player, [10, 10])!
    tickUntil(game, () => replacement.meatStock === 30)
})

test('skips unreachable prey and replans after terrain changes', () => {
    const { game, human, hunter, deer, hut } = fixture()
    game.world.setMultipleTiles((set) => {
        for (let y = 0; y < 40; y++) set([20, y], new WallTile())
    })
    const blocked = deer()
    blocked.position = [22, 16]
    human.tick()
    expect(hunter.preyId).toBeUndefined()
    const reachable = deer()
    reachable.hp = 1
    tickUntil(game, () => hut.meatStock === 20)
    expect(blocked.hp).toBe(blocked.maxHp)
    game.world.setMultipleTiles((set) => set([20, 20], new Tile()))
    blocked.hp = 1
    tickUntil(game, () => hut.meatStock === 40)
})

test('explicit movement wins over hunting and obsolete targets give no reward', () => {
    const { game, human, hunter, deer } = fixture()
    const prey = deer()
    human.path = [
        { x: 9, y: 16 },
        { x: 8, y: 16 },
    ]
    human.tick()
    expect(human.position).toEqual([9, 16])
    expect(prey.hp).toBe(prey.maxHp)
    human.cancelPath()
    hunter.preyId = prey.id
    game.removeActor(prey)
    human.tick()
    expect(hunter.carriedMeat).toBe(0)
    expect(hunter.preyId).toBeUndefined()
})

test('save/load preserves stored meat, assignment, carried meat and equipment; old huts default to zero', () => {
    const { game, hut, human, hunter } = fixture()
    hut.collectMeat(40)
    hunter.carriedMeat = 30
    const loaded = Game.fromJSON(JSON.parse(JSON.stringify(game.toJSON())))
    const loadedHuman = loaded.getActorById(human.id) as HumanActor
    const loadedHunter = loadedHuman.profession as HunterProfession
    const loadedHut = loaded.getActorById(hut.id) as HunterHutActor
    expect(loadedHunter.hutId).toBe(hut.id)
    expect(loadedHunter.carriedMeat).toBe(30)
    expect(loadedHuman.getEquippedItem('Hands')).toBe('spear')
    expect(loadedHut.meatStock).toBe(40)
    tickUntil(loaded, () => loadedHut.meatStock === 70)
    const { meatStock, ...legacy } = hut.toJSON()
    loadedHut.fromJSON(legacy)
    expect(loadedHut.meatStock).toBe(0)
    expect(loaded.findActorsByType(ActorType.HunterHut)).toHaveLength(1)
})

test('unreachable assigned hut falls back to another hut, and terrain changes invalidate a delivery route', () => {
    const { game, player, hut, human, hunter } = fixture()
    const other = game.spawnActor(HunterHutActor, player, [35, 10])!
    hunter.carriedMeat = 20
    human.position = [30, 20]
    human.tick()
    game.world.setMultipleTiles((set) => {
        for (let y = 0; y < 40; y++) set([20, y], new WallTile())
    })
    tickUntil(game, () => other.meatStock === 20)
    expect(hut.meatStock).toBe(0)
})

test('hunters wait when all huts are full and resume after space becomes available', () => {
    const { game, hut, human, hunter, deer } = fixture()
    hut.collectMeat(hut.meatCapacity)
    const prey = deer()
    prey.hp = 1
    human.tick()
    expect(prey.hp).toBe(1)
    expect(hunter.preyId).toBeUndefined()
    hut.meatStock = 0
    tickUntil(game, () => hut.meatStock === 20)
})

test('restores the clock and starts new hunts only during daytime', () => {
    const { game, hunter, deer } = fixture()
    const prey = deer()
    game.setTimeOfDay(23 * 60 + 30)
    game.tick(60_000)
    expect(game.timeOfDay).toBe(30)
    expect(hunter.preyId).toBeUndefined()

    const save = game.toJSON()
    expect(Game.fromJSON(save).timeOfDay).toBe(30)
    delete save.timeOfDay
    expect(Game.fromJSON(save).timeOfDay).toBe(8 * 60)

    game.setTimeOfDay(6 * 60)
    game.tick()
    expect(hunter.preyId).toBe(prey.id)
})
