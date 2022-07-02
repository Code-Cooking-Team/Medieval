import { config } from '+config'
import { ActorRenderer } from '+game/renderer/lib/ActorRenderer'
import { Tile } from '+game/Tile'
import { ActorType } from '+game/types'
import { loadGLTF } from '+helpers/three'

import { PointLight } from 'three'

import houseUrl from './assets/models/house.gltf'
import { HouseActor } from './HouseActor'

const houseModel = loadGLTF(houseUrl)

export class HouseActorRenderer extends ActorRenderer<HouseActor> {
    public actorType = ActorType.House

    public createActorModel(actor: HouseActor, tile: Tile) {
        const { group, interactionShape } = super.createActorModel(actor, tile)

        houseModel.then((model) => {
            group.add(model.clone())
        })

        if (config.lumberjack.cabinLight) {
            const light = new PointLight(0xfa840e, 1, 15)
            light.position.set(0, 3, 0)
            group.add(light)
        }

        return { group, interactionShape }
    }
}
