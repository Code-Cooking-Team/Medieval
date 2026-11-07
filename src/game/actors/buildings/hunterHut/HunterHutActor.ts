import { actorByType } from '+game/actors'
import { BuildingActor } from '+game/core/BuildingActor'
import { ActorType } from '+game/types'

import { HunterHutBlueprint } from './HunterHutBlueprint'

/** Visual prototype; hunting jobs will be added separately. */
export class HunterHutActor extends BuildingActor {
    public type = ActorType.HunterHut
    public blueprint = actorByType[this.type].blueprint as HunterHutBlueprint
}
