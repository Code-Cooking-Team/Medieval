import { ActorType } from '+game/types'

import {
    Castle,
    Fence,
    Hammer,
    House,
    Landmark,
    PawPrint,
    TreePine,
    UserRound,
    Warehouse,
} from 'lucide-react'

const icons = {
    [ActorType.Empty]: null,
    [ActorType.Human]: UserRound,
    [ActorType.Guildhall]: Landmark,
    [ActorType.House]: House,
    [ActorType.WoodCamp]: Warehouse,
    [ActorType.HunterHut]: House,
    [ActorType.Barracks]: Castle,
    [ActorType.Stakewall]: Fence,
    [ActorType.ConstructionSite]: Hammer,
    [ActorType.Tree]: TreePine,
    [ActorType.Boar]: PawPrint,
    [ActorType.Deer]: PawPrint,
} satisfies Record<ActorType, typeof UserRound | null>

export const ActorIcon = ({ type }: { type: ActorType }) => {
    const Icon = icons[type]
    return Icon && <Icon size={16} aria-hidden="true" />
}
