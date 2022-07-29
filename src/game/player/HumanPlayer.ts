import { config } from '+config'
import { Actor } from '+game/core/Actor'
import { ActorType } from '+game/types'
import { uuid } from '+helpers'
import { Emitter } from '+lib/Emitter'

import { Player, PlayerJSON, PlayerType } from './types'

export class HumanPlayer implements Player {
    public id = uuid()
    public type = PlayerType.Human
    public name = 'Unnamed player'

    public selectedActors: Actor[] = []
    public selectedBuilding?: ActorType

    public emitter = new Emitter<{
        selectBuilding: ActorType
        unselectBuilding: ActorType
        selectActors: Actor[]
        unselectActors: Actor[]
    }>('Player')

    public selectActors(actors: Actor[]) {
        if (config.debug.logSelected) {
            console.log('Selected actors', actors)
        }
        this.emitter.emit('selectActors', actors)
        this.selectedActors = actors
    }

    public unselectActor() {
        if (!this.selectedActors) return
        this.emitter.emit('unselectActors', this.selectedActors)
        this.selectedActors = []
    }

    public selectBuilding(actorType: ActorType) {
        this.emitter.emit('selectBuilding', actorType)
        this.selectedBuilding = actorType
    }

    public unselectBuilding() {
        if (!this.selectedBuilding) return
        this.emitter.emit('unselectBuilding', this.selectedBuilding)
        this.selectedBuilding = undefined
    }

    public toJSON(): PlayerJSON {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
        }
    }

    public fromJSON(json: PlayerJSON): void {
        Object.assign(this, json)
    }
}
