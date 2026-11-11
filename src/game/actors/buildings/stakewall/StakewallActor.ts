import { config } from '+config'
import { BuildingActor } from '+game/core/BuildingActor'
import { ActorType } from '+game/types'

import { stakewallBlueprint } from './StakewallBlueprint'

export class StakewallActor extends BuildingActor {
    public type = ActorType.Stakewall
    public blueprint = stakewallBlueprint

    public maxHp = config.wall.hp
    public hp = this.maxHp
}
