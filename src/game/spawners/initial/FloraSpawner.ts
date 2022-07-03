import { TreeActor } from '+game/actors/tree/TreeActor'
import { Builder } from '+game/Builder'
import { Game } from '+game/Game'
import { OvergrownTile, Tile } from '+game/Tile'
import { ActorType, Position } from '+game/types'
import { seededRandom } from '+helpers/random'

export class FloraSpawner {
    private rng = seededRandom(1234567)

    constructor(public game: Game) {}

    public bulkSpawnTrees() {
        const tilePositions: Position[] = []

        this.game.word.forEachTile((tile, position) => {
            const shouldSpawn = this.shouldSpawnTree(tile, position)
            if (!shouldSpawn) return

            tilePositions.push(position)

            const actor = new TreeActor(this.game, position)
            this.game.addActor(actor)
        })

        this.game.word.setMultipleTiles((tiles) => {
            tilePositions.forEach((position) => {
                const [x, y] = position
                tiles[y]![x]! = new OvergrownTile()
            })
        })
    }

    public spawnNewTree(tile: Tile, position: Position) {
        if (this.shouldSpawnTree(tile, position)) {
            const builder = new Builder(this.game)
            builder.spawn(ActorType.Tree, position)
        }
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
