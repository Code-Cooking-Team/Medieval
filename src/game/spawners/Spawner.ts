import { Game } from '+game/Game'
import { AnyActor, Position } from '+game/types'

import { Grid } from './grid'

export interface Spawner {
    position: Position
    canSpawn(): boolean
    setPosition(position: Position): void
    spawn(): AnyActor
}

export abstract class BuildingSpawner implements Spawner {
    public position: Position = [0, 0]
    public readonly grid: Grid = [['.']]

    constructor(public game: Game) {}

    public setPosition(position: Position) {
        this.position = position
    }

    public canSpawn() {
        const tile = this.game.word.getTile(this.position)
        // TODO check entire grid
        return tile?.canBuild
    }

    // @ts-ignore TODO get rid of this because it's sad :(
    public spawn() {
        throw new Error(`[Spawner] Implement spawn() method`)
    }
}
