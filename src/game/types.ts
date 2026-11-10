import { type Group, type LOD } from 'three'

import { type TileCodeGrid } from './world/tileCodes'

export type Position = [number, number]

export type Path = { x: number; y: number }[]

export enum ActorType {
    Empty = 'Empty',
    Human = 'Human',

    Guildhall = 'Guildhall',
    House = 'House',
    WoodCamp = 'WoodCamp',
    HunterHut = 'HunterHut',
    Barracks = 'Barracks',
    Stakewall = 'Stakewall',
    ConstructionSite = 'ConstructionSite',

    Tree = 'Tree',
    Bush = 'Bush',
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
    ],
    Other: [ActorType.Tree, ActorType.Bush],
}

export const allActorTypes = Object.values(ActorType).filter(
    (type) => type !== ActorType.Empty,
)

export interface ClockInfo {
    elapsedTime: number
    deltaTime: number
}

export interface ActorBlueprint {
    getPlaceholder(seed?: number): { model: Group | LOD; promise: Promise<void> }
    getGrid(): TileCodeGrid
    height: number
    config?: { [key: string]: unknown }
}

export interface Renderable {
    render(clock: ClockInfo): void
}
