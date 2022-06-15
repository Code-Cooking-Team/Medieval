import { config } from '+config/config'
import { removeArrayItem } from '+helpers/array'
import { distanceBetweenPoints } from '+helpers/math'
import PubSub from '+lib/PubSub'
import { ActorStatic } from './core/ActorStatic'
import { Pathfinding } from './core/Pathfinding'
import { ActorType, Position } from './types'
import { Word } from './Word'

export class Game extends PubSub<'tick' | 'actorAdded' | 'actorRemoved' | 'wordUpdate'> {
    public pf: Pathfinding
    public actors: ActorStatic[] = []
    loop: any

    constructor(public word: Word) {
        super()

        this.pf = new Pathfinding(word, this.actors)

        this.word.subscribe(() => {
            this.publish('wordUpdate')
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
        this.publish('tick')
    }

    public addActor(actor: ActorStatic) {
        this.actors.push(actor)
        this.publish('actorAdded', actor)
    }

    public removeActor(actor: ActorStatic) {
        removeArrayItem(this.actors, actor)
        this.publish('actorRemoved', actor)
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
