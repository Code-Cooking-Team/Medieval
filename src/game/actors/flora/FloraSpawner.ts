import { TreeActor } from '+game/actors/flora/tree/TreeActor'
import { type Game } from '+game/Game'
import { type NaturePlayer } from '+game/player/NaturePlayer'
import { type Position } from '+game/types'
import { OvergrownTile, type Tile } from '+game/world/Tile'
import { seededRandom } from '+helpers/random'

export class FloraSpawner {
    private rng = seededRandom()

    constructor(
        public game: Game,
        public player: NaturePlayer,
    ) {}

    public bulkSpawnTrees() {
        const tilePositions: Position[] = []

        this.game.world.forEachTile((tile, position) => {
            const shouldSpawn = this.shouldSpawnTree(tile, position)
            if (!shouldSpawn) return

            tilePositions.push(position)

            const actor = new TreeActor(this.game, this.player, position)
            this.game.addActor(actor)
        })

        this.game.world.setMultipleTiles((set, get) => {
            tilePositions.forEach((position) => {
                const tile = get(position)
                set(position, new OvergrownTile(tile))
            })
        })
    }

    private shouldSpawnTree(tile: Tile, position: Position) {
        // No three chance so no tree
        if (tile.treeChance === 0) return false

        // Randomly by tree chance from tile
        if (this.rng() > tile.treeChance) return false

        // Check if is a tree or other actor already here
        if (this.game.findActorsByPosition(position, 1).length > 0) return false

        return true
    }
}
