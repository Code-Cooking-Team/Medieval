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

// Covers the shelf footprint, shifted copies of cliff faces, and their approaches.
const CLIFF_TERRAIN_RADIUS = 12
const CLIFF_REVISION_REGION_SIZE = 32

export class World {
    public tileRevision = 0
    public cliffRevision = 0
    public rockRevision = 0
    public emitter = new Emitter<{ tailUpdate: undefined }>('Word')
    private readonly cliffRegionRevisions = new Map<string, number>()
    private tileBatchDepth = 0
    private readonly tileChangeTrackers = new Set<Set<number>>()

    public get batchingTiles() {
        return this.tileBatchDepth > 0
    }

    public trackTileChanges(changes: Set<number>) {
        this.tileChangeTrackers.add(changes)
        return () => this.tileChangeTrackers.delete(changes)
    }

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
        this.batchTileUpdates(() => this.setTileAt(position, tile))
    }

    public setMultipleTiles(
        setCallback: (
            set: (position: Position, tile: Tile) => void,
            get: (position: Position) => Tile,
            tiles: Tile[][],
        ) => void,
    ) {
        this.batchTileUpdates(() =>
            setCallback(this.setTileAt.bind(this), this.getTile.bind(this), this.tiles),
        )
    }

    public batchTileUpdates<T>(update: () => T): T {
        const revision = this.tileRevision
        this.tileBatchDepth++
        try {
            return update()
        } finally {
            this.tileBatchDepth--
            if (!this.batchingTiles && this.tileRevision !== revision)
                this.emitter.emit('tailUpdate')
        }
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
        const index = y * this.tiles[0]!.length + x
        for (const changes of this.tileChangeTrackers) changes.add(index)

        if (currentTile.type === TileType.Rock || tile.type === TileType.Rock)
            this.rockRevision++
        // Cliff faces and shelves sample local terrain around a Step tile.
        // Include the old tile because this replacement may remove the source.
        if (
            currentTile.type === TileType.Step ||
            this.hasTileTypeNear(x, y, TileType.Step, CLIFF_TERRAIN_RADIUS)
        ) {
            this.cliffRevision++
            const col = Math.floor(x / CLIFF_REVISION_REGION_SIZE)
            const row = Math.floor(y / CLIFF_REVISION_REGION_SIZE)
            this.cliffRegionRevisions.set(`${col},${row}`, this.cliffRevision)
        }
    }

    public getCliffRevisionForArea(
        left: number,
        top: number,
        right: number,
        bottom: number,
    ) {
        const size = CLIFF_REVISION_REGION_SIZE
        const firstCol = Math.max(0, Math.floor((left - CLIFF_TERRAIN_RADIUS) / size))
        const firstRow = Math.max(0, Math.floor((top - CLIFF_TERRAIN_RADIUS) / size))
        const lastCol = Math.floor((right + CLIFF_TERRAIN_RADIUS) / size)
        const lastRow = Math.floor((bottom + CLIFF_TERRAIN_RADIUS) / size)
        let revision = 0
        for (let row = firstRow; row <= lastRow; row++) {
            for (let col = firstCol; col <= lastCol; col++) {
                revision = Math.max(
                    revision,
                    this.cliffRegionRevisions.get(`${col},${row}`) ?? 0,
                )
            }
        }
        return revision
    }

    public hasTileTypeNear(x: number, y: number, type: TileType, radius: number) {
        const width = this.tiles[0]!.length
        for (
            let row = Math.max(0, y - radius);
            row <= Math.min(this.tiles.length - 1, y + radius);
            row++
        ) {
            for (
                let col = Math.max(0, x - radius);
                col <= Math.min(width - 1, x + radius);
                col++
            ) {
                if (this.tiles[row]![col]!.type === type) return true
            }
        }
        return false
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
