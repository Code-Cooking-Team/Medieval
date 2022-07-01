import { AnyActor } from '+game/types'
import { Emitter } from '+lib/Emitter'

import { BuildingKey } from './Builder'

export class Player {
    public selectedActors: AnyActor[] = []
    public selectedBuilding?: BuildingKey

    public emitter = new Emitter<{
        selectBuilding: BuildingKey
        unselectBuilding: BuildingKey
        selectActor: AnyActor[]
        unselectActor: AnyActor[]
    }>('Player')

    public selectActors(actor: AnyActor[]) {
        this.emitter.emit('selectActor', actor)
        this.selectedActors = actor
    }

    public unselectActor() {
        if (!this.selectedActors) return
        this.emitter.emit('unselectActor', this.selectedActors)
        this.selectedActors = []
    }

    public selectBuilding(building: BuildingKey) {
        this.emitter.emit('selectBuilding', building)
        this.selectedBuilding = building
    }

    public unselectBuilding() {
        if (!this.selectedBuilding) return
        this.emitter.emit('unselectBuilding', this.selectedBuilding)
        this.selectedBuilding = undefined
    }
}
