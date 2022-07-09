export type Position = [number, number]

export type Path = { x: number; y: number }[] | null

export enum ActorType {
    Empty = 'Empty',
    House = 'House',
    Human = 'Human',
    Tree = 'Tree',
    Guardian = 'Guardian',
    WoodCamp = 'WoodCamp',
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
