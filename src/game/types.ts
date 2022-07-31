export type Position = [number, number]

export type Path = { x: number; y: number }[]

export enum ActorType {
    Empty = 'Empty',
    Human = 'Human',

    House = 'House',
    WoodCamp = 'WoodCamp',
    Barracks = 'Barracks',

    Tree = 'Tree',
    Boar = 'Boar',
}

export const actorTypesByCategory = {
    Unit: [ActorType.Human, ActorType.Boar],
    Building: [ActorType.House, ActorType.WoodCamp, ActorType.Barracks],
    Other: [ActorType.Tree],
}

export const allActorTypes = Object.values(ActorType).filter(
    (type) => type !== ActorType.Empty,
)

export interface ClockInfo {
    elapsedTime: number
    deltaTime: number
}

export interface Renderable {
    render(clock: ClockInfo): void
}
