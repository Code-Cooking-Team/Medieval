import { config } from '+config'
import { Emitter } from '+lib/Emitter'

import { type Position } from '../types'
import { getTileByJSON, type Tile } from './Tile'
import { type TileGrid, type TileJSON, TileType } from './types'
import { type WaterRegion } from './water'

export interface WordJSON {
    tiles: TileJSON[][]
    waterRegions?: WaterRegion[]
    seed?: number
}

export class World {
    public tileRevision = 0
    public emitter = new Emitter<{ tailUpdate: undefined }>('Word')

    constructor(
        public tiles: TileGrid,
        public readonly waterRegions = legacyWaterRegions(tiles),
        public readonly seed?: number,
    ) {}

    public hasTile([x, y]: Position) {
        return this.tiles?.[y]?.[x]
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
            waterRegions: this.waterRegions,
            seed: this.seed,
        }
    }

    static fromJSON(json: WordJSON) {
        const tiles = json.tiles.map((row) => row.map(getTileByJSON))
        return new World(tiles, json.waterRegions, json.seed)
    }

    private setTileAt([x, y]: Position, tile: Tile) {
        const currentTile = this.tiles?.[y]?.[x]
        if (!currentTile) throw new Error(`[Word:setTile] No tile at ${x}, ${y}`)
        this.tiles[y]![x] = tile
        this.tileRevision++
    }
}

// Older saves recorded water only through WaterTile. Keep the old surface level
// while splitting the footprint into connected patches.
function legacyWaterRegions(tiles: TileGrid): WaterRegion[] {
    const remaining = new Set<number>()
    const width = tiles[0]?.length ?? 0
    tiles.forEach((row, y) =>
        row.forEach((tile, x) => {
            if (tile.type === TileType.Water) remaining.add(y * width + x)
        }),
    )

    const regions: WaterRegion[] = []
    for (const start of remaining) {
        remaining.delete(start)
        const patch: Position[] = [[start % width, Math.floor(start / width)]]
        for (const [x, y] of patch) {
            const neighbors: Position[] = [
                [x - 1, y],
                [x + 1, y],
                [x, y - 1],
                [x, y + 1],
            ]
            for (const [nx, ny] of neighbors) {
                if (nx >= 0 && nx < width && remaining.delete(ny * width + nx)) {
                    patch.push([nx, ny])
                }
            }
        }
        regions.push({ kind: 'lake', tiles: patch, elevation: -0.5 })
    }
    return regions
}
