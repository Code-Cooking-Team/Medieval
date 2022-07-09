import { Game } from '+game/Game'
import { ActorType, AnyActor, Position } from '+game/types'
import { uuid } from '+helpers/basic'
import { maxValue } from '+helpers/math'
import { randomSeed } from '+helpers/random'

export abstract class Actor {
    public id = uuid()
    public type: ActorType = ActorType.Empty
    public selectImportance = 3
    public maxHp = 100
    public hp = this.maxHp
    public seed = randomSeed()

    constructor(public game: Game, public position: Position) {}

    public tick() {}

    public death() {}

    public hit(damage: number) {
        const maxHit = maxValue(this.hp, damage)

        this.hp -= maxHit

        if (!this.hp) this.death()

        return maxHit
    }

    public isDead() {
        return this.hp <= 0
    }

    public interact(actors: AnyActor[]) {}

    public debug(): string {
        return `[${this.type}]\nhp: ${this.hp}/${this.maxHp}`
    }
}
