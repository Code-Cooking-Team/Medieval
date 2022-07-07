import { AnyActor } from '+game/types'

import { HumanActor } from './human/HumanActor'

export const isHumanActor = (actor: AnyActor): actor is HumanActor => {
    return actor instanceof HumanActor
}
