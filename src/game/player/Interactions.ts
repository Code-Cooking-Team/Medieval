import { config } from '+config'
import { StaticActor } from '+game/core/StaticActor'
import { WalkableActor } from '+game/core/WalkableActor'
import { Game } from '+game/Game'
import { Renderer } from '+game/Renderer'
import { AnyActor, Position } from '+game/types'
import { Emitter } from '+lib/Emitter'

import { first } from 'lodash'
import { Raycaster, Vector2 } from 'three'

import { Builder, BuildingKey } from './Builder'

export class Interactions {
    private builder: Builder

    constructor(public game: Game, public renderer: Renderer) {
        this.renderer.webGLRenderer.domElement.addEventListener('click', this.handleClick)
        this.renderer.webGLRenderer.domElement.addEventListener(
            'contextmenu',
            this.handleRightClick,
        )

        this.builder = new Builder(game)
    }

    public destruct() {
        this.renderer.webGLRenderer.domElement.removeEventListener(
            'click',
            this.handleClick,
        )
        this.renderer.webGLRenderer.domElement.removeEventListener(
            'contextmenu',
            this.handleRightClick,
        )
    }

    public selectBulding(buildingKey: BuildingKey) {
        this.game.player.selectBuilding(buildingKey)
    }

    private handleClick = (event: MouseEvent): void => {
        if (this.game.player.selectedBuilding) {
            const position = this.findPositionByMouseEvent(event)
            if (!position) return

            const currTail = this.game.word.getTile(position)
            // TODO check more tiles around base on building
            if (currTail.canBuild) {
                this.builder.build(this.game.player.selectedBuilding, position)
            }
        } else {
            const actor = this.selectByMouseEvent(event)
            if (actor) {
                this.game.player.selectActor(actor)
            } else {
                this.game.player.unselectActor()
            }
        }
    }

    private handleRightClick = (event: MouseEvent): void => {
        event.preventDefault()
        const building = this.game.player.selectedBuilding
        const position = this.findPositionByMouseEvent(event)

        if (building) {
            this.game.player.unselectBuilding()
        } else if (
            position &&
            this.game.player.selectedActor &&
            this.game.player.selectedActor instanceof WalkableActor
        ) {
            this.game.player.selectedActor.goTo(position)
        }
    }

    private findPositionByMouseEvent = (event: MouseEvent): Position | undefined => {
        const rayCaster = new Raycaster()
        const pointer = new Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1,
        )
        rayCaster.setFromCamera(pointer, this.renderer.rtsCamera.camera)

        const intersects = rayCaster.intersectObjects(this.renderer.getGroundChildren())
        const intersectPoint = intersects[0]?.point

        if (!intersectPoint) return

        const [width, height] = this.game.word.getRealSize()

        const x = Math.round((intersectPoint.x + width / 2) / config.renderer.tileSize)
        const y = Math.round((intersectPoint.z + height / 2) / config.renderer.tileSize)

        return [x, y]
    }

    private selectByMouseEvent = (event: MouseEvent): AnyActor | undefined => {
        const rayCaster = new Raycaster()
        const pointer = new Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1,
        )
        rayCaster.setFromCamera(pointer, this.renderer.rtsCamera.camera)

        const interactionObjectList = this.renderer.getInteractionObjectList()

        const intersects = rayCaster.intersectObjects(interactionObjectList, false)
        const intersectObject = first(intersects)
        const actor = intersectObject?.object.userData.actor

        return actor
    }
}
