import { config } from '+config'

import { Mesh, MeshStandardMaterial, SphereGeometry } from 'three'

import { Profession } from './Profession'
import { ProfessionType } from './types'

export class GuardianProfession extends Profession {
    public type = ProfessionType.Guardian
    public selectImportance = 5

    protected material = new MeshStandardMaterial({ color: config.guardian.color })
    protected geometry = new SphereGeometry(0.5, 5, 5)

    public getAttackDamage(): number {
        return config.guardian.attackDamage
    }

    public getModel() {
        const group = super.getModel()

        const body = new Mesh(this.geometry, this.material)
        const pike = new Mesh(
            this.geometry,
            new MeshStandardMaterial({ color: 0xcccccc }),
        )

        body.castShadow = true
        body.receiveShadow = true
        body.scale.y = 2
        body.scale.z = 0.5
        body.position.y = 0.5

        pike.position.z = 0.25
        pike.position.y = 1
        pike.position.x = -0.25
        pike.scale.x = 0.1
        pike.scale.y = -0.01
        pike.scale.z = 2
        pike.rotation.x = Math.PI / -4
        pike.name = 'weapon'

        group.add(body)
        group.add(pike)

        return group
    }
}
