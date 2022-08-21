import { config } from '+config'
import { actorByType } from '+game/actors'
import { ResidenceTrait } from '+game/actors/buildingTraits/ResidenceTrait'
import { BuildingTrait } from '+game/actors/buildingTraits/types'
import { BuildingActor } from '+game/core/BuildingActor'
import { ActorType } from '+game/types'

import { GuildhallBlueprint } from './GuildhallBlueprint'

export class GuildhallActor extends BuildingActor {
    public type = ActorType.Guildhall
    public blueprint = actorByType[this.type].blueprint as GuildhallBlueprint

    public maxHp = config.guildhall.hp
    public hp = this.maxHp

    public traits: BuildingTrait[] = [
        new ResidenceTrait(this, {
            residentsLimit: 5,
            spawnPosition: this.position,
        }),
    ]
}
