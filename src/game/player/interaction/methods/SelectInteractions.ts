import { isWalkableActor } from '+game/actors/helpers'
import { squareFloodFill } from '+game/algorithm/squareFloodFill'
import { Actor } from '+game/core/Actor'
import { Game } from '+game/Game'
import { SelectionDiv } from '+game/player/interaction/methods/lib/SelectionDiv'
import { Renderer } from '+game/Renderer'

import { first, uniq, xor } from 'lodash'
import { SelectionBox } from 'three/examples/jsm/interactive/SelectionBox'

import { RaycastFinder } from './lib/RaycastFinder'

const LEFT_MOUSE_BUTTON = 0
const RIGHT_MOUSE_BUTTON = 2

export class SelectInteractions {
    private finder: RaycastFinder
    private selectionBox: SelectionBox
    private selectionDiv: SelectionDiv
    private el: HTMLCanvasElement

    constructor(public game: Game, public renderer: Renderer) {
        this.el = this.renderer.webGLRenderer.domElement
        this.selectionDiv = new SelectionDiv(renderer.webGLRenderer)
        this.finder = new RaycastFinder(game, renderer)
        this.selectionBox = new SelectionBox(
            this.renderer.rtsCamera.camera,
            this.renderer.scene,
        )
    }

    public addEventListeners() {
        this.el.addEventListener('contextmenu', this.handleContextmenu)
        this.el.addEventListener('pointerdown', this.handlePointerDown)
        document.addEventListener('pointermove', this.handlePointerMove)
        document.addEventListener('pointerup', this.handlePointerUp)
        this.el.addEventListener('dblclick', this.handleDoubleClick)
    }

    public removeEventListeners() {
        this.el.removeEventListener('contextmenu', this.handleContextmenu)
        this.el.removeEventListener('pointerdown', this.handlePointerDown)
        document.removeEventListener('pointermove', this.handlePointerMove)
        document.removeEventListener('pointerup', this.handlePointerUp)
    }

    private down = false
    private distance = 0

    private handlePointerDown = (event: PointerEvent) => {
        const selectedBuilding = this.game.player.selectedBuilding
        this.down = true

        if (event.button !== LEFT_MOUSE_BUTTON || selectedBuilding) return

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

        if (event.button === RIGHT_MOUSE_BUTTON) {
            this.handleRightClick(event)
            return
        }

        this.selectionDiv.onUp()

        if (this.distance < 10) {
            this.handleClick(event)
            return
        }

        this.distance = 0

        this.selectionBox.endPoint.set(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1,
            0.5,
        )

        this.boxSelect(event.shiftKey || event.ctrlKey)
    }

    private handleClick = (event: MouseEvent) => {
        const currentSelected = this.game.player.selectedActors
        const shiftKey = event.shiftKey || event.ctrlKey

        const actor = this.finder.findSingleActorByMouseEvent(event)

        if (!actor) {
            if (shiftKey) return
            this.game.player.unselectActor()
            return
        }

        if (shiftKey) {
            if (currentSelected.includes(actor)) {
                this.game.player.selectActors(
                    currentSelected.filter((item) => item !== actor),
                )
            } else {
                this.game.player.selectActors(uniq([actor, ...currentSelected]))
            }
        } else {
            this.game.player.selectActors([actor])
        }
    }

    private handleContextmenu = (event: MouseEvent) => {
        event.preventDefault()
    }

    private handleRightClick = (event: MouseEvent) => {
        event.preventDefault()
        const currentSelected = this.game.player.selectedActors
        const position = this.finder.findPositionByMouseEvent(event)

        if (!position || !currentSelected.length) return

        const interactionActor = this.finder.findActorsByMouseEvent(event)

        for (const actor of interactionActor) {
            const interactionHappened = actor.interact(currentSelected)
            if (interactionHappened) return
        }

        const walkableActors = currentSelected.filter(isWalkableActor)

        const positions = squareFloodFill(position, walkableActors.length, (position) => {
            if (!this.game.world.hasTile(position)) return false
            return this.game.world.getTile(position).canWalk
        })

        walkableActors.forEach((actor, index) => {
            const newPosition = positions[index]
            if (newPosition) actor.goTo(newPosition)
        })
    }

    private handleDoubleClick = () => {
        const currentSelected = first(this.game.player.selectedActors)
        if (!currentSelected) return

        const actors = this.game.findActorsByType(currentSelected.type)
        this.game.player.selectActors(actors)
    }

    private boxSelect(add = false) {
        const currentSelected = this.game.player.selectedActors
        const selectedMeshes = this.selectionBox.select()

        const newSelected = selectedMeshes
            .map((item) => item.userData.actor)
            .filter((actor) => !!actor) as Actor[]

        const maxSelectImportance = newSelected.reduce((current, actor) => {
            return Math.max(current, actor.getSelectedImportance())
        }, 0)

        const importantActors = newSelected.filter(
            (actor) => actor.getSelectedImportance() === maxSelectImportance,
        )

        if (!add) {
            this.game.player.selectActors(importantActors)
        } else {
            if (importantActors.every((item) => currentSelected.includes(item))) {
                this.game.player.selectActors(xor(currentSelected, importantActors))
            } else {
                this.game.player.selectActors(
                    uniq([...importantActors, ...currentSelected]),
                )
            }
        }
    }
}
