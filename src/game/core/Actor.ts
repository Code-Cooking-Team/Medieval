import type { GameLike } from '+game/GameLike'
import { Player } from '+game/player/types'
import { ActorType, Position } from '+game/types'
import { maxValue, randomSeed, uuid } from '+helpers'
import { ActorLike } from './ActorLike'

export abstract class Actor implements ActorLike {
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
    public hpRegen = 1
    public seed = randomSeed()
    public rotation = 0

    constructor(
        public game: GameLike,
        public player: Player,
        public position: Position = [0, 0],
    ) {}

    public tick(): void {
        if (this.hp < this.maxHp) {
            this.hp = Math.min(this.hp + this.hpRegen, this.maxHp)
        }
    }

    public death(): void {
        this.game.removeActor(this)
    }

    public hitBy(actor?: ActorLike): void {}

    public hit(damage: number, byActor?: ActorLike): number {
        if (this.isDead()) return 0

        const maxHit = maxValue(this.hp, damage)
        this.hp -= maxHit

        if (!this.hp) this.death()

        this.hitBy(byActor)

        return maxHit
    }

    public isDead(): boolean {
        return this.hp <= 0
    }

    public interact(actors: ActorLike[]): boolean {
        return false
    }

    public getSelectedImportance(): number {
        return this.selectImportance
    }

    public setRotation(rotation: number): void {
        this.rotation = rotation
    }

    public toJSON(): ActorJSON {
        return {
            id: this.id,
            type: this.type,
            playerId: this.player.id,
            position: this.position,
            hp: this.hp,
            maxHp: this.maxHp,
            hpRegen: this.hpRegen,
            selectImportance: this.selectImportance,
            seed: this.seed,
            rotation: this.rotation,
        }
    }

    public fromJSON(json: ActorJSON): void {
        Object.assign(this, json)
    }
}

export interface ActorJSON {
    id: string
    type: ActorType
    playerId: string
    position: Position
    hp: number
    maxHp: number
    hpRegen: number
    selectImportance: number
    seed: number
    rotation: number
}
