import { Group, LOD } from 'three'

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

export interface ActorModel {
    getModel(): Group | LOD
}

export interface Renderable {
    render(clock: ClockInfo): void
}
