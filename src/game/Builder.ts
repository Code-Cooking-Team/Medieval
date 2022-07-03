import { Game } from '+game/Game'
import { spawners } from '+game/spawners/spawners'
import { ActorType, Position } from '+game/types'

export class Builder {
    constructor(public game: Game) {}

    public spawn(type: ActorType, position: Position) {
        const SpawnerClass = spawners[type]
        if (!SpawnerClass) return

        const spawner = new SpawnerClass(this.game)

        spawner.setPosition(position)

        if (spawner.canSpawn()) {
            spawner.spawn()
        }
    }
}
