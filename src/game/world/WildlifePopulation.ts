import { BoarActor } from '+game/actors/units/boars/BoarActor'
import { DeerActor } from '+game/actors/units/deer/DeerActor'
import type { Game } from '+game/Game'
import type { Player } from '+game/player/types'
import { ActorType, type Position } from '+game/types'
import { distanceBetweenPoints } from '+helpers/math'
import { seededRandom } from '+helpers/random'

import { TileType } from './types'

const species = [
    { type: ActorType.Deer, actor: DeerActor, cap: 24, interval: 90_000 },
    { type: ActorType.Boar, actor: BoarActor, cap: 6, interval: 180_000 },
] as const

type WildlifeType = (typeof species)[number]['type']
export type WildlifeJSON = Record<WildlifeType, number>

const clearingOffsets: Position[] = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [-1, -1],
    [-1, 1],
    [1, -1],
]

export class WildlifePopulation {
    private remaining: WildlifeJSON = {
        [ActorType.Deer]: species[0].interval,
        [ActorType.Boar]: species[1].interval,
    }

    constructor(
        private readonly game: Game,
        private readonly nature: Player,
    ) {}

    public seed(seed: number) {
        const roll = seededRandom(seed)
        for (const entry of species) {
            for (
                let count = this.game.findActorsByType(entry.type).length;
                count < entry.cap;
                count++
            ) {
                if (!this.spawn(entry, roll)) break
            }
        }
    }

    public tick(deltaMs: number) {
        const counts: WildlifeJSON = { [ActorType.Deer]: 0, [ActorType.Boar]: 0 }
        for (const actor of this.game.actors) {
            if (
                (actor.type === ActorType.Deer || actor.type === ActorType.Boar) &&
                !actor.isDead()
            ) {
                counts[actor.type]++
            }
        }

        for (const entry of species) {
            const { type, cap, interval } = entry
            if (counts[type] >= cap) {
                this.remaining[type] = interval
                continue
            }

            this.remaining[type] -= deltaMs
            if (this.remaining[type] > 0) continue

            this.remaining[type] = this.spawn(entry, Math.random) ? interval : 5_000
        }
    }

    private spawn(entry: (typeof species)[number], roll: () => number) {
        const trees: Position[] = []
        const animals: Position[] = []
        const occupied = new Set<string>()
        for (const actor of this.game.actors) {
            if (actor.isDead()) continue
            occupied.add(actor.position.join(','))
            if (actor.type === ActorType.Tree) trees.push(actor.position)
            if (actor.type === ActorType.Deer || actor.type === ActorType.Boar) {
                animals.push(actor.position)
            }
        }

        const start = Math.floor(roll() * trees.length)
        for (let index = 0; index < trees.length; index++) {
            const [x, y] = trees[(start + index) % trees.length]!
            for (const [dx, dy] of clearingOffsets) {
                const position: Position = [x + dx, y + dy]
                const tile = this.game.world.hasTile(position)
                if (!tile?.canWalk || tile.type !== TileType.Forest || tile.buildingId)
                    continue
                if (occupied.has(position.join(','))) continue
                if (animals.some((animal) => distanceBetweenPoints(animal, position) < 6))
                    continue

                return this.game.spawnActor<DeerActor | BoarActor>(
                    entry.actor,
                    this.nature,
                    position,
                )
            }
        }
    }

    public toJSON(): WildlifeJSON {
        return { ...this.remaining }
    }

    public restore(json: WildlifeJSON) {
        this.remaining = { ...json }
    }
}
