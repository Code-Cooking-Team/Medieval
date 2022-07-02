import { Game } from '+game/Game'
import { Position } from '+game/types'

import { Grid } from './grid'

export interface Spawner {
    position: Position
    canSpawn(): boolean
    setPosition(position: Position): void
    spawn(): void
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

    public spawn() {
        throw new Error(`[Spawner] Implement spawn() method`)
    }
}
