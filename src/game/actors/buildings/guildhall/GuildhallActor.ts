import { config } from '+config'
import { ResidenceTrait } from '+game/actors/buildingTraits/ResidenceTrait'
import { type BuildingTrait } from '+game/actors/buildingTraits/types'
import { BuildingActor } from '+game/core/BuildingActor'
import { ActorType } from '+game/types'

import { guildhallBlueprint } from './GuildhallBlueprint'

export class GuildhallActor extends BuildingActor {
    public type = ActorType.Guildhall
    public blueprint = guildhallBlueprint

    public maxHp = config.guildhall.hp
    public hp = this.maxHp

    public traits: BuildingTrait[] = [
        new ResidenceTrait(this, {
            residentsLimit: 5,
            spawnPosition: this.position,
        }),
    ]
}
