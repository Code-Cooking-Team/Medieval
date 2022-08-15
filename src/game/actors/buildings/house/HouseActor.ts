import { config } from '+config'
import { actorByType } from '+game/actors'
import { HumanActor } from '+game/actors/units/human/HumanActor'
import { BuildingActor } from '+game/core/BuildingActor'
import { ActorType } from '+game/types'
import { random } from '+helpers'

import { HouseBlueprint } from './HouseBlueprint'

export class HouseActor extends BuildingActor {
    public type = ActorType.House
    public blueprint = actorByType[this.type].blueprint as HouseBlueprint

    public maxHp = config.house.hp
    public hp = this.maxHp
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

        const actor = this.game.spawnActor(HumanActor, this.player, this.position)

        if (!actor) return

        actor.setHome(this)
    }

    private childCount() {
        return random(config.house.newChildCountMin, config.house.newChildCountMax, true)
    }
}
