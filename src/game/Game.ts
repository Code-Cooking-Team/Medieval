import { config } from '+config/config'
import { Player, PlayerJSON } from '+game/player/types'
import { distanceBetweenPoints, removeArrayItem } from '+helpers'
import { Emitter } from '+lib/Emitter'

import { actorFromJSON } from './actors'
import { isBuildingActor, isWalkableActor } from './actors/helpers'
import { Actor, ActorClass, ActorJSON } from './core/Actor'
import { Pathfinding } from './core/Pathfinding'
import { playerFromJSON } from './player'
import { ActorType, Position } from './types'
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
        removeArrayItem(this.actors, actor)
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
    ): T | undefined {
        const actor = new ActorClass(this, player, position)

        const currTail = this.world.getTile(position)

        if (isWalkableActor(actor) && !currTail.canWalk) return

        if (isBuildingActor(actor)) {
            if (!currTail.canBuild) return // TODO check entire grid
            const [x, y] = position

            this.world.setMultipleTiles((set) => {
                applyTileGrid(
                    actor.grid,
                    ([localX, localY], tile, [centerY, centerX]) => {
                        tile.height = currTail.height
                        set([x + localX - centerX, y + localY - centerY], tile)
                    },
                )
            })
        }

        this.addActor(actor)

        return actor
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
