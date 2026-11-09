import { config } from '+config'
import '+game/actors'
import { HouseActor } from '+game/actors/buildings/house/HouseActor'
import { WoodCampActor } from '+game/actors/buildings/woodCamp/WoodCampActor'
import { HumanActor } from '+game/actors/units/human/HumanActor'
import { Game } from '+game/Game'
import { HumanPlayer } from '+game/player/HumanPlayer'
import { BuilderProfession } from '+game/professions/BuilderProfession'
import { GuardianProfession } from '+game/professions/GuardianProfession'
import { ActorType, Position } from '+game/types'
import { Tile, WallTile } from '+game/world/Tile'
import { World } from '+game/world/World'

import { ConstructionSiteActor } from './ConstructionSiteActor'
import { ConstructionType } from './costs'

vi.mock('+helpers/three', async (importOriginal) => {
    const { Group } = await import('three')
    return {
        ...(await importOriginal<typeof import('+helpers/three')>()),
        loadGLTF: async () => {
            const model = new Group()
            for (const name of [
                'lod1',
                'lod2',
                'lod3',
                'lod_near',
                'lod_far',
                'lod_very_far',
            ]) {
                const level = new Group()
                level.name = name
                model.add(level)
            }
            return model
        },
    }
})

const fixture = () => {
    const player = new HumanPlayer()
    const world = new World(
        Array.from({ length: 42 }, () => Array.from({ length: 52 }, () => new Tile())),
    )
    const game = new Game(world, [player])
    const human = game.spawnActor(HumanActor, player, [15, 21])!
    const camp = game.spawnActor(WoodCampActor, player, [10, 20])!
    const sites = (type: ConstructionType, positions: Position[], rotation = 0) => {
        expect(
            game.placeConstructionSites(
                human,
                type,
                positions.map((position) => ({ position })),
                rotation,
            ),
        ).toBe(true)
        return game.findActorsByType(
            ActorType.ConstructionSite,
        ) as ConstructionSiteActor[]
    }
    return { game, player, human, camp, sites }
}

beforeEach(() => {
    config.movement.unitCollision = 'Detour'
    config.movement.collisionWaitAttempts = 3
    config.movement.alternateDetourExtraPercent = 10
    config.movement.spreadOutWhenIdle = true
})

function tickUntil(game: Game, done: () => boolean) {
    for (let tick = 0; tick < 200 && !done(); tick++) game.tick()
    expect(done()).toBe(true)
}

test('reserves the rotated footprint and completes a house after partial deliveries and reload', () => {
    const { game, human, camp, sites, player } = fixture()
    const [house] = sites(ActorType.House, [[24, 20]], 1) as [ConstructionSiteActor]
    expect(game.spawnActor(HouseActor, player, [28, 22])).toBeUndefined()
    expect(
        game.placeConstructionSites(
            human,
            ActorType.Stakewall,
            [{ position: [30, 20] }, { position: [28, 20] }],
            0,
        ),
    ).toBe(false)
    expect(game.findActorsByType(ActorType.ConstructionSite)).toEqual([house])

    const builder = human.profession as BuilderProfession
    expect(human.getEquippedItem('Hands')).toBe('hammer')
    camp.collectTree(200)
    tickUntil(game, () => builder.carriedWood === 150)
    expect(camp.woodStock).toBe(50)
    tickUntil(game, () => house.deliveredWood > 0)
    expect(house.deliveredWood).toBe(2)
    expect(builder.carriedWood).toBe(148)
    expect(human.lastAction).toMatchObject({ kind: 'build', target: house.position })
    expect(house.hp).toBe(house.maxHp)
    game.tick()
    expect(house.deliveredWood).toBe(4)
    expect(builder.carriedWood).toBe(146)
    tickUntil(game, () => house.deliveredWood === 150)
    tickUntil(game, () => house.deliveredWood === 200)
    expect(camp.woodStock).toBe(0)
    camp.collectTree(175)
    tickUntil(game, () => builder.carriedWood === 100)

    const loaded = Game.fromJSON(JSON.parse(JSON.stringify(game.toJSON())))
    const loadedHuman = loaded.getActorById(human.id) as HumanActor
    const loadedBuilder = loadedHuman.profession as BuilderProfession
    const loadedHouse = loaded.getActorById(house.id) as ConstructionSiteActor
    expect(loadedBuilder.queue).toEqual([house.id])
    expect(loadedBuilder.carriedWood).toBe(100)
    expect(loadedHouse.isAssignedTo(loadedBuilder)).toBe(true)
    expect(loadedHouse.deliveredWood).toBe(200)
    expect((loaded.getActorById(camp.id) as WoodCampActor).woodStock).toBe(75)
    tickUntil(loaded, () => loadedBuilder.queue.length === 0)
    const completed = loaded.findActorsByType(ActorType.House)[0] as HouseActor
    expect(completed.position).toEqual(house.position)
    expect(completed.rotation).toBe(1)
    expect(completed.traits).toHaveLength(1)
    expect(loaded.world.getTile(completed.getSpawnPosition()).canWalk).toBe(true)
})

test('skips an unreachable site, then retries it after the next site completes', () => {
    const { game, human, camp, sites } = fixture()
    const [blocked, reachable] = sites(ActorType.Stakewall, [
        [31, 20],
        [18, 20],
    ]) as [ConstructionSiteActor, ConstructionSiteActor]
    const barrier = game.world.tiles.map((row, y) => ({
        position: [28, y] as Position,
        tile: row[28]!,
    }))
    game.world.setMultipleTiles((set) =>
        barrier.forEach(({ position }) => set(position, new WallTile())),
    )
    camp.collectTree(60)
    tickUntil(game, () => !game.getActorById(reachable.id))
    expect(blocked.deliveredWood).toBe(0)
    expect((human.profession as BuilderProfession).queue).toEqual([blocked.id])
    game.world.setMultipleTiles((set) =>
        barrier.forEach(({ position, tile }) => set(position, tile)),
    )
    tickUntil(game, () => !game.getActorById(blocked.id))
    expect(camp.woodStock).toBe(0)
})

test('reassigns existing progress and returns a load after the last site is removed', () => {
    const { game, player, human, camp, sites } = fixture()
    const [site] = sites(ActorType.House, [[24, 20]]) as [ConstructionSiteActor]
    camp.collectTree(150)
    tickUntil(game, () => site.deliveredWood === 150)
    const previousBuilder = human.profession as BuilderProfession
    human.setProfession(new GuardianProfession(game, human))
    expect(site.isAssignedTo(previousBuilder)).toBe(false)

    const replacement = game.spawnActor(HumanActor, player, [16, 23])!
    expect(site.interact([replacement])).toBe(true)
    expect(site.isAssignedTo(replacement.profession as BuilderProfession)).toBe(true)
    expect(site.deliveredWood).toBe(150)
    camp.collectTree(150)
    const builder = replacement.profession as BuilderProfession
    tickUntil(game, () => builder.carriedWood === 150)
    game.removeActor(site)
    expect(builder.queue).toEqual([])
    expect(game.world.getTile(site.position).previousTile).toBeUndefined()
    tickUntil(game, () => builder.carriedWood === 0)
    expect(camp.woodStock).toBe(150)
    expect(game.findActorsByType(ActorType.House)).toHaveLength(0)
})

test('two builders can share a site without duplicating it in either queue', () => {
    const { game, player, human, sites } = fixture()
    const [site] = sites(ActorType.Stakewall, [[19, 20]]) as [ConstructionSiteActor]
    human.position = [18, 20]
    const second = game.spawnActor(HumanActor, player, [20, 20])!
    expect(site.interact([second])).toBe(true)
    expect(site.interact([second])).toBe(true)
    const firstBuilder = human.profession as BuilderProfession
    const secondBuilder = second.profession as BuilderProfession
    expect(firstBuilder.queue).toEqual([site.id])
    expect(secondBuilder.queue).toEqual([site.id])

    firstBuilder.carriedWood = 15
    secondBuilder.carriedWood = 15
    game.tick()
    expect(site.deliveredWood).toBe(4)
    tickUntil(game, () => !game.getActorById(site.id))
    expect(firstBuilder.queue).toEqual([])
    expect(secondBuilder.queue).toEqual([])
})

test('a stakewall site reserves its footprint while keeping the tile walkable', () => {
    const { game, player, human, sites } = fixture()
    const position: Position = [19, 20]
    const terrain = game.world.getTile(position)
    const [site] = sites(ActorType.Stakewall, [position]) as [ConstructionSiteActor]
    expect(game.world.getTile(position)).toBe(terrain)
    expect(game.world.getTile(position).canWalk).toBe(true)
    expect(game.canPlaceBuildings(site.blueprint, [position], 0)).toBe(false)

    const walker = game.spawnActor(HumanActor, player, [18, 20])!
    walker.path = [
        { x: 19, y: 20 },
        { x: 20, y: 20 },
    ]
    walker.move()
    walker.move()
    expect(walker.position).toEqual([20, 20])

    const builder = human.profession as BuilderProfession
    expect(site.deliver(builder, 30)).toBe(30)
    expect(game.world.getTile(position).canWalk).toBe(false)
    walker.path = [{ x: 19, y: 20 }]
    walker.move()
    expect(walker.position).toEqual([20, 20])
})

test('two units cannot enter the same tile and the waiting unit keeps its step', () => {
    const { game, player, human } = fixture()
    const second = game.spawnActor(HumanActor, player, [17, 21])!
    human.path = [
        { x: 16, y: 21 },
        { x: 16, y: 22 },
    ]
    second.path = [{ x: 16, y: 21 }]

    game.tick()
    expect(human.position).toEqual([16, 21])
    expect(second.position).toEqual([17, 21])
    expect(second.path).toEqual([{ x: 16, y: 21 }])
    expect(game.spawnActor(HumanActor, player, [16, 21])).toBeUndefined()

    game.tick()
    expect(human.position).toEqual([16, 22])
    expect(second.position).toEqual([16, 21])
    expect(second.path).toEqual([])
})

test('a builder waits for an occupied camp entrance before collecting wood', () => {
    const { game, player, human, camp, sites } = fixture()
    sites(ActorType.Stakewall, [[19, 20]])
    camp.collectTree(30)
    const entrance = camp.getDeliveryPosition()
    const blocker = game.spawnActor(HumanActor, player, entrance)!
    const builder = human.profession as BuilderProfession

    for (let tick = 0; tick < 20; tick++) game.tick()
    expect(human.position).not.toEqual(entrance)
    expect(builder.carriedWood).toBe(0)

    game.removeActor(blocker)
    tickUntil(game, () => builder.carriedWood > 0)
    expect(human.position).toEqual(entrance)
})

test('stacked units spread out after finishing their move when enabled', () => {
    const { game, player, human } = fixture()
    const stationary = game.spawnActor(HumanActor, player, [16, 21])!
    human.path = [{ x: 16, y: 21 }]
    config.movement.unitCollision = 'Off'

    game.tick()
    expect(human.position).toEqual(stationary.position)

    config.movement.spreadOutWhenIdle = false
    game.tick()
    expect(human.position).toEqual(stationary.position)

    config.movement.spreadOutWhenIdle = true
    game.tick()
    expect(human.position).not.toEqual(stationary.position)
    expect(stationary.position).toEqual([16, 21])
})

test('an idle stack can reach a nearby free tile through a ring of units', () => {
    const { game, player, human } = fixture()
    config.movement.unitCollision = 'Off'
    game.spawnActor(HumanActor, player, human.position)
    for (const x of [14, 15, 16]) {
        for (const y of [20, 21, 22]) {
            if (x !== 15 || y !== 21) game.spawnActor(HumanActor, player, [x, y])
        }
    }

    game.tick()
    const units = game.findActorsByType(ActorType.Human)
    expect(new Set(units.map((unit) => unit.position.join(','))).size).toBe(9)

    game.tick()
    expect(new Set(units.map((unit) => unit.position.join(','))).size).toBe(10)
})

test.each([0, 3, 5])('detour uses the configured wait of %i blocked attempts', (wait) => {
    const { game, player, human } = fixture()
    const blocker = game.spawnActor(HumanActor, player, [16, 21])!
    human.path = [
        { x: 16, y: 21 },
        { x: 17, y: 21 },
        { x: 18, y: 21 },
    ]

    config.movement.collisionWaitAttempts = wait
    for (let attempt = 1; attempt < wait; attempt++) {
        game.tick()
        expect(human.path[0]).toEqual({ x: 16, y: 21 })
    }

    game.tick()
    expect(human.position).toEqual([15, 21])
    expect(human.path).not.toContainEqual({ x: 16, y: 21 })

    tickUntil(game, () => !human.hasPath())
    expect(human.position).toEqual([18, 21])
    expect(blocker.position).toEqual([16, 21])
})

test.each(['Off', 'Wait'] as const)(
    '%s collision mode controls occupied steps',
    (mode) => {
        const { game, player, human } = fixture()
        game.spawnActor(HumanActor, player, [16, 21])
        human.path = [
            { x: 16, y: 21 },
            { x: 17, y: 21 },
        ]
        config.movement.unitCollision = mode

        for (let tick = 0; tick < 5; tick++) game.tick()

        expect(human.position).toEqual(mode === 'Off' ? [17, 21] : [15, 21])
        expect(human.path).toHaveLength(mode === 'Off' ? 0 : 2)
    },
)

test.each([0, 1, 3])('overlap mode waits %i attempts before sharing the tile', (wait) => {
    const { game, player, human } = fixture()
    const blocker = game.spawnActor(HumanActor, player, [16, 21])!
    const findDetour = vi.spyOn(game, 'findUnitDetour')
    human.path = [
        { x: 16, y: 21 },
        { x: 17, y: 21 },
    ]
    config.movement.unitCollision = 'Overlap + sidestep'
    config.movement.collisionWaitAttempts = wait

    for (let attempt = 0; attempt < wait; attempt++) {
        game.tick()
        expect(human.position).toEqual([15, 21])
    }
    game.tick()
    expect(human.position).toEqual(blocker.position)
    const random = vi.spyOn(Math, 'random').mockReturnValueOnce(0)
    game.tick()
    random.mockRestore()
    expect(human.position).not.toEqual(blocker.position)
    expect(human.position).not.toEqual([17, 21])
    expect(human.path).toEqual([{ x: 17, y: 21 }])
    game.tick()
    expect(human.position).toEqual([17, 21])
    expect(findDetour).not.toHaveBeenCalled()
})

test.each([10, 34])(
    'alternate mode compares a four-step detour to a three-step route with a %i%% limit',
    (limit) => {
        const { game, player, human } = fixture()
        for (const y of [20, 21, 22]) game.spawnActor(HumanActor, player, [16, y])
        human.path = [
            { x: 16, y: 21 },
            { x: 17, y: 21 },
            { x: 18, y: 21 },
        ]
        config.movement.unitCollision = 'Alternate'
        config.movement.collisionWaitAttempts = 1
        config.movement.alternateDetourExtraPercent = limit

        game.tick()
        expect(human.position).toEqual([15, 21])
        game.tick()
        if (limit === 10) {
            expect(human.position).toEqual([16, 21])
            expect(human.path).toHaveLength(2)
        } else {
            expect(human.position).toEqual([15, 21])
            expect(human.path).toHaveLength(4)
        }

        tickUntil(game, () => !human.hasPath())
        expect(human.position).toEqual([18, 21])
    },
)

test('alternate mode pushes through a crowd when there is no detour', () => {
    const { game, player, human } = fixture()
    game.world.setTile([14, 21], new WallTile())
    for (const x of [15, 16, 17, 18]) {
        game.world.setTile([x, 20], new WallTile())
        game.world.setTile([x, 22], new WallTile())
    }
    game.spawnActor(HumanActor, player, [16, 21])
    game.spawnActor(HumanActor, player, [17, 21])
    human.path = [
        { x: 16, y: 21 },
        { x: 17, y: 21 },
        { x: 18, y: 21 },
    ]
    config.movement.unitCollision = 'Alternate'
    config.movement.collisionWaitAttempts = 1
    const findDetour = vi.spyOn(game, 'findUnitDetour')

    game.tick()
    expect(human.position).toEqual([15, 21])
    expect(findDetour).not.toHaveBeenCalled()

    game.tick()
    expect(human.position).toEqual([16, 21])
    expect(findDetour).toHaveBeenCalledTimes(1)

    game.tick()
    expect(human.position).toEqual([16, 21])
    game.tick()
    expect(human.position).toEqual([17, 21])
    expect(findDetour).toHaveBeenCalledTimes(2)
    tickUntil(game, () => !human.hasPath())
    expect(human.position).toEqual([18, 21])
})

test('overlapping units never step back when only the tile behind is free', () => {
    const { game, player, human } = fixture()
    game.spawnActor(HumanActor, player, [16, 21])
    const ahead = game.spawnActor(HumanActor, player, [17, 21])!
    for (const x of [15, 16, 17]) {
        game.world.setTile([x, 20], new WallTile())
        game.world.setTile([x, 22], new WallTile())
    }
    human.path = [
        { x: 16, y: 21 },
        { x: 17, y: 21 },
    ]
    config.movement.unitCollision = 'Overlap + sidestep'
    config.movement.collisionWaitAttempts = 1

    game.tick()
    game.tick()
    game.tick()
    expect(human.position).toEqual([16, 21])
    expect(human.path).toEqual([{ x: 17, y: 21 }])

    game.removeActor(ahead)
    game.tick()
    expect(human.position).toEqual([17, 21])
    expect(human.path).toEqual([])
})

test('an order through a dense crowd continues when every sidestep is occupied', async () => {
    const { game, player, human } = fixture()
    human.position = [20, 21]
    const crowd: Position[] = [
        [18, 20],
        [19, 20],
        [18, 21],
        [19, 21],
        [18, 22],
        [19, 22],
    ]
    for (const position of crowd) game.spawnActor(HumanActor, player, position)
    config.movement.unitCollision = 'Overlap + sidestep'
    config.movement.collisionWaitAttempts = 1

    const order = human.setPathTo([17, 21])
    game.pf.tick()
    await order

    game.tick()
    game.tick()
    expect(human.position).toEqual([19, 21])
    game.tick()
    expect(human.position).toEqual([19, 21])
    game.tick()
    expect(human.position).toEqual([18, 21])
    tickUntil(game, () => !human.hasPath())
    expect(human.position).toEqual([17, 21])
})

test('loads unfinished legacy footprints as walkable terrain', () => {
    const { game, human, sites } = fixture()
    const [site] = sites(ActorType.Stakewall, [[19, 20]]) as [ConstructionSiteActor]
    const snapshot = game.toJSON()
    delete snapshot.constructionTerrainDeferred
    snapshot.world.tiles[20]![19] = new WallTile(
        game.world.getTile(site.position),
    ).toJSON()

    const loaded = Game.fromJSON(snapshot)
    const loadedSite = loaded.getActorById(site.id) as ConstructionSiteActor
    const builder = (loaded.getActorById(human.id) as HumanActor)
        .profession as BuilderProfession
    expect(loaded.world.getTile(site.position).canWalk).toBe(true)
    expect(loadedSite.isAssignedTo(builder)).toBe(true)
    expect(loaded.canPlaceBuildings(loadedSite.blueprint, [site.position], 0)).toBe(false)
})

test('group placement converts every worker and appends the same ordered sites', () => {
    const { game, player, human, sites } = fixture()
    const [previous] = sites(ActorType.Stakewall, [[19, 20]])
    const second = game.spawnActor(HumanActor, player, [16, 23])!
    second.setProfession(new GuardianProfession(game, second))
    player.selectActors([human, second])
    player.selectBuilding(ActorType.Stakewall, [human, second])
    expect(
        game.placeConstructionSites(
            player.constructionBuilders,
            ActorType.Stakewall,
            [{ position: [21, 20] }, { position: [22, 20] }],
            0,
        ),
    ).toBe(true)
    const ids = game.findActorsByType(ActorType.ConstructionSite).map((site) => site.id)
    expect((human.profession as BuilderProfession).queue).toEqual(ids)
    expect((second.profession as BuilderProfession).queue).toEqual(
        ids.filter((id) => id !== previous!.id),
    )
    expect(second.getEquippedItem('Hands')).toBe('hammer')
    game.removeActor(human)
    expect(player.constructionBuilders).toEqual([second])
    expect(player.selectedBuilding).toBe(ActorType.Stakewall)
    player.unselectBuilding()
    expect(player.constructionBuilders).toEqual([])
})
