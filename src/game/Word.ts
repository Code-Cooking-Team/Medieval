import { config } from '+config'
import { Emitter } from '+lib/Emitter'

import Map from './maps/de_grass'
import { ForestTile, MeadowTile, StepTile, Tile, WaterTile } from './Tile'
import { Position } from './types'

interface WordEmitterEvents {
    tailUpdate: undefined
}

export class Word {
    public tiles: Tile[][] = Map.map((row: string[]) =>
        row.map((v: string) => shortcuts[v]()),
    )

    public emitter = new Emitter<WordEmitterEvents>('Word')

    // public tiles: Tile[][] = [
    //     ['.', '.', '.'],
    //     ['.', '.', '.'],
    //     ['.', '.', '.'],Tile[][]
    // ].map((row) => row.map((v) => shortcuts[v]()))

    public tick() {}

    public getTile([x, y]: Position) {
        const tile = this.tiles?.[y]?.[x]
        if (!tile) throw new Error(`[Word] No tile at ${x}, ${y}`)
        return tile
    }

    public setTiles(setCallback: (tiles: Tile[][]) => void) {
        setCallback(this.tiles)
        this.emitter.emit('tailUpdate')
    }

    public getSize() {
        return [this.tiles[0]!.length, this.tiles.length] as [number, number]
    }

    public getRealSize() {
        return this.getSize().map((v) => v * config.renderer.tileSize) as [number, number]
    }
}

const shortcuts = {
    '.': () => new MeadowTile(),
    '#': () => new StepTile(),
    'F': () => new ForestTile(),
    'W': () => new WaterTile(),
} as any
