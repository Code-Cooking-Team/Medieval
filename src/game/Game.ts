import { config } from '+config/config'
import { Player, PlayerJSON } from '+game/player/types'
import { distanceBetweenPoints, removeArrayItem } from '+helpers'
import { Emitter } from '+lib/Emitter'

import { actorByType, actorFromJSON } from './actors'
import { ConstructionSiteActor } from './actors/buildings/construction/ConstructionSiteActor'
import { ConstructionType } from './actors/buildings/construction/costs'
import type { GuildhallActor } from './actors/buildings/guildhall/GuildhallActor'
import type { HunterHutActor } from './actors/buildings/hunterHut/HunterHutActor'
import { BushActor } from './actors/flora/bush/BushActor'
import { isBuildingActor, isHumanActor, isWalkableActor } from './actors/helpers'
import type { HumanActor } from './actors/units/human/HumanActor'
import { Actor, ActorClass, ActorJSON } from './core/Actor'
import { BuildingActor } from './core/BuildingActor'
import { Pathfinding } from './core/Pathfinding'
import type { WoodStorageBuilding } from './core/WoodStorageBuilding'
import { playerFromJSON } from './player'
import { HumanPlayer } from './player/HumanPlayer'
import { ActorBlueprint, ActorType, Position } from './types'
import { createTerrainNoise, smooth } from './world/terrainNoise'
import { InsideTile, Tile, TileClass, WallTile, WaterTile } from './world/Tile'
import { applyTileGrid } from './world/tileCodes'
import { TileType } from './world/types'
import { SHORE_OVERLAP } from './world/water'
import { WordJSON, World } from './world/World'

const BUILDING_APRON_RADIUS = 5
const occupiesBuildingSpace = (TileClass: TileClass) =>
    TileClass === WallTile || TileClass === InsideTile || TileClass === WaterTile

export class Game {
    public pf: Pathfinding
    public actors: Actor[] = []
    loop: any

    public emitter = new Emitter<{
        tick: undefined
        actorAdded: Actor
        actorRemoved: Actor
        equipmentChanged: HumanActor
        woodStockChanged: WoodStorageBuilding
        meatStockChanged: HunterHutActor | GuildhallActor
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

        if (isWalkableActor(actor)) actor.cancelPath()
        if (actor instanceof ConstructionSiteActor) actor.unassign()
        if (isBuildingActor(actor)) {
            if (!(actor instanceof ConstructionSiteActor)) {
                this.restoreBuildingTerrain(actor)
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
                if (player.constructionBuilders.includes(actor as HumanActor)) {
                    player.constructionBuilders = player.constructionBuilders.filter(
                        (builder) => builder !== actor,
                    )
                    if (!player.constructionBuilders.length) player.unselectBuilding()
                }
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
        if (seed !== undefined) actor.seed = seed
        if (isWalkableActor(actor) && !tile.canWalk) return
        if (actor.type === ActorType.Bush && !BushActor.growsOn(tile.type)) return
        if (
            actor.type === ActorType.Tree &&
            this.actors.some(
                (site) =>
                    site instanceof ConstructionSiteActor &&
                    this.buildingTiles(site.blueprint, site.position, site.rotation).some(
                        ([[x, y], TileClass]) =>
                            x === position[0] &&
                            y === position[1] &&
                            occupiesBuildingSpace(TileClass),
                    ),
            )
        )
            return
        if (isBuildingActor(actor)) {
            if (!this.canPlaceBuildings(actor.blueprint, [position], rotation)) return
            actor.setRotation(rotation)
            this.placeBuilding(actor)
        }
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
            if (!this.world.hasTile(position)) return false
            for (const [tilePosition, TileClass] of this.buildingTiles(
                blueprint,
                position,
                rotation,
            )) {
                if (!occupiesBuildingSpace(TileClass)) continue
                const key = tilePosition.join(',')
                const tile = this.world.hasTile(tilePosition)
                if (proposed.has(key) || !tile?.canBuild || !tile.canWalk) return false
                proposed.add(key)
            }
        }

        return !this.actors.some((actor) => {
            if (actor.type === ActorType.Tree)
                return proposed.has(actor.position.join(','))
            return (
                isBuildingActor(actor) &&
                this.buildingTiles(actor.blueprint, actor.position, actor.rotation).some(
                    ([position, TileClass]) =>
                        occupiesBuildingSpace(TileClass) &&
                        proposed.has(position.join(',')),
                )
            )
        })
    }

    public placeConstructionSites(
        builders: HumanActor | HumanActor[],
        type: ConstructionType,
        placements: { position: Position; seed?: number }[],
        rotation: number,
    ) {
        const available = (Array.isArray(builders) ? builders : [builders]).filter(
            (builder) => !builder.isDead() && this.getActorById(builder.id) === builder,
        )
        const builder = available[0]
        if (!builder) return false
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
            for (const worker of available) site.assign(worker)
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
        const footprint = this.buildingTiles(
            actor.blueprint,
            actor.position,
            actor.rotation,
        )
        const [[left, top]] = footprint[0]!
        const [[right, bottom]] = footprint[footprint.length - 1]!
        const noise = createTerrainNoise(actor.seed)
        const variationAt = (x: number, y: number) => noise.sample(x / 4.5, y / 4.5)
        const terrainApron: [Position, number][] = []
        actor.terrainApron = terrainApron
        const trees = new Set(
            this.actors
                .filter(({ type }) => type === ActorType.Tree)
                .map(({ position }) => position.join(',')),
        )
        this.world.setMultipleTiles((set, get) => {
            const { height } = get(actor.position)
            const maxRelief = actor.blueprint.height * 0.28
            for (const [position, TileClass] of footprint) {
                const ground = this.world.hasTile(position)
                if (!ground?.canBuild || !ground.canWalk || trees.has(position.join(',')))
                    continue
                if (!occupiesBuildingSpace(TileClass) && ground.previousTile) continue
                const tile = new TileClass(ground)
                tile.buildingId = actor.id
                const relief =
                    (ground.height - height) * (0.25 + 0.15 * variationAt(...position))
                tile.height = height + maxRelief * Math.tanh(relief / maxRelief)
                set(position, tile)
            }
            for (
                let y = top - BUILDING_APRON_RADIUS;
                y <= bottom + BUILDING_APRON_RADIUS;
                y++
            ) {
                for (
                    let x = left - BUILDING_APRON_RADIUS;
                    x <= right + BUILDING_APRON_RADIUS;
                    x++
                ) {
                    const edge: Position = [
                        Math.max(left, Math.min(right, x)),
                        Math.max(top, Math.min(bottom, y)),
                    ]
                    const distance = Math.hypot(x - edge[0], y - edge[1])
                    if (distance === 0) continue

                    const variation = variationAt(x, y)
                    const reach = 3.8 + 0.7 * variation
                    if (distance >= reach) continue

                    const position: Position = [x, y]
                    const tile = this.world.hasTile(position)
                    const edgeTile = this.world.hasTile(edge)
                    if (
                        !tile?.canBuild ||
                        !tile.canWalk ||
                        tile.previousTile ||
                        !edgeTile ||
                        trees.has(position.join(',')) ||
                        this.isNearWater(position)
                    )
                        continue

                    const weight =
                        (0.8 + 0.18 * variation) * (1 - smooth(distance / reach))
                    const delta = (edgeTile.height - tile.height) * weight
                    if (!delta) continue
                    tile.height += delta
                    terrainApron.push([position, delta])
                    set(position, tile)
                }
            }
        })
        if (!this.loop) this.pf.update()
    }

    private isNearWater([x, y]: Position) {
        if (!this.world.waterRegions.length) return false
        for (let dy = -SHORE_OVERLAP; dy <= SHORE_OVERLAP; dy++) {
            for (let dx = -SHORE_OVERLAP; dx <= SHORE_OVERLAP; dx++) {
                if (this.world.hasTile([x + dx, y + dy])?.type === TileType.Water)
                    return true
            }
        }
        return false
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

    private restoreBuildingTerrain(actor: BuildingActor) {
        this.world.setMultipleTiles((set, get) => {
            for (const [position, delta] of actor.terrainApron ?? []) {
                const tile = get(position)
                let ground = tile
                // An adjacent building may now cover terrain graded by this one.
                while (ground.previousTile) ground = ground.previousTile
                ground.height -= delta
                set(position, tile)
            }
            for (const [position] of this.buildingTiles(
                actor.blueprint,
                actor.position,
                actor.rotation,
            )) {
                const current = this.world.hasTile(position)
                let tile: Tile | undefined = current
                let above: Tile | undefined
                while (tile && tile.buildingId !== actor.id) {
                    above = tile
                    tile = tile.previousTile
                }
                if (!tile?.previousTile) continue
                if (above) above.previousTile = tile.previousTile
                else set(position, tile.previousTile)
            }
        })
    }

    private restoreLegacySiteTerrain(actor: BuildingActor, index: number) {
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

    private assignLegacyBuildingTerrainOwners() {
        const lowerLayers = new Map<string, Tile>()
        for (const building of this.actors.slice().reverse()) {
            if (!isBuildingActor(building) || building instanceof ConstructionSiteActor)
                continue
            for (const [position, TileClass] of this.buildingTiles(
                building.blueprint,
                building.position,
                building.rotation,
            )) {
                const key = position.join(',')
                const tile = lowerLayers.get(key) ?? this.world.hasTile(position)
                if (!(tile instanceof TileClass) || !tile.previousTile) continue
                tile.buildingId = building.id
                lowerLayers.set(key, tile.previousTile)
            }
        }
    }

    public toJSON(): GameJSON {
        return {
            world: this.world.toJSON(),
            constructionTerrainDeferred: true,
            buildingTerrainOwners: true,
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
                    game.restoreLegacySiteTerrain(actor, index)
                }
            })
            if (world.tileRevision) game.pf.update()
        }
        if (!json.buildingTerrainOwners) game.assignLegacyBuildingTerrainOwners()

        return game
    }

    private handleTailUpdate = () => {
        this.pf.update()
    }
}

export interface GameJSON {
    world: WordJSON
    constructionTerrainDeferred?: true
    buildingTerrainOwners?: true
    players: PlayerJSON[]
    actors: ActorJSON[]
}
