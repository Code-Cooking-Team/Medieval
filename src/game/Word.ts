import { uuid } from '+helpers/basic'
import PubSub from '+lib/PubSub'
import { Position } from './types'

export class Word extends PubSub<'update'> {
    public tiles: Tile[][] = [
        ['.', '.', '.', 'W', 'W', 'W', 'W', 'W', 'W', '.', '.', '.', '.', '.', '.', '.'],
        ['.', '.', '.', '.', 'W', 'W', 'W', 'W', 'W', 'W', '.', '.', '.', '.', '.', '.'],
        ['W', '.', '.', '.', '.', '.', '.', '.', 'W', 'W', '.', '.', '.', '.', '.', '.'],
        ['W', '.', '.', '.', '.', '.', '.', '.', 'W', 'W', '.', '.', '.', '.', '.', 'W'],
        ['W', '.', '.', '.', '.', '.', '.', '.', 'W', 'W', '.', '.', '.', '.', '.', 'W'],
        ['.', '.', 'W', 'W', '.', '.', '.', '.', '.', 'W', 'W', '.', '.', '.', '.', 'W'],
        ['.', '.', 'W', 'W', '.', '.', '.', '.', '.', 'W', 'W', 'W', '.', '.', '.', '.'],
        ['.', '.', '.', 'W', 'W', '.', '.', '.', '.', '.', 'W', 'W', 'W', '.', '.', '.'],
        ['W', '.', '.', 'W', 'W', '.', '.', '.', '.', '.', 'W', 'W', 'W', '.', '.', '.'],
        ['W', 'W', '.', 'W', 'W', '.', '.', '.', '.', 'W', 'W', 'W', 'W', '.', '.', '.'],
        ['W', 'W', 'W', 'W', 'W', '.', '.', '.', '.', 'W', 'W', 'W', 'W', '.', '.', '.'],
        ['W', 'W', 'W', 'W', 'W', 'W', '.', '.', '.', '.', 'W', 'W', '.', '.', '.', '.'],
        ['W', 'W', 'W', 'W', 'W', 'W', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.'],
        ['W', 'W', 'W', 'W', 'W', 'W', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.'],
    ].map((row) => row.map((v) => shortcuts[v]()))

    // public tiles: Tile[][] = [
    //     ['.', '.', '.'],
    //     ['.', '.', '.'],
    //     ['.', '.', '.'],
    // ].map((row) => row.map((v) => shortcuts[v]()))

    public tick() {}

    public getTile([x, y]: Position) {
        return this.tiles?.[y]?.[x]
    }

    public setTile([x, y]: Position, tile: Tile) {
        this.tiles[y][x] = tile
        this.publish('update')
    }

    public getSize() {
        return [this.tiles[0].length, this.tiles.length]
    }
}

export abstract class Tile {
    public id = uuid()
    public name: string = 'Tile'
    public walkable: boolean = true
    public height = 0
}

class GrassTile extends Tile {
    public name = 'Grass'
}

class WaterTile extends Tile {
    public name = 'Water'
    public walkable = false
    public height = -1
}

const shortcuts = {
    '.': () => new GrassTile(),
    W: () => new WaterTile(),
} as any
