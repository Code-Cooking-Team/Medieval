import { uuid } from '+helpers/basic'
import PubSub from '+lib/PubSub'
import { Position } from './types'

export class Word extends PubSub<'update'> {
    public tiles: Tile[][] = [
        ['.', '.', '.', '.', 'W', '.', '.', '.'],
        ['.', '.', '.', '.', 'W', '.', '.', '.'],
        ['W', '.', '.', '.', 'W', '.', '.', '.'],
        ['W', 'W', '.', '.', 'W', '.', '.', '.'],
        ['.', 'W', '.', '.', 'W', '.', '.', '.'],
        ['.', 'W', '.', '.', '.', '.', '.', '.'],
        ['.', 'W', 'W', 'W', '.', '.', '.', '.'],
        ['.', '.', '.', '.', '.', '.', '.', 'W'],
    ].map((row) => row.map((v) => shortcuts[v]()))

    public tick() {}

    public getTile([x, y]: Position) {
        return this.tiles?.[y]?.[x]
    }

    public setTile([x, y]: Position, tile: Tile) {
        this.tiles[y][x] = tile
        this.publish('update')
    }
}

abstract class Tile {
    public id = uuid()
    public name: string = 'Tile'
    public walkable: boolean = true
}

class GrassTile extends Tile {
    public name = 'Grass'
}

class WaterTile extends Tile {
    public name = 'Water'
    public walkable = false
}

const shortcuts = {
    '.': () => new GrassTile(),
    W: () => new WaterTile(),
} as any
