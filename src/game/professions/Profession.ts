import { ACTOR_MODEL_OBJECT3D_NAME } from '+game/const'
import { Game } from '+game/Game'

import { Group, Object3D } from 'three'

export abstract class Profession {
    public selectImportance = 4
    public name = 'No profession name'

    constructor(public game: Game) {}

    public getAttackDamage(): number {
        return 0
    }

    public getModel(): Object3D {
        const group = new Group()
        group.name = ACTOR_MODEL_OBJECT3D_NAME
        return group
    }

    tick(): void {}
}
