import { Group, LOD } from 'three'

import { TileCodeGrid } from './world/tileCodes'

export type Position = [number, number]

export type Path = { x: number; y: number }[]

export enum ActorType {
    Empty = 'Empty',
    Human = 'Human',

    House = 'House',
    WoodCamp = 'WoodCamp',
    Barracks = 'Barracks',
    Stakewall = 'Stakewall',

    Tree = 'Tree',
    Boar = 'Boar',
}

export const actorTypesByCategory = {
    Unit: [ActorType.Human, ActorType.Boar],
    Building: [
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
    getModel(): Group | LOD
    getPlaceholder(): { model: Group | LOD; promise: Promise<void> }
    getGrid(): TileCodeGrid
    height: number
    config?: { [key: string]: unknown }
}

export interface Renderable {
    render(clock: ClockInfo): void
}
