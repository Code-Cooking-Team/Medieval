import { AnyActor } from '+game/types'
import { Emitter } from '+lib/Emitter'

import { BuildingKey } from './Builder'

export class Player {
    public selectedActor: AnyActor[] = []
    public selectedBuilding?: BuildingKey

    public emitter = new Emitter<{
        selectBuilding: BuildingKey
        unselectBuilding: BuildingKey
        selectActor: AnyActor[]
        unselectActor: AnyActor[]
    }>('Player')

    public selectActor(actor: AnyActor[]) {
        this.emitter.emit('selectActor', actor)
        this.selectedActor = actor
    }

    public unselectActor() {
        if (!this.selectedActor) return
        this.emitter.emit('unselectActor', this.selectedActor)
        this.selectedActor = []
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
