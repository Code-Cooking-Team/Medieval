import { config } from '+config/config'
import { Player } from '+game/player/Player'
import { removeArrayItem } from '+helpers/array'
import { distanceBetweenPoints } from '+helpers/math'
import { Emitter } from '+lib/Emitter'

import { Actor } from './core/Actor'
import { Pathfinding } from './core/Pathfinding'
import { ActorType, Position } from './types'
import { Word } from './Word'

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

    public start() {
        this.emitter.emit('started')
        this.loop = setInterval(() => {
            this.tick()
        }, config.core.tickTime)
    }

    public stop() {
        this.emitter.emit('stopped')
        clearInterval(this.loop)
        this.loop = undefined
    }

    public tick() {
        this.word.tick()
        this.pf.tick()
        this.actors.forEach((actor) => {
            actor.tick()
        })
        this.emitter.emit('tick')
    }

    public addActor(actor: Actor) {
        this.actors.push(actor)
        this.pf.update()
        this.emitter.emit('actorAdded', actor)
    }

    public removeActor(actor: Actor) {
        removeArrayItem(this.actors, actor)
        this.pf.update()
        this.emitter.emit('actorRemoved', actor)
    }

    public findActorByRange(
        position: Position,
        range: number,
        additionalCondition?: (actor: Actor) => boolean,
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
        if (!actors[0]) return

        return actors.reduce((prev, curr) => {
            const prevDist = distanceBetweenPoints(prev.position, position)
            const currDist = distanceBetweenPoints(curr.position, position)

            return currDist < prevDist ? curr : prev
        }, actors[0])
    }
}
