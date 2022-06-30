import { config } from '+config/config'
import { removeArrayItem } from '+helpers/array'
import { distanceBetweenPoints } from '+helpers/math'
import { Emitter } from '+lib/Emitter'
import { Pathfinding } from './core/Pathfinding'
import { StaticActor } from './core/StaticActor'
import { ActorType, AnyActor, Position } from './types'
import { Word } from './Word'

interface GameEmitterEvents {
    tick: undefined
    actorAdded: AnyActor
    actorRemoved: AnyActor
}

export class Game {
    public pf: Pathfinding
    public actors: AnyActor[] = [] // TODO new Set
    loop: any

    public emitter = new Emitter<GameEmitterEvents>('Game')

    constructor(public word: Word) {
        this.pf = new Pathfinding(word, this.actors)

        this.word.emitter.on('tailUpdate', () => {
            this.pf.update()
        })
    }

    public start() {
        this.loop = setInterval(() => {
            this.tick()
        }, config.core.tickTime)
    }

    public stop() {
        clearInterval(this.loop)
        this.loop = undefined
    }

    public isRunning() {
        return this.loop !== undefined
    }

    public tick() {
        this.word.tick()
        this.pf.tick()
        this.actors.forEach((actor) => {
            actor.tick()
        })
        this.emitter.emit('tick')
    }

    public addActor(actor: StaticActor) {
        this.actors.push(actor)
        this.emitter.emit('actorAdded', actor)
    }

    public removeActor(actor: StaticActor) {
        removeArrayItem(this.actors, actor)
        this.emitter.emit('actorRemoved', actor)
    }

    public findActorByRange(
        position: Position,
        range: number,
        additionalCondition?: (actor: StaticActor) => boolean,
    ) {
        return this.actors.find((actor) => {
            if (distanceBetweenPoints(actor.position, position) > range) return false
            return additionalCondition?.(actor) ?? true
        })
    }

    public findActorsByType(type: ActorType, isAlive = true) {
        return this.actors.filter((actor) => {
            if (isAlive && actor.hp <= 0) return false
            return actor.type === type
        })
    }

    public findActorsByPosition(position: Position, range: number, isAlive = true) {
        return this.actors.filter((actor) => {
            if (isAlive && actor.hp <= 0) return false
            return distanceBetweenPoints(actor.position, position) <= range
        })
    }

    public findClosestActorByType(type: ActorType, position: Position, isAlive = true) {
        const actors = this.findActorsByType(type, isAlive)
        return actors.reduce((prev, curr) => {
            const prevDist = distanceBetweenPoints(prev.position, position)
            const currDist = distanceBetweenPoints(curr.position, position)

            return currDist < prevDist ? curr : prev
        }, actors[0])
    }
}
