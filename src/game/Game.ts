import { config } from '+config/config'
import { Player } from '+game/player/Player'
import { distanceBetweenPoints } from '+helpers'
import { removeArrayItem } from '+helpers'
import { Emitter } from '+lib/Emitter'

import { isBuildingActor, isWalkableActor } from './actors/helpers'
import { Actor, ActorClass } from './core/Actor'
import { Pathfinding } from './core/Pathfinding'
import { ActorType, Position } from './types'
import { applyTileGrid } from './word/tileCodes'
import { Word } from './word/Word'

interface GameEmitterEvents {
    tick: undefined
    actorAdded: Actor
    actorRemoved: Actor
    started: undefined
    stopped: undefined
}

export class Game {
    public pf: Pathfinding
    public actors: Actor[] = []
    loop: any

    public emitter = new Emitter<GameEmitterEvents>('Game')

    constructor(public word: Word, public player: Player) {
        this.pf = new Pathfinding(word)

        this.word.emitter.on('tailUpdate', () => {
            this.pf.update()
        })
    }

    public start(): void {
        this.emitter.emit('started')
        this.loop = setInterval(() => {
            this.tick()
        }, config.core.tickTime)
    }

    public stop(): void {
        this.emitter.emit('stopped')
        clearInterval(this.loop)
        this.loop = undefined
    }

    public tick(): void {
        this.word.tick()
        this.pf.tick()
        this.actors.forEach((actor) => {
            actor.tick()
        })
        this.emitter.emit('tick')
    }

    public addActor(actor: Actor): void {
        this.actors.push(actor)
        this.pf.update()
        this.emitter.emit('actorAdded', actor)
    }

    public removeActor(actor: Actor): void {
        removeArrayItem(this.actors, actor)
        this.pf.update()
        this.emitter.emit('actorRemoved', actor)
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
            if (isAlive && actor.hp <= 0) return false
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
        position: Position,
    ): T | undefined {
        const actor = new ActorClass(this, position)

        const currTail = this.word.getTile(position)

        if (isWalkableActor(actor) && !currTail.canWalk) return

        if (isBuildingActor(actor)) {
            if (!currTail.canBuild) return // TODO check entire grid
            const [x, y] = position

            this.word.setMultipleTiles((set) => {
                applyTileGrid(actor.grid, ([localX, localY], tile) => {
                    tile.height = currTail.height
                    set([x + localX, y + localY], tile)
                })
            })
        }

        this.addActor(actor)

        return actor
    }
}
