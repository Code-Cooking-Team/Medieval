import { StaticActor } from './core/StaticActor'
import { WalkableActor } from './core/WalkableActor'

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

export interface ClockInfo {
    elapsedTime: number
    deltaTime: number
}

export interface Renderable {
    render(clock: ClockInfo): void
}

export type AnyActor = StaticActor | WalkableActor
