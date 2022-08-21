import { config } from '+config'
import { actorByType } from '+game/actors'
import { BuildingTrait } from '+game/actors/buildingTraits/types'
import { BuildingActor } from '+game/core/BuildingActor'
import { ActorType } from '+game/types'

import { ResidenceTrait } from '../../buildingTraits/ResidenceTrait'
import { HouseBlueprint } from './HouseBlueprint'

export class HouseActor extends BuildingActor {
    public type = ActorType.House
    public blueprint = actorByType[this.type].blueprint as HouseBlueprint

    public maxHp = config.house.hp
    public hp = this.maxHp

    public traits: BuildingTrait[] = [
        new ResidenceTrait(this, {
            residentsLimit: 3,
            spawnPosition: this.getSpawnPosition(),
        }),
    ]

    public getSpawnPosition() {
        return this.getGlobalPositionOfLocalPoint(this.blueprint.config.spawnPoint)
    }
}
