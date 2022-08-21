import { config } from '+config'
import { HumanActor } from '+game/actors/units/human/HumanActor'
import { BuildingActor } from '+game/core/BuildingActor'
import { ActorType, Position } from '+game/types'
import { ClassType, random } from '+helpers'

import { BuildingTrait, BuildingTraitJSON, BuildingTraitType } from './types'

interface HouseActorConfig {
    residentsLimit: number
    spawnPosition: Position
}

const defaultConfig: HouseActorConfig = {
    residentsLimit: 5,
    spawnPosition: [0, 0],
}

export class ResidenceTrait implements BuildingTrait {
    public type = BuildingTraitType.Residence

    private newHumanCountdown = this.childCount()

    constructor(
        public buildingActor: BuildingActor,
        private config: HouseActorConfig = defaultConfig,
    ) {}

    public tick() {
        this.newHumanCountdown--
        if (this.newHumanCountdown <= 0) {
            this.newHumanCountdown = this.childCount()
            this.spawnNewHuman()
        }
    }

    public toJSON(): ResidenceTraitJSON {
        return {
            type: this.type,
            newChildCount: this.newHumanCountdown,
            config: this.config,
        }
    }

    public fromJSON(json: ResidenceTraitJSON) {
        this.newHumanCountdown = json.newChildCount
        this.config = json.config
    }

    private spawnNewHuman() {
        const residents = this.findResidents()

        if (residents.length >= this.config.residentsLimit) return

        const actor = this.buildingActor.game.spawnActor(
            HumanActor,
            this.buildingActor.player,
            this.config.spawnPosition,
        )

        if (!actor) return

        actor.setHome(this.buildingActor)
    }

    private findResidents(): HumanActor[] {
        const humans = this.buildingActor.game.findActorsByType(
            ActorType.Human,
        ) as HumanActor[]
        return humans.filter((human) => human.home === this.buildingActor)
    }

    private childCount(): number {
        return random(config.house.newChildCountMin, config.house.newChildCountMax, true)
    }
}

export interface ResidenceTraitJSON extends BuildingTraitJSON {
    newChildCount: number
    config: HouseActorConfig
}

export type ResidenceTraitClass<T extends ResidenceTrait = ResidenceTrait> = ClassType<
    T,
    ConstructorParameters<typeof ResidenceTrait>
>
