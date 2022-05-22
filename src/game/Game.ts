import { TICK_TIME } from '+config'
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
        }, TICK_TIME)
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
        condition: (actor: ActorStatic) => boolean,
        range: number,
    ) {
        return this.actors.find((actor) => {
            const [x, y] = actor.position
            if (distanceBetweenPoints([x, y], position) > range) return false
            return condition(actor)
        })
    }

    public findActorsByType(type: string, isAlive = true) {
        return this.actors.filter((actor) => {
            return actor.type === type && isAlive && actor.hp > 0
        })
    }

    public findActorsByPosition(position: Position, range: number, isAlive = true) {
        return this.actors.filter((actor) => {
            const [x, y] = actor.position
            return (
                distanceBetweenPoints([x, y], position) <= range &&
                isAlive &&
                actor.hp > 0
            )
        })
    }

    public findClosestActorByType(type: string, [x, y]: Position, isAlive = true) {
        const actors = this.findActorsByType(type, isAlive)
        return actors.reduce((prev, curr) => {
            const [px, py] = prev.position
            const [cx, cy] = curr.position

            const prevDist = distanceBetweenPoints([px, py], [x, y])
            const currDist = distanceBetweenPoints([cx, cy], [x, y])

            return currDist < prevDist ? curr : prev
        }, actors[0])
    }
}
