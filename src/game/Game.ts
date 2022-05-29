import { config } from '+config/config'
import { distanceBetweenPoints } from '+helpers/math'
import PubSub from '+lib/PubSub'
import { ActorStatic } from './core/ActorStatic'
import { Position } from './types'
import { Word } from './Word'

export class Game extends PubSub<'tick'> {
    loop: any
    public actors: ActorStatic[] = []

    constructor(public word: Word) {
        super()
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
        this.actors.forEach((actor) => {
            actor.tick()
        })
        this.publish('tick')
    }

    public addActor(actor: ActorStatic) {
        this.actors.push(actor)
    }

    public findActorByRange(
        position: Position,
        range: number,
        additionalCondition?: (actor: ActorStatic) => boolean,
    ) {
        return this.actors.find((actor) => {
            if (distanceBetweenPoints(actor.position, position) > range) return false
            return additionalCondition?.(actor) ?? true
        })
    }

    public findActorsByType(type: string, isAlive = true) {
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

    public findClosestActorByType(type: string, position: Position, isAlive = true) {
        const actors = this.findActorsByType(type, isAlive)
        return actors.reduce((prev, curr) => {
            const prevDist = distanceBetweenPoints(prev.position, position)
            const currDist = distanceBetweenPoints(curr.position, position)

            return currDist < prevDist ? curr : prev
        }, actors[0])
    }
}
