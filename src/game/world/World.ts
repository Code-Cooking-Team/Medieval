import { config } from '+config'
import { Emitter } from '+lib/Emitter'

// Island, TestMap, TestMapBig, de_grass
import map from '../maps/Island'
import { Tile, TileGrid } from '../Tile'
import { Position } from '../types'
import { createTilesFromGrid, TileCodeGrid } from './tileCodes'

interface WordEmitterEvents {
    tailUpdate: undefined
}

export class World {
    public tiles: TileGrid = createTilesFromGrid(map as TileCodeGrid)
    public emitter = new Emitter<WordEmitterEvents>('Word')

    public tick() {}

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

    private setTileAt([x, y]: Position, tile: Tile) {
        const currentTile = this.tiles?.[y]?.[x]
        if (!currentTile) throw new Error(`[Word:setTile] No tile at ${x}, ${y}`)
        this.tiles[y]![x] = tile
    }
}
