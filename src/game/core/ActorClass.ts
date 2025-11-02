import type { GameLike } from '+game/GameLike'
import { type Player } from '+game/player/types'
import { type Position } from '+game/types'
import { type ClassType } from '+helpers'
import { type ActorLike } from './ActorLike'

export type ActorClass<T extends ActorLike = ActorLike> = ClassType<
    T,
    [game: GameLike, player: Player, position?: Position]
>
