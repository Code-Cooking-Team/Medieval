import { BushActor } from '+game/actors/flora/bush/BushActor'
import { TreeActor } from '+game/actors/flora/tree/TreeActor'
import { Game } from '+game/Game'
import { NaturePlayer } from '+game/player/NaturePlayer'
import { ActorType, Position } from '+game/types'
import { OvergrownTile, Tile } from '+game/world/Tile'
import { TileType } from '+game/world/types'
import { seededRandom } from '+helpers'

export class FloraSpawner {
    private rng = seededRandom()

    constructor(
        public game: Game,
        public player: NaturePlayer,
    ) {}

    public bulkSpawnPlants() {
        const tilePositions: Position[] = []

        this.game.world.forEachTile((tile, position) => {
            if (this.shouldSpawnTree(tile, position)) {
                tilePositions.push(position)
                this.game.addActor(new TreeActor(this.game, this.player, position))
            } else if (BushActor.growsOn(tile.type)) {
                const chance = tile.type === TileType.Forest ? 0.035 : 0.008
                if (this.rng() < chance) {
                    this.game.addActor(new BushActor(this.game, this.player, position))
                }
            }
        })

        this.game.world.setMultipleTiles((set, get) => {
            tilePositions.forEach((position) => {
                const tile = get(position)
                set(position, new OvergrownTile(tile))
            })
        })
    }

    public spawnNewTree(tile: Tile, position: Position) {
        if (this.shouldSpawnTree(tile, position)) {
            this.game.spawnActor(TreeActor, this.player, position)
        }
    }

    private shouldSpawnTree(tile: Tile, position: Position) {
        // No three chance so no tree
        if (tile.treeChance === 0) return false

        // Randomly by tree chance from tile
        if (this.rng() > tile.treeChance) return false

        return !this.game
            .findActorsByPosition(position, 1)
            .some((actor) => actor.type !== ActorType.Bush)
    }
}
