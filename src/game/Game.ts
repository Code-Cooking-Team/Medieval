import { config } from '+config/config'
import { Player, PlayerJSON } from '+game/player/types'
import { distanceBetweenPoints, removeArrayItem } from '+helpers'
import { Emitter } from '+lib/Emitter'

import { actorByType, actorFromJSON } from './actors'
import { ConstructionSiteActor } from './actors/buildings/construction/ConstructionSiteActor'
import { ConstructionType } from './actors/buildings/construction/costs'
import type { WoodCampActor } from './actors/buildings/woodCamp/WoodCampActor'
import { BushActor } from './actors/flora/bush/BushActor'
import { isBuildingActor, isHumanActor, isWalkableActor } from './actors/helpers'
import type { HumanActor } from './actors/units/human/HumanActor'
import { Actor, ActorClass, ActorJSON } from './core/Actor'
import { BuildingActor } from './core/BuildingActor'
import { Pathfinding } from './core/Pathfinding'
import { playerFromJSON } from './player'
import { HumanPlayer } from './player/HumanPlayer'
import { ActorBlueprint, ActorType, Position } from './types'
import { TileClass } from './world/Tile'
import { applyTileGrid } from './world/tileCodes'
import { WordJSON, World } from './world/World'

export class Game {
    public pf: Pathfinding
    public actors: Actor[] = []
    loop: any

    public emitter = new Emitter<{
        tick: undefined
        actorAdded: Actor
        actorRemoved: Actor
        equipmentChanged: HumanActor
        woodStockChanged: WoodCampActor
        constructionProgress: ConstructionSiteActor
        professionChanged: HumanActor
        started: undefined
        stopped: undefined
    }>('Game')

    constructor(
        public world: World,
        public players: Player[],
    ) {
        this.pf = new Pathfinding(world)
    }

    public start(): void {
        this.emitter.emit('started')

        this.loop = setInterval(() => {
            this.tick()
        }, config.core.tickTime)

        this.world.emitter.on('tailUpdate', this.handleTailUpdate)
    }

    public stop(): void {
        this.emitter.emit('stopped')
        clearInterval(this.loop)
        this.loop = undefined

        this.world.emitter.off('tailUpdate', this.handleTailUpdate)
    }

    public tick(): void {
        this.pf.tick()
        this.actors.forEach((actor) => {
            actor.tick()
        })
        this.emitter.emit('tick')
    }

    public addActor(actor: Actor): void {
        this.actors.push(actor)
        this.emitter.emit('actorAdded', actor)
    }

    public removeActor(actor: Actor): void {
        const index = this.actors.indexOf(actor)
        if (index === -1) return

        if (actor instanceof ConstructionSiteActor) actor.unassign()
        if (isBuildingActor(actor)) {
            if (!(actor instanceof ConstructionSiteActor)) {
                this.restoreBuildingTerrain(actor, index)
            }
            for (const unit of this.actors.filter(isHumanActor)) {
                if (unit.home === actor) unit.home = undefined
                if (unit.target === actor) {
                    unit.target = undefined
                    unit.cancelPath()
                }
            }
        }

        removeArrayItem(this.actors, actor)
        for (const player of this.players) {
            if (player instanceof HumanPlayer && player.selectedActors.includes(actor)) {
                if (player.constructionBuilder === actor) player.unselectBuilding()
                player.selectActors(
                    player.selectedActors.filter((selected) => selected !== actor),
                )
            }
        }
        this.pf.update()
        this.emitter.emit('actorRemoved', actor)
    }

    public getActorById(id: string): Actor | undefined {
        return this.actors.find((actor) => actor.id === id)
    }

    public findActorByRange(
        position: Position,
        range: number,
        additionalCondition?: (actor: Actor) => boolean,
    ): Actor | undefined {
        return this.actors.find((actor) => {
            if (distanceBetweenPoints(actor.position, position) > range) return false
            return additionalCondition?.(actor) ?? true
        })
    }

    public findActorsByType(type: ActorType, isAlive = true): Actor[] {
        return this.actors.filter((actor) => {
            if (isAlive && actor.isDead()) return false
            return actor.type === type
        })
    }

    public findActorsByPosition(
        position: Position,
        range: number,
        isAlive = true,
    ): Actor[] {
        return this.actors.filter((actor) => {
            if (isAlive && actor.hp <= 0) return false
            return distanceBetweenPoints(actor.position, position) <= range
        })
    }

    public findClosestActorByType(
        type: ActorType,
        position: Position,
        isAlive = true,
    ): Actor | undefined {
        const actors = this.findActorsByType(type, isAlive)
        if (!actors[0]) return

        return actors.reduce((prev, curr) => {
            const prevDist = distanceBetweenPoints(prev.position, position)
            const currDist = distanceBetweenPoints(curr.position, position)

            return currDist < prevDist ? curr : prev
        }, actors[0])
    }

    public spawnActor<T extends Actor>(
        ActorClass: ActorClass<T>,
        player: Player,
        position: Position,
        rotation: number = 0,
        seed?: number,
    ): T | undefined {
        const tile = this.world.hasTile(position)
        if (!tile) return

        const actor = new ActorClass(this, player, position)
        if (isWalkableActor(actor) && !tile.canWalk) return
        if (actor.type === ActorType.Bush && !BushActor.growsOn(tile.type)) return
        if (isBuildingActor(actor)) {
            if (!this.canPlaceBuildings(actor.blueprint, [position], rotation)) return
            actor.setRotation(rotation)
            this.placeBuilding(actor)
        }
        if (seed !== undefined) actor.seed = seed
        this.addActor(actor)
        return actor
    }

    public canPlaceBuildings(
        blueprint: ActorBlueprint,
        positions: Position[],
        rotation: number,
    ) {
        const proposed = new Set<string>()
        for (const position of positions) {
            for (const [tilePosition] of this.buildingTiles(
                blueprint,
                position,
                rotation,
            )) {
                const key = tilePosition.join(',')
                if (proposed.has(key) || !this.world.hasTile(tilePosition)?.canBuild) {
                    return false
                }
                proposed.add(key)
            }
        }

        // Some footprint tiles, including those in old saves, are buildable paths.
        return !this.actors
            .filter(isBuildingActor)
            .some((actor) =>
                this.buildingTiles(actor.blueprint, actor.position, actor.rotation).some(
                    ([position]) => proposed.has(position.join(',')),
                ),
            )
    }

    public placeConstructionSites(
        builder: HumanActor,
        type: ConstructionType,
        placements: { position: Position; seed?: number }[],
        rotation: number,
    ) {
        if (builder.isDead() || this.getActorById(builder.id) !== builder) return false
        const blueprint = actorByType[type].blueprint!
        if (
            !this.canPlaceBuildings(
                blueprint,
                placements.map(({ position }) => position),
                rotation,
            )
        ) {
            return false
        }

        const sites = placements.map(({ position, seed }) => {
            const site = new ConstructionSiteActor(this, builder.player, position)
            site.setBuildingType(type)
            site.setRotation(rotation)
            if (seed !== undefined) site.seed = seed
            return site
        })
        for (const site of sites) {
            this.addActor(site)
            site.assign(builder)
        }
        return true
    }

    public completeConstruction(site: ConstructionSiteActor) {
        const index = this.actors.indexOf(site)
        if (index === -1 || site.remainingWood > 0) return
        const { actorClass } = actorByType[site.buildingType]
        const building = new actorClass(this, site.player, site.position)
        if (!isBuildingActor(building))
            throw new Error(`Invalid construction type: ${site.buildingType}`)
        building.setRotation(site.rotation)
        building.seed = site.seed

        site.unassign()
        this.actors[index] = building
        this.placeBuilding(building)
        this.emitter.emit('actorRemoved', site)
        this.emitter.emit('actorAdded', building)
        for (const player of this.players) {
            if (player instanceof HumanPlayer && player.selectedActors.includes(site)) {
                player.selectActors(
                    player.selectedActors.map((actor) =>
                        actor === site ? building : actor,
                    ),
                )
            }
        }
    }

    public getBuildingApproaches(actor: BuildingActor) {
        const tiles = this.buildingTiles(actor.blueprint, actor.position, actor.rotation)
        const [[left, top]] = tiles[0]!
        const [[right, bottom]] = tiles[tiles.length - 1]!
        const positions: Position[] = []
        for (let x = left; x <= right; x++) {
            positions.push([x, top - 1], [x, bottom + 1])
        }
        for (let y = top; y <= bottom; y++) {
            positions.push([left - 1, y], [right + 1, y])
        }
        return positions
    }

    private placeBuilding(actor: BuildingActor) {
        this.world.setMultipleTiles((set, get) => {
            const { height } = get(actor.position)
            for (const [position, TileClass] of this.buildingTiles(
                actor.blueprint,
                actor.position,
                actor.rotation,
            )) {
                const tile = new TileClass(get(position))
                tile.height = height
                set(position, tile)
            }
        })
        if (!this.loop) this.pf.update()
    }

    private buildingTiles(blueprint: ActorBlueprint, [x, y]: Position, rotation: number) {
        const tiles: [Position, TileClass][] = []
        applyTileGrid(
            blueprint.getGrid(),
            ([localX, localY], TileClass, [centerX, centerY]) => {
                tiles.push([[x + localX - centerX, y + localY - centerY], TileClass])
            },
            rotation,
        )
        return tiles
    }

    private restoreBuildingTerrain(actor: BuildingActor, index: number) {
        // Later buildings may have placed their own tiles over this footprint.
        const layersAbove = new Map<string, number>()
        for (const building of this.actors.slice(index + 1).filter(isBuildingActor)) {
            for (const [position] of this.buildingTiles(
                building.blueprint,
                building.position,
                building.rotation,
            )) {
                const key = position.join(',')
                layersAbove.set(key, (layersAbove.get(key) ?? 0) + 1)
            }
        }

        this.world.setMultipleTiles((set, get) => {
            for (const [position, TileClass] of this.buildingTiles(
                actor.blueprint,
                actor.position,
                actor.rotation,
            )) {
                if (!this.world.hasTile(position)) continue
                let tile = get(position)
                let above: typeof tile | undefined
                const depth = layersAbove.get(position.join(',')) ?? 0

                let layer = 0
                for (; layer < depth && tile.previousTile; layer++) {
                    above = tile
                    tile = tile.previousTile
                }

                if (layer !== depth || !(tile instanceof TileClass) || !tile.previousTile)
                    continue
                if (above) above.previousTile = tile.previousTile
                else set(position, tile.previousTile)
            }
        })
    }

    public toJSON(): GameJSON {
        return {
            world: this.world.toJSON(),
            constructionTerrainDeferred: true,
            players: this.players.map((player) => player.toJSON()),
            actors: this.actors.map((actor) => actor.toJSON()),
        }
    }

    static fromJSON(json: GameJSON) {
        const world = World.fromJSON(json.world)
        const players = json.players.map((player) => playerFromJSON(player))

        const game = new Game(world, players)

        game.actors = json.actors.map((actorJson) => {
            const player = players.find((player) => player.id === actorJson.playerId)
            if (!player) {
                throw new Error(`Player not found [ID: ${actorJson.playerId}]`)
            }
            return actorFromJSON(actorJson, game, player)
        })

        if (!json.constructionTerrainDeferred) {
            // Older saves applied the finished terrain when the site was placed.
            game.actors.forEach((actor, index) => {
                if (actor instanceof ConstructionSiteActor) {
                    game.restoreBuildingTerrain(actor, index)
                }
            })
            if (world.tileRevision) game.pf.update()
        }

        return game
    }

    private handleTailUpdate = () => {
        this.pf.update()
    }
}

export interface GameJSON {
    world: WordJSON
    constructionTerrainDeferred?: true
    players: PlayerJSON[]
    actors: ActorJSON[]
}
