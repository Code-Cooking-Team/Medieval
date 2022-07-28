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
        if (this.type !== json.type) throw new Error('Invalid player type')
        this.id = json.id
        this.name = json.name
    }
}
