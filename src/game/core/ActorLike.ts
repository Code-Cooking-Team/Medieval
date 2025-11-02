import type { GameLike } from '+game/GameLike'
import { Player } from '+game/player/types'
import { ActorType, Position } from '+game/types'
import { ActorJSON } from './Actor'

export interface ActorLike {
    id: string
    type: ActorType
    selectImportance: number
    maxHp: number
    hp: number
    hpRegen: number
    seed: number
    rotation: number
    game: GameLike
    player: Player
    position: Position
    tick(): void
    death(): void
    hitBy(actor?: ActorLike): void
    hit(damage: number, byActor?: ActorLike): number
    isDead(): boolean
    interact(actors: ActorLike[]): boolean
    getSelectedImportance(): number
    setRotation(rotation: number): void
    toJSON(): ActorJSON
    fromJSON(json: ActorJSON): void
}
