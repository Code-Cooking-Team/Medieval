import { HumanActor } from '+game/actors/units/human/HumanActor'
import { ACTOR_MODEL_OBJECT3D_NAME } from '+game/const'
import { Game } from '+game/Game'
import { ClassType } from '+helpers'

import { Group, Object3D } from 'three'

import { ProfessionType } from './types'

export abstract class Profession {
    public type = ProfessionType.Empty
    public selectImportance = 4
    public isPristine = true

    constructor(public game: Game, public actor: HumanActor) {}

    public getAttackDamage(): number {
        return 0
    }

    public getModel(): Object3D {
        const group = new Group()
        group.name = ACTOR_MODEL_OBJECT3D_NAME
        return group
    }

    public async tick(): Promise<void> {
        if (this.isPristine) this.isPristine = false
    }

    public reset(): void {
        this.isPristine = true
    }

    public toJSON(): ProfessionJSON {
        return {
            type: this.type,
            selectImportance: this.selectImportance,
            isPristine: this.isPristine,
        }
    }

    public fromJSON(json: ProfessionJSON) {
        this.type = json.type
        this.selectImportance = json.selectImportance
        this.isPristine = json.isPristine
    }
}

export interface ProfessionJSON {
    type: ProfessionType
    selectImportance: number
    isPristine: boolean
}

export type ProfessionClass<T extends Profession = Profession> = ClassType<
    T,
    ConstructorParameters<typeof Profession>
>
