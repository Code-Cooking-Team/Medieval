import { isBuildingActor, isWalkableActor } from '+game/actors/helpers'
import { squareFloodFill } from '+game/algorithm/squareFloodFill'
import { type Actor } from '+game/core/Actor'
import { CAMERA_GESTURE_START } from '+game/core/RTSCamera'
import { toStep } from '+game/core/StandingSurfaces'
import { type Game } from '+game/Game'
import { type HumanPlayer } from '+game/player/HumanPlayer'
import type { ControlHints } from '+game/player/interaction/ControlHints'
import { SelectionDiv } from '+game/player/interaction/methods/lib/SelectionDiv'
import { Player } from '+game/player/types'
import { type Renderer } from '+game/Renderer'

import { first, uniq, xor } from 'lodash'
import { Scene, Vector2 } from 'three'
import { SelectionBox } from 'three/addons/interactive/SelectionBox.js'

import { RaycastFinder } from './lib/RaycastFinder'

const LEFT_MOUSE_BUTTON = 0
const RIGHT_MOUSE_BUTTON = 2
const DRAG_THRESHOLD_PX = 5

export class SelectInteractions {
    private finder: RaycastFinder
    private selectionBox: SelectionBox
    private selectionTargets = new Scene()
    private selectionDiv: SelectionDiv
    private el: HTMLCanvasElement
    private hints?: ControlHints

    constructor(
        public game: Game,
        public renderer: Renderer,
        public player: HumanPlayer,
        private onHintsChanged?: (hints?: ControlHints) => void,
    ) {
        this.el = this.renderer.webGLRenderer.domElement
        this.selectionDiv = new SelectionDiv(renderer.webGLRenderer)
        this.finder = new RaycastFinder(game, renderer)
        this.selectionBox = new SelectionBox(
            this.renderer.rtsCamera.camera,
            this.selectionTargets,
        )
    }

    public enable() {
        this.el.addEventListener('contextmenu', this.handleContextmenu)
        this.el.addEventListener('pointerdown', this.handlePointerDown)
        this.el.addEventListener('pointermove', this.updateHints)
        this.el.addEventListener('pointerleave', this.resetHints)
        this.el.addEventListener('wheel', this.resetHints)
        window.addEventListener('blur', this.resetHints)
        this.player.emitter.on('selectActors', this.resetHints)
        this.player.emitter.on('unselectActors', this.resetHints)
        document.addEventListener('pointermove', this.handlePointerMove)
        document.addEventListener('pointerup', this.handlePointerUp)
        document.addEventListener('pointercancel', this.cancelSelection)
        this.el.addEventListener(CAMERA_GESTURE_START, this.cancelSelection)
        this.el.addEventListener('dblclick', this.handleDoubleClick)
        this.resetHints()
        this.onHintsChanged?.(this.hints)
    }

    public disable() {
        this.el.removeEventListener('contextmenu', this.handleContextmenu)
        this.el.removeEventListener('pointerdown', this.handlePointerDown)
        this.el.removeEventListener('pointermove', this.updateHints)
        this.el.removeEventListener('pointerleave', this.resetHints)
        this.el.removeEventListener('wheel', this.resetHints)
        window.removeEventListener('blur', this.resetHints)
        this.player.emitter.off('selectActors', this.resetHints)
        this.player.emitter.off('unselectActors', this.resetHints)
        this.el.removeEventListener('dblclick', this.handleDoubleClick)
        document.removeEventListener('pointermove', this.handlePointerMove)
        document.removeEventListener('pointerup', this.handlePointerUp)
        document.removeEventListener('pointercancel', this.cancelSelection)
        this.el.removeEventListener(CAMERA_GESTURE_START, this.cancelSelection)
        this.cancelSelection()
        this.setHints()
    }

    private cancelSelection = () => {
        this.resetHints()
        this.pressedButton = undefined
        this.selectionDiv.onUp()
    }

    private pressedButton?: number
    private pointerStart = new Vector2()

    private handlePointerDown = (event: PointerEvent) => {
        if (event.pointerType === 'touch' && !event.isPrimary) return
        if (this.player.selectedBuilding) return
        if (event.button !== LEFT_MOUSE_BUTTON && event.button !== RIGHT_MOUSE_BUTTON)
            return

        this.pressedButton = event.button
        if (event.button !== LEFT_MOUSE_BUTTON) return

        this.pointerStart.set(event.clientX, event.clientY)
        this.selectionDiv.onDown(event)
        this.selectionBox.startPoint.set(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1,
            0,
        )
    }

    private handlePointerMove = (event: PointerEvent) => {
        if (this.pressedButton !== LEFT_MOUSE_BUTTON) return

        this.selectionDiv.onMove(event)
    }

    private setHints(hints?: ControlHints) {
        if (
            this.hints?.mode === hints?.mode &&
            this.hints?.left === hints?.left &&
            this.hints?.right === hints?.right
        )
            return
        this.hints = hints
        this.onHintsChanged?.(hints)
    }

    private resetHints = () => {
        this.setHints(
            this.player.selectedActors.length ? { mode: 'selection' } : { mode: 'idle' },
        )
    }

    private updateHints = (event: PointerEvent) => {
        if (!this.onHintsChanged) return
        const selected = this.player.selectedActors
        if (
            event.pointerType === 'touch' ||
            event.buttons !== 0 ||
            this.pressedButton !== undefined
        ) {
            this.resetHints()
            return
        }

        const actors = this.finder.findActorsByMouseEvent(event)
        if (!selected.length) {
            this.setHints({
                mode: 'idle',
                left: actors[0] && isWalkableActor(actors[0]) ? 'Select unit' : undefined,
            })
            return
        }

        if (!actors.length) {
            this.setHints({
                mode: 'selection',
                left: event.shiftKey || event.ctrlKey ? undefined : 'Deselect',
                right:
                    selected.some(isWalkableActor) &&
                    this.finder.findPositionByMouseEvent(event)
                        ? 'Move'
                        : undefined,
            })
            return
        }

        const target = actors.find(
            (actor) =>
                isBuildingActor(actor) &&
                actor.workerAssignmentLabel &&
                selected.some((worker) => actor.canAssignWorker(worker)),
        )
        if (!target || !isBuildingActor(target)) {
            this.setHints({ mode: 'selection' })
            return
        }

        this.setHints({
            mode: 'selection',
            right: this.finder.findStandingSurfaceByMouseEvent(event)
                ? 'Move'
                : target.workerAssignmentLabel,
        })
    }

    private handlePointerUp = (event: PointerEvent) => {
        if (this.pressedButton !== event.button) return

        this.pressedButton = undefined

        if (event.button === RIGHT_MOUSE_BUTTON) {
            this.handleRightClick(event)
            return
        }

        this.selectionDiv.onUp()

        const distance = Math.hypot(
            event.clientX - this.pointerStart.x,
            event.clientY - this.pointerStart.y,
        )
        if (distance < DRAG_THRESHOLD_PX) {
            this.handleClick(event)
            return
        }

        this.selectionBox.endPoint.set(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1,
            0.5,
        )

        this.boxSelect(event.shiftKey || event.ctrlKey)
    }

    private handleClick = (event: MouseEvent) => {
        const currentSelected = this.player.selectedActors
        const shiftKey = event.shiftKey || event.ctrlKey

        const actor = this.finder.findSingleActorByMouseEvent(event)

        if (!actor) {
            if (shiftKey) return
            this.player.unselectActor()
            return
        }

        if (shiftKey) {
            if (currentSelected.includes(actor)) {
                this.player.selectActors(currentSelected.filter((item) => item !== actor))
            } else {
                this.player.selectActors(uniq([actor, ...currentSelected]))
            }
        } else {
            this.player.selectActors([actor])
        }
    }

    private handleContextmenu = (event: MouseEvent) => {
        event.preventDefault()
    }

    private handleRightClick = (event: MouseEvent) => {
        event.preventDefault()
        const currentSelected = this.player.selectedActors
        if (!currentSelected.length) return

        const walkableActors = currentSelected.filter(isWalkableActor)
        const surface = this.finder.findStandingSurfaceByMouseEvent(event)
        if (surface) {
            const { surfaces } = this.game.pf
            const height = surfaces.height(surface)
            const group = surface.surface && surfaces.get(surface.surface)?.group
            const destinations = [surface]
            if (group) {
                const otherSpots = [...surfaces.all()]
                    .filter((spot) => spot.group === group && spot.id !== surface.surface)
                    .sort(
                        (a, b) =>
                            Math.hypot(
                                a.position[0] - surface.x,
                                a.position[1] - surface.y,
                            ) -
                            Math.hypot(
                                b.position[0] - surface.x,
                                b.position[1] - surface.y,
                            ),
                    )
                destinations.push(...otherSpots.map(toStep))
            }
            const seen = new Set([surface.surface])
            for (
                let i = 0;
                !group &&
                i < destinations.length &&
                destinations.length < walkableActors.length;
                i++
            ) {
                const current = destinations[i]!
                for (const next of surfaces.neighbors(current)) {
                    if (
                        !next.surface ||
                        seen.has(next.surface) ||
                        Math.abs((surfaces.height(next) ?? Infinity) - (height ?? 0)) >
                            0.35 ||
                        !surfaces.canStep(current, next)
                    )
                        continue
                    seen.add(next.surface)
                    destinations.push(next)
                }
            }
            walkableActors.forEach((actor, index) => {
                const destination = destinations[index]
                if (destination) actor.orderMoveTo(destination)
            })
            return
        }

        const interactionActor = this.finder.findActorsByMouseEvent(event)

        for (const actor of interactionActor) {
            const interactionHappened = actor.interact(currentSelected)
            if (interactionHappened) return
        }

        const position = this.finder.findPositionByMouseEvent(event)
        if (!position) return

        const positions = squareFloodFill(position, walkableActors.length, (position) => {
            if (!this.game.world.hasTile(position)) return false
            return this.game.world.getTile(position).canWalk
        })

        walkableActors.forEach((actor, index) => {
            const newPosition = positions[index]
            if (newPosition) actor.orderMoveTo(newPosition)
        })
    }

    private handleDoubleClick = () => {
        const currentSelected = first(this.player.selectedActors)
        if (!currentSelected) return

        const actors = this.game.findActorsByType(currentSelected.type)
        this.player.selectActors(actors)
    }

    private boxSelect(add = false) {
        const currentSelected = this.player.selectedActors
        const targets = this.renderer.getInteractionObjectList()
        targets.forEach((target) => target.updateWorldMatrix(true, false))
        // Borrow the proxies without reparenting them out of the live scene.
        this.selectionTargets.children = targets
        const selectedMeshes = this.selectionBox.select()
        this.selectionTargets.children = []

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
            this.player.selectActors(importantActors)
        } else {
            if (importantActors.every((item) => currentSelected.includes(item))) {
                this.player.selectActors(xor(currentSelected, importantActors))
            } else {
                this.player.selectActors(uniq([...importantActors, ...currentSelected]))
            }
        }
    }
}
