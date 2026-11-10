import { config } from '+config'
import type { HumanActor } from '+game/actors/units/human/HumanActor'
import { type Actor } from '+game/core/Actor'
import { type ActorType } from '+game/types'
import { v4 as uuid } from 'uuid'
import { Emitter } from '+lib/Emitter'

import { type Player, type PlayerJSON, PlayerType } from './types'

export class HumanPlayer implements Player {
    public id = uuid()
    public type = PlayerType.Human
    public name = 'Unnamed player'

    public selectedActors: Actor[] = []
    public selectedBuilding?: ActorType
    public singleBuildingPlacement = false
    public constructionBuilders: HumanActor[] = []

    public get constructionBuilder() {
        return this.constructionBuilders[0]
    }
    public removingBuildings = false
    public selectedBuildingRotation = 0

    public emitter = new Emitter<{
        removalModeChanged: undefined
        selectBuilding: ActorType
        unselectBuilding: ActorType
        selectActors: Actor[]
        unselectActors: Actor[]
        rotateBuilding: number
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

    public selectBuilding(
        actorType: ActorType,
        builder?: HumanActor | HumanActor[],
        singlePlacement = false,
    ) {
        this.setBuildingRemoval(false)
        this.constructionBuilders = builder
            ? [...(Array.isArray(builder) ? builder : [builder])]
            : []
        this.selectedBuilding = actorType
        this.singleBuildingPlacement = singlePlacement
        this.emitter.emit('selectBuilding', actorType)
    }

    public unselectBuilding() {
        if (!this.selectedBuilding) return
        this.emitter.emit('unselectBuilding', this.selectedBuilding)
        this.selectedBuilding = undefined
        this.singleBuildingPlacement = false
        this.constructionBuilders = []
    }

    public setBuildingRemoval(enabled: boolean) {
        if (this.removingBuildings === enabled) return
        this.removingBuildings = enabled
        if (enabled) this.unselectBuilding()
        this.emitter.emit('removalModeChanged')
    }

    public rotateBuilding() {
        if (!this.selectedBuilding) return
        this.selectedBuildingRotation = (this.selectedBuildingRotation + 1) % 4
        this.emitter.emit('rotateBuilding', this.selectedBuildingRotation)
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
