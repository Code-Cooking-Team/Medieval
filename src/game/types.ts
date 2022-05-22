export type Position = [number, number]

export type Path = { x: number; y: number }[] | null

export enum ActorType {
    Empty = 'Empty',
    Tree = 'Tree',
    Lumberjack = 'Lumberjack',
    LumberjackCabin = 'LumberjackCabin',
}

export const actorTypeColors: Record<ActorType, string> = {
    [ActorType.Empty]: '#ccc',
    [ActorType.Tree]: '#10990e',
    [ActorType.Lumberjack]: '#663c0b',
    [ActorType.LumberjackCabin]: '#291906',
}
