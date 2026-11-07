import { Group, LOD } from 'three'

import { TileCodeGrid } from './world/tileCodes'

export type Position = [number, number]

export type Path = { x: number; y: number }[]

export enum ActorType {
    Empty = 'Empty',
    Human = 'Human',

    Guildhall = 'Guildhall',
    House = 'House',
    WoodCamp = 'WoodCamp',
    Barracks = 'Barracks',
    Stakewall = 'Stakewall',
    ConstructionSite = 'ConstructionSite',

    Tree = 'Tree',
    Boar = 'Boar',
    Deer = 'Deer',
}

export const actorTypesByCategory = {
    Unit: [ActorType.Human, ActorType.Boar, ActorType.Deer],
    Building: [
        ActorType.Guildhall,
        ActorType.House,
        ActorType.WoodCamp,
        ActorType.Barracks,
        ActorType.Stakewall,
    ],
    Other: [ActorType.Tree],
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
