import { HumanPlayer } from './HumanPlayer'
import { NaturePlayer } from './NaturePlayer'
import { Player, PlayerJSON, PlayerType } from './types'

export const playerByType: Record<PlayerType, any> = {
    [PlayerType.Human]: HumanPlayer,
    [PlayerType.Nature]: NaturePlayer,
}

export const playerFromJSON = (json: PlayerJSON): Player => {
    const PlayerClass = playerByType[json.type]
    const player = new PlayerClass()
    player.fromJSON(json)
    return player
}
