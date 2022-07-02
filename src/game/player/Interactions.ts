import { config } from '+config'
import { WalkableActor } from '+game/core/WalkableActor'
import { Game } from '+game/Game'
import { Renderer } from '+game/Renderer'
import { AnyActor, Position } from '+game/types'

import { first, uniq } from 'lodash'
import { Raycaster, Vector2 } from 'three'
import { SelectionBox } from 'three/examples/jsm/interactive/SelectionBox'

import { Builder, BuildingKey } from './Builder'
import { SelectionDiv } from './SelectionDiv'

export class Interactions {
    private builder: Builder
    private selectionBox: SelectionBox
    private selectionDiv: SelectionDiv

    private isHoldingSpaceBar = false

    constructor(public game: Game, public renderer: Renderer) {
        this.selectionDiv = new SelectionDiv(renderer.webGLRenderer)

        const el = this.renderer.webGLRenderer.domElement
        el.addEventListener('contextmenu', this.handleRightClick)
        document.addEventListener('pointerdown', this.handlePointerDown)
        document.addEventListener('pointermove', this.handlePointerMove)
        document.addEventListener('pointerup', this.handlePointerUp)

        window.addEventListener('keyup', this.handleKeyUp)
        window.addEventListener('keydown', this.handleKeyDown)

        this.builder = new Builder(game)

        this.selectionBox = new SelectionBox(
            this.renderer.rtsCamera.camera,
            this.renderer.scene,
        )
    }

    public selectBuilding(buildingKey: BuildingKey) {
        this.game.player.selectBuilding(buildingKey)
    }

    private handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === ' ') {
            // TODO move selection when holding space bar
            this.isHoldingSpaceBar = true
        }
    }

    private handleKeyUp = (event: KeyboardEvent) => {
        if (event.key === ' ') {
            this.isHoldingSpaceBar = false
        }
        if (event.key === 'Escape') {
            this.game.player.unselectActor()
            this.game.player.unselectBuilding()
        }
    }

    private handleClick = (event: MouseEvent) => {
        if (this.game.player.selectedBuilding) {
            const position = this.findPositionByMouseEvent(event)
            if (!position) return

            const currTail = this.game.word.getTile(position)
            // TODO check more tiles around base on building
            if (currTail.canBuild) {
                this.builder.build(this.game.player.selectedBuilding, position)
            }
        } else {
            const actor = first(this.selectByMouseEvent(event))
            if (actor) {
                if (event.shiftKey || event.ctrlKey) {
                    this.game.player.selectActors(
                        uniq([actor, ...this.game.player.selectedActors]),
                    )
                } else {
                    this.game.player.selectActors([actor])
                }
            } else {
                this.game.player.unselectActor()
            }
        }
    }

    private handleRightClick = (event: MouseEvent) => {
        event.preventDefault()
        const building = this.game.player.selectedBuilding
        const position = this.findPositionByMouseEvent(event)

        if (building) {
            this.game.player.unselectBuilding()
        } else if (position && this.game.player.selectedActors.length) {
            let actorCount = this.game.player.selectedActors.length
            let actorsInOrder = Math.floor(Math.sqrt(actorCount))
            let actorsInOrderOffset = Math.floor(actorsInOrder / 2)
            if (actorsInOrder < 1) actorsInOrder = 1

            this.game.player.selectedActors.forEach((actor, index) => {
                if (actor instanceof WalkableActor) {
                    let x = position[0] + (index % actorsInOrder)
                    let y =
                        position[1] + (index - (index % actorsInOrder)) / actorsInOrder

                    actor.goTo([x - actorsInOrderOffset, y - actorsInOrderOffset])
                }
            })
        }
    }

    private down = false
    private distance = 0

    private handlePointerDown = (event: PointerEvent) => {
        if (event.button !== 0) return
        this.down = true
        this.selectionDiv.onDown(event)

        this.selectionBox.startPoint.set(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1,
            0,
        )
    }

    private handlePointerMove = (event: PointerEvent) => {
        if (!this.down) return

        this.selectionDiv.onMove(event)
        this.distance += 1

        this.selectionBox.endPoint.set(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1,
            0,
        )
    }

    private handlePointerUp = (event: PointerEvent) => {
        if (!this.down) return
        this.down = false
        this.selectionDiv.onUp()

        if (this.distance < 10) {
            return this.handleClick(event)
        }

        this.distance = 0

        this.selectionBox.endPoint.set(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1,
            0.5,
        )

        this.boxSelect(event.shiftKey || event.ctrlKey)
    }

    private boxSelect(add = false) {
        const allSelected = this.selectionBox.select()

        const actors = allSelected
            .map((item) => item.userData.actor)
            .filter((actor) => !!actor) as AnyActor[]

        if (add) {
            this.game.player.selectActors(
                uniq([...actors, ...this.game.player.selectedActors]),
            )
        } else {
            this.game.player.selectActors(actors)
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

    private selectByMouseEvent = (event: MouseEvent): AnyActor[] => {
        const rayCaster = new Raycaster()
        const pointer = new Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1,
        )
        rayCaster.setFromCamera(pointer, this.renderer.rtsCamera.camera)

        const interactionObjectList = this.renderer.getInteractionObjectList()

        const intersects = rayCaster.intersectObjects(interactionObjectList, false)
        const intersectActors = intersects
            .map((intersect) => intersect.object.userData.actor as AnyActor)
            .filter((actor) => !!actor)

        return intersectActors
    }
}
