import { Game } from '+game/Game'
import { ActorType, Position } from '+game/types'
import { ClassType, maxValue, randomSeed, uuid } from '+helpers'

export abstract class Actor {
    public id = uuid()
    public type: ActorType = ActorType.Empty
    /**
     * 5 → Very important unit like soldier
     * 4 → Walkable actors
     * 3 → Default
     * 2 → Small and less important actors eg tree
     * 1 → Buildings because they are quite big
     */
    public selectImportance = 3
    public maxHp = 100
    public hp = this.maxHp
    public seed = randomSeed()

    constructor(public game: Game, public position: Position) {}

    public tick(): void {}

    public death(): void {}

    public hit(damage: number): number {
        const maxHit = maxValue(this.hp, damage)
        this.hp -= maxHit
        if (!this.hp) this.death()
        return maxHit
    }

    public isDead(): boolean {
        return this.hp <= 0
    }

    public interact(actors: Actor[]): boolean {
        return false
    }

    public getSelectedImportance(): number {
        return this.selectImportance
    }

    public debug(): string {
        return `[${this.type}]\nhp: ${this.hp}/${this.maxHp}`
    }
}

export type ActorClass<T extends Actor> = ClassType<
    T,
    ConstructorParameters<typeof Actor>
>
