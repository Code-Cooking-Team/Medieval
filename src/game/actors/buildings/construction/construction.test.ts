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
            for (const name of ['lod1', 'lod2', 'lod3']) {
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
    camp.collectTree(200)
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
    expect(loadedHouse.assignedBuilder).toBe(loadedHuman)
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
    human.setProfession(new GuardianProfession(game, human))
    expect(site.assignedBuilder).toBeUndefined()

    const replacement = game.spawnActor(HumanActor, player, [16, 23])!
    expect(site.interact([replacement])).toBe(true)
    expect(site.interact([human])).toBe(false)
    expect(site.assignedBuilder).toBe(replacement)
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
