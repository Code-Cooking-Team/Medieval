import { uuid } from '+helpers'

import { Player, PlayerJSON, PlayerType } from './types'

export class NaturePlayer implements Player {
    public id = uuid()
    public type = PlayerType.Nature
    public name = 'Nature'

    toJSON(): PlayerJSON {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
        }
    }

    fromJSON(json: PlayerJSON): void {
        Object.assign(this, json)
    }
}
