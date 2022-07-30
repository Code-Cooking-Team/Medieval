import { Game } from '+game/Game'
import { HumanPlayer } from '+game/player/HumanPlayer'
import { ActorRenderer } from '+game/renderer/lib/ActorRenderer'
import { ActorType } from '+game/types'
import { Tile } from '+game/world/Tile'
import { loadGLTF } from '+helpers'

import { LOD } from 'three'

import houseUrl from '../house/models/house3.gltf'
import { BarracksActor } from './BarracksActor'

const houseModel = loadGLTF(houseUrl)

export class BarracksRenderer extends ActorRenderer<BarracksActor> {
    public actorType = ActorType.Barracks

    public createActorModel(actor: BarracksActor, tile: Tile) {
        const { group, interactionShape } = super.createActorModel(actor, tile)

        const lod = new LOD()
        houseModel.then((model) => {
            model.children.forEach((child, index) => {
                child.castShadow = true
                child.receiveShadow = true
                lod.addLevel(child.clone(), (model.children.length - index - 1) * 80)
            })
        })

        group.add(lod)

        return { group, interactionShape }
    }
}
