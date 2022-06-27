import { config } from '+config'
import PubSub from '+lib/PubSub'
import Map from './maps/de_grass'
import { ForestTile, MeadowTile, StepTile, Tile, WaterTile } from './Tile'
import { Position } from './types'

export class Word extends PubSub<'tailUpdate'> {
    public tiles: Tile[][] = Map.map((row: string[]) =>
        row.map((v: string) => shortcuts[v]()),
    )

    // public tiles: Tile[][] = [
    //     ['.', '.', '.'],
    //     ['.', '.', '.'],
    //     ['.', '.', '.'],Tile[][]
    // ].map((row) => row.map((v) => shortcuts[v]()))

    public tick() {}

    public getTile([x, y]: Position) {
        return this.tiles?.[y]?.[x]
    }

    public setTiles(setCallback: (tiles: Tile[][]) => void) {
        setCallback(this.tiles)
        this.publish('tailUpdate')
    }

    public getSize() {
        return [this.tiles[0].length, this.tiles.length]
    }

    public getRealSize() {
        return this.getSize().map((v) => v * config.renderer.tileSize)
    }
}

const shortcuts = {
    '.': () => new MeadowTile(),
    '#': () => new StepTile(),
    'F': () => new ForestTile(),
    'W': () => new WaterTile(),
} as any
