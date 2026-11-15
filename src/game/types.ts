import { type Group, type LOD } from 'three'

import { type BuildingSurface } from './core/buildingSurfaces'
import { type TileCodeGrid } from './world/tileCodes'

export type Position = [number, number]

export type PathStep = { x: number; y: number; surface?: string }
export type Path = PathStep[]

export enum ActorType {
    Empty = 'Empty',
    Human = 'Human',

    Guildhall = 'Guildhall',
    House = 'House',
    WoodCamp = 'WoodCamp',
    HunterHut = 'HunterHut',
    Barracks = 'Barracks',
    Stakewall = 'Stakewall',
    Gallery = 'Gallery',
    GalleryStairs = 'GalleryStairs',
    ConstructionSite = 'ConstructionSite',

    Tree = 'Tree',
    Bush = 'Bush',
    SmallRock = 'SmallRock',
    MediumRock = 'MediumRock',
    LargeRock = 'LargeRock',
    Boar = 'Boar',
    Deer = 'Deer',
}

export const actorTypesByCategory = {
    Unit: [ActorType.Human, ActorType.Boar, ActorType.Deer],
    Building: [
        ActorType.Guildhall,
        ActorType.House,
        ActorType.WoodCamp,
        ActorType.HunterHut,
        ActorType.Barracks,
        ActorType.Stakewall,
        ActorType.Gallery,
        ActorType.GalleryStairs,
    ],
    Other: [
        ActorType.Tree,
        ActorType.Bush,
        ActorType.SmallRock,
        ActorType.MediumRock,
        ActorType.LargeRock,
    ],
}

export const allActorTypes = Object.values(ActorType).filter(
    (type) => type !== ActorType.Empty,
)

export interface ClockInfo {
    elapsedTime: number
    deltaTime: number
}

export interface ActorBlueprint {
    standingSurfaces?: readonly BuildingSurface[]
    getPlaceholder(seed?: number): { model: Group | LOD; promise: Promise<void> }
    getGrid(): TileCodeGrid
    height: number
    config?: { [key: string]: unknown }
}

export interface Renderable {
    render(clock: ClockInfo): void
}
