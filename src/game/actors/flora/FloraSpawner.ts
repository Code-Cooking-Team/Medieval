import { BushActor } from '+game/actors/flora/bush/BushActor'
import { canGrowTree } from '+game/actors/flora/tree/canGrowTree'
import { TreeActor } from '+game/actors/flora/tree/TreeActor'
import { type Game } from '+game/Game'
import { type NaturePlayer } from '+game/player/NaturePlayer'
import { type Position } from '+game/types'
import { OvergrownTile } from '+game/world/Tile'
import { TileType } from '+game/world/types'
import { seededRandom } from '+helpers/random'

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
    private rng: ReturnType<typeof seededRandom>
    private bushRng: ReturnType<typeof seededRandom>

    constructor(
        public game: Game,
        public player: NaturePlayer,
        seed?: number,
    ) {
        this.rng = seededRandom(seed)
        this.bushRng = seededRandom(seed === undefined ? undefined : seed ^ 0x42b7d18c)
    }

    public bulkSpawnPlants() {
        const tilePositions: Position[] = []

        this.game.world.forEachTile((tile, position) => {
            if (canGrowTree(this.game, tile, position, this.rng)) {
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
}
