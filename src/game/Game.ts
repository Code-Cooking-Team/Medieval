import { config } from '+config/config'
import { Player, PlayerJSON } from '+game/player/types'
import { distanceBetweenPoints, removeArrayItem } from '+helpers'
import { Emitter } from '+lib/Emitter'

import { actorFromJSON } from './actors'
import { isBuildingActor, isHumanActor, isWalkableActor } from './actors/helpers'
import { Actor, ActorClass, ActorJSON } from './core/Actor'
import { BuildingActor } from './core/BuildingActor'
import { Pathfinding } from './core/Pathfinding'
import { playerFromJSON } from './player'
import { HumanPlayer } from './player/HumanPlayer'
import { ActorType, Position } from './types'
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
        started: undefined
        stopped: undefined
    }>('Game')

    constructor(public world: World, public players: Player[]) {
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

        if (isBuildingActor(actor)) {
            this.restoreBuildingTerrain(actor, index)
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
        const actor = new ActorClass(this, player, position)

        const currTail = this.world.getTile(position)

        if (isWalkableActor(actor) && !currTail.canWalk) return

        if (isBuildingActor(actor)) {
            actor.setRotation(rotation)

            if (!currTail.canBuild) return // TODO check entire grid

            this.world.setMultipleTiles((set, get) => {
                this.forEachBuildingTile(actor, (position, TileClass) => {
                    const tile = new TileClass(get(position))
                    tile.height = currTail.height
                    set(position, tile)
                })
            })
        }

        if (seed !== undefined) actor.seed = seed
        this.addActor(actor)

        return actor
    }

    private forEachBuildingTile(
        actor: BuildingActor,
        callback: (position: Position, tileClass: TileClass) => void,
    ) {
        const [x, y] = actor.position
        applyTileGrid(
            actor.blueprint.getGrid(),
            ([localX, localY], TileClass, [centerX, centerY]) => {
                callback([x + localX - centerX, y + localY - centerY], TileClass)
            },
            actor.rotation,
        )
    }

    private restoreBuildingTerrain(actor: BuildingActor, index: number) {
        // Later buildings may have placed their own tiles over this footprint.
        const layersAbove = new Map<string, number>()
        for (const building of this.actors.slice(index + 1).filter(isBuildingActor)) {
            this.forEachBuildingTile(building, (position) => {
                const key = position.join(',')
                layersAbove.set(key, (layersAbove.get(key) ?? 0) + 1)
            })
        }

        this.world.setMultipleTiles((set, get) => {
            this.forEachBuildingTile(actor, (position, TileClass) => {
                if (!this.world.hasTile(position)) return
                let tile = get(position)
                let above: typeof tile | undefined
                const depth = layersAbove.get(position.join(',')) ?? 0

                for (let layer = 0; layer < depth; layer++) {
                    if (!tile.previousTile) return
                    above = tile
                    tile = tile.previousTile
                }

                if (!(tile instanceof TileClass) || !tile.previousTile) return
                if (above) above.previousTile = tile.previousTile
                else set(position, tile.previousTile)
            })
        })
    }

    public toJSON(): GameJSON {
        return {
            world: this.world.toJSON(),
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

        return game
    }

    private handleTailUpdate = () => {
        this.pf.update()
    }
}

export interface GameJSON {
    world: WordJSON
    players: PlayerJSON[]
    actors: ActorJSON[]
}
