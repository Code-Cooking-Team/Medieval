import { BushActor } from '+game/actors/flora/bush/BushActor'
import { TreeActor } from '+game/actors/flora/tree/TreeActor'
import { Game } from '+game/Game'
import { NaturePlayer } from '+game/player/NaturePlayer'
import { ActorType, Position } from '+game/types'
import { OvergrownTile, Tile } from '+game/world/Tile'
import { TileType } from '+game/world/types'
import { seededRandom } from '+helpers'

const bushNeighbors: Position[] = [
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
]

export class FloraSpawner {
    private rng = seededRandom()
    private bushRng = seededRandom()

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
            }
        })

        this.game.world.setMultipleTiles((set, get) => {
            tilePositions.forEach((position) => {
                const tile = get(position)
                set(position, new OvergrownTile(tile))
            })
        })

        const occupied = new Set(
            this.game.actors.map((actor) => actor.position.join(',')),
        )
        for (const position of tilePositions) {
            if (this.bushRng() < 0.2) {
                this.growBushPatch(position, Math.floor(this.bushRng(3, 8)), occupied)
            }
        }

        this.game.world.forEachTile((tile, position) => {
            if (!BushActor.growsOn(tile.type) || occupied.has(position.join(','))) return

            const chance = tile.type === TileType.Forest ? 0.002 : 0.0008
            if (this.bushRng() < chance) {
                this.growBushPatch(position, Math.floor(this.bushRng(2, 5)), occupied)
            }
        })
    }

    public spawnNewTree(tile: Tile, position: Position) {
        if (this.shouldSpawnTree(tile, position)) {
            this.game.spawnActor(TreeActor, this.player, position)
        }
    }

    private growBushPatch(origin: Position, size: number, occupied: Set<string>) {
        const frontier: Position[] = []
        const seen = new Set<string>()
        const [originX, originY] = origin
        const addCandidate = (position: Position) => {
            const [x, y] = position
            if (Math.max(Math.abs(x - originX), Math.abs(y - originY)) > 3) return

            const key = position.join(',')
            if (seen.has(key) || occupied.has(key)) return

            const tile = this.game.world.hasTile(position)
            if (!tile || !BushActor.growsOn(tile.type)) return

            seen.add(key)
            frontier.push(position)
        }

        addCandidate(origin)
        if (frontier.length === 0) {
            for (const [dx, dy] of bushNeighbors) {
                addCandidate([originX + dx, originY + dy])
            }
            if (frontier.length === 0) return

            const start = frontier[Math.floor(this.bushRng(0, frontier.length))]!
            frontier.length = 0
            seen.clear()
            addCandidate(start)
        }

        // Grow from the edges of each patch so the bushes form connected clumps.
        for (let count = 0; count < size && frontier.length > 0; count++) {
            const index = Math.floor(this.bushRng(0, frontier.length))
            const position = frontier.splice(index, 1)[0]!
            const [x, y] = position
            occupied.add(position.join(','))
            this.game.addActor(new BushActor(this.game, this.player, position))

            for (const [dx, dy] of bushNeighbors) addCandidate([x + dx, y + dy])
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
