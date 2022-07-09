import { config } from '+config'
import { Builder } from '+game/Builder'
import { BuildingActor } from '+game/core/BuildingActor'
import { ActorType, Grid } from '+game/types'
import { random } from '+helpers/basic'

import { HumanActor } from '../human/HumanActor'

export class HouseActor extends BuildingActor {
    public type = ActorType.House

    public grid: Grid = [
        ['.', '.', '.', '.', '.', '.', '.', '.', '.'],
        ['.', 'W', 'W', 'W', 'W', 'W', 'W', '.', 'W'],
        ['.', 'W', '!', '!', '!', '!', 'W', 'W', '.'],
        ['.', 'W', '!', 'W', 'W', 'W', 'W', '.', 'W'],
        ['.', 'W', '!', 'W', '.', '.', '.', '.', '.'],
        ['.', 'W', '!', '!', '.', '.', '.', '.', '.'],
        ['.', 'W', '!', 'W', '.', '.', '.', '.', '.'],
        ['.', 'W', 'W', 'W', '.', '.', '.', '.', '.'],
        ['.', '.', '.', '.', '.', '.', '.', '.', '.'],
    ]

    public maxHp = config.house.hp
    public residentsLimit = 6

    private newChildCount = this.childCount()

    public tick(): void {
        this.newChildCount--
        if (this.newChildCount <= 0) {
            this.newChildCount = this.childCount()
            this.spawnNewHuman()
        }
    }

    private spawnNewHuman() {
        const humans = this.game.findActorsByType(ActorType.Human) as HumanActor[]
        const residents = humans.filter((human) => human.home === this)

        if (residents.length >= this.residentsLimit) return

        const builder = new Builder(this.game)
        const actor = builder.spawn(ActorType.Human, this.position) as HumanActor

        if (!actor) return

        actor.setHome(this)
    }

    private childCount() {
        return random(config.house.newChildCountMin, config.house.newChildCountMax, true)
    }
}
