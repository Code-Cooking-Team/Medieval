import { ActorType } from '+game/types'

export const constructionCosts = {
    [ActorType.House]: 300,
    [ActorType.WoodCamp]: 300,
    [ActorType.HunterHut]: 300,
    [ActorType.Barracks]: 450,
    [ActorType.Guildhall]: 600,
    [ActorType.Stakewall]: 30,
    [ActorType.Gallery]: 40,
    [ActorType.GalleryStairs]: 30,
}

export type ConstructionType = keyof typeof constructionCosts

export function isConstructionType(type: ActorType): type is ConstructionType {
    return Object.hasOwn(constructionCosts, type)
}
