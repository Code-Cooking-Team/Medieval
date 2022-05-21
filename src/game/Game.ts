import PubSub from '+lib/PubSub'
import { Actor } from './core/Actor'
import { Word } from './Word'

const TICK_TIME = 200

export class Game extends PubSub<'tick'> {
    loop: any
    public actors: Actor[] = []

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
    }

    private tick() {
        this.word.tick()
        this.actors.forEach((actor) => {
            actor.tick()
        })
        this.publish('tick')
    }

    public addActor(actor: Actor) {
        this.actors.push(actor)
    }
}
