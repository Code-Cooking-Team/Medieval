import { config } from '+config'
import { actorByType } from '+game/actors'
import { BuildingActor } from '+game/core/BuildingActor'
import { ActorType } from '+game/types'

import { StakewallBlueprint } from './StakewallBlueprint'

export class StakewallActor extends BuildingActor {
    public type = ActorType.Stakewall
    public blueprint = actorByType[this.type].blueprint as StakewallBlueprint

    public maxHp = config.wall.hp
    public hp = this.maxHp
}
