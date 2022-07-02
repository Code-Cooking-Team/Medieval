import { ActorType, AnyActor } from '+game/types'
import { Emitter } from '+lib/Emitter'

export class Player {
    public selectedActors: AnyActor[] = []
    public selectedBuilding?: ActorType

    public emitter = new Emitter<{
        selectBuilding: ActorType
        unselectBuilding: ActorType
        selectActors: AnyActor[]
        unselectActors: AnyActor[]
    }>('Player')

    public selectActors(actor: AnyActor[]) {
        this.emitter.emit('selectActors', actor)
        this.selectedActors = actor
    }

    public unselectActor() {
        if (!this.selectedActors) return
        this.emitter.emit('unselectActors', this.selectedActors)
        this.selectedActors = []
    }

    public selectBuilding(building: ActorType) {
        this.emitter.emit('selectBuilding', building)
        this.selectedBuilding = building
    }

    public unselectBuilding() {
        if (!this.selectedBuilding) return
        this.emitter.emit('unselectBuilding', this.selectedBuilding)
        this.selectedBuilding = undefined
    }
}
