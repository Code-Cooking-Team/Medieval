import type { GameLike } from '+game/GameLike'
import { Player } from '+game/player/types'
import { Position } from '+game/types'
import { ClassType } from '+helpers'
import { ActorLike } from './ActorLike'

export type ActorClass<T extends ActorLike = ActorLike> = ClassType<
    T,
    [game: GameLike, player: Player, position?: Position]
>
