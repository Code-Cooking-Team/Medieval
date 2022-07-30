import { config } from '+config'
import { Emitter } from '+lib/Emitter'

import { Position } from '../types'
import { getTileByJSON, Tile } from './Tile'
import { TileGrid, TileJSON } from './types'

export interface WordJSON {
    tiles: TileJSON[][]
}

export class World {
    public emitter = new Emitter<{ tailUpdate: undefined }>('Word')

    constructor(public tiles: TileGrid) {}

    public hasTile([x, y]: Position) {
        return this.tiles?.[y]?.[x]!!
    }

    public getTile([x, y]: Position) {
        const tile = this.tiles?.[y]?.[x]
        if (!tile) throw new Error(`[Word:getTile] No tile at ${x}, ${y}`)
        return tile
    }

    public setTile(position: Position, tile: Tile) {
        this.setTileAt(position, tile)
        this.emitter.emit('tailUpdate')
    }

    public setMultipleTiles(
        setCallback: (
            set: (position: Position, tile: Tile) => void,
            get: (position: Position) => Tile,
            tiles: Tile[][],
        ) => void,
    ) {
        setCallback(this.setTileAt.bind(this), this.getTile.bind(this), this.tiles)
        this.emitter.emit('tailUpdate')
    }

    public getSize() {
        return [this.tiles[0]!.length, this.tiles.length] as [number, number]
    }

    public getRealSize() {
        return this.getSize().map((v) => v * config.renderer.tileSize) as [number, number]
    }

    public forEachTile(callback: (tile: Tile, [x, y]: Position) => void) {
        this.tiles.forEach((row, y) => {
            row.forEach((tile, x) => {
                callback(tile, [x, y])
            })
        })
    }

    public toJSON(): WordJSON {
        return {
            tiles: this.tiles.map((row) => row.map((tile) => tile.toJSON())),
        }
    }

    static fromJSON(json: WordJSON) {
        const tiles = json.tiles.map((row) => row.map(getTileByJSON))
        return new World(tiles)
    }

    private setTileAt([x, y]: Position, tile: Tile) {
        const currentTile = this.tiles?.[y]?.[x]
        if (!currentTile) throw new Error(`[Word:setTile] No tile at ${x}, ${y}`)
        this.tiles[y]![x] = tile
    }
}
