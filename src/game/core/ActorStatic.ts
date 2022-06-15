import { uuid } from '+helpers/basic'
import { maxValue } from '+helpers/math'
import { randomSeed } from '+helpers/random'
import { Game } from '../Game'
import { ActorType, Position } from '../types'

export abstract class ActorStatic {
    public id = uuid()
    public type: ActorType = ActorType.Empty
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

    public debug(): string {
        return `[${this.type}]\nhp: ${this.hp}/${this.maxHp}`
    }
}
