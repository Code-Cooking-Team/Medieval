import { actorByType } from '+game/actors'
import { isConstructionType } from '+game/actors/buildings/construction/costs'
import { isBuildingActor } from '+game/actors/helpers'
import { CAMERA_GESTURE_START } from '+game/core/RTSCamera'
import { type Game } from '+game/Game'
import { type HumanPlayer } from '+game/player/HumanPlayer'
import { type Renderer } from '+game/Renderer'
import { ActorType, type Position } from '+game/types'
import { rotationIndexToDeg } from '+helpers/math'
import { randomSeed } from '+helpers/random'
import { updateObjectPosition } from '+helpers/three'

import { type UnsubscribeFunction } from 'emittery'
import { Mesh, MeshBasicMaterial, Object3D } from 'three'

import { RaycastFinder } from './lib/RaycastFinder'
import { snapWallLine } from './lib/snapWallLine'

interface Preview {
    root: Object3D
    seed?: number
}

export class BuildInteractions {
    private finder: RaycastFinder
    private preview?: Preview
    private hoverPosition?: Position
    private previews = new Object3D()
    private wallPreviews: Preview[] = []
    private wallDrag?: { pointerId: number; start: Position; end: Position }
    private ignoreClick = false
    private el: HTMLCanvasElement
    private validMaterial = new MeshBasicMaterial({
        color: 0x5eff64,
        opacity: 0.5,
        transparent: true,
    })
    private invalidMaterial = new MeshBasicMaterial({
        color: 0xff0000,
        opacity: 0.5,
        transparent: true,
    })

    constructor(
        public game: Game,
        public renderer: Renderer,
        public player: HumanPlayer,
    ) {
        this.el = this.renderer.webGLRenderer.domElement
        this.finder = new RaycastFinder(game, renderer)
    }

    public rotatePlaceholder = (rotation: number) => {
        for (const preview of [this.preview, ...this.wallPreviews]) {
            if (preview) preview.root.rotation.y = rotationIndexToDeg(rotation)
        }
        if (this.wallDrag)
            this.showWallLine(snapWallLine(this.wallDrag.start, this.wallDrag.end))
        else this.updateHover(this.hoverPosition)
    }

    private subscriptions: UnsubscribeFunction[] = []

    public enable() {
        if (this.subscriptions.length) return

        if (this.player.selectedBuilding) {
            this.setPlaceholder(this.player.selectedBuilding)
        }

        this.subscriptions = [
            this.player.emitter.on('selectBuilding', ({ data }) =>
                this.setPlaceholder(data),
            ),
            this.player.emitter.on('unselectBuilding', this.removePlaceholder),
            this.player.emitter.on('rotateBuilding', ({ data }) =>
                this.rotatePlaceholder(data),
            ),
        ]

        this.el.addEventListener('click', this.handleClick)
        this.el.addEventListener('pointerdown', this.handleDown)
        this.el.addEventListener('pointermove', this.handleMove)
        this.el.addEventListener('pointerup', this.handleUp)
        this.el.addEventListener('pointercancel', this.handleCancel)
        this.el.addEventListener('lostpointercapture', this.handleCancel)
        this.el.addEventListener(CAMERA_GESTURE_START, this.cancelForCameraGesture)
        this.el.addEventListener('contextmenu', this.handleContextmenu)
        this.renderer.scene.add(this.previews)
    }

    public disable() {
        this.subscriptions.forEach((unsubscribe) => unsubscribe())
        this.subscriptions = []
        this.removePlaceholder()

        this.ignoreClick = false
        this.el.removeEventListener('click', this.handleClick)
        this.el.removeEventListener('pointerdown', this.handleDown)
        this.el.removeEventListener('pointermove', this.handleMove)
        this.el.removeEventListener('pointerup', this.handleUp)
        this.el.removeEventListener('pointercancel', this.handleCancel)
        this.el.removeEventListener('lostpointercapture', this.handleCancel)
        this.el.removeEventListener(CAMERA_GESTURE_START, this.cancelForCameraGesture)
        this.el.removeEventListener('contextmenu', this.handleContextmenu)
        this.renderer.scene.remove(this.previews)
    }

    private createPreview(type: ActorType, valid: boolean): Preview | undefined {
        const blueprint = actorByType[type].blueprint
        if (!blueprint) return

        const seed = type === ActorType.Stakewall ? randomSeed() : undefined
        const { model, promise } = blueprint.getPlaceholder(seed)
        const root = new Object3D()
        root.userData.valid = valid
        root.rotation.y = rotationIndexToDeg(this.player.selectedBuildingRotation)
        root.add(model)
        this.previews.add(root)

        void promise.then(() => {
            model.traverse((object) => {
                if (object instanceof Mesh) {
                    object.castShadow = false
                    object.receiveShadow = false
                }
            })
            this.colorPreview(root, root.userData.valid)
        })

        return { root, seed }
    }

    private colorPreview(root: Object3D, valid: boolean) {
        root.userData.valid = valid
        root.traverse((object) => {
            if (object instanceof Mesh) {
                object.material = valid ? this.validMaterial : this.invalidMaterial
            }
        })
    }

    private setPlaceholder = (type: ActorType) => {
        this.removePlaceholder()
        this.preview = this.createPreview(type, true)
        if (this.preview) this.preview.root.visible = false
    }

    private removePlaceholder = () => {
        this.clearWallDrag()
        this.previews.clear()
        this.preview = undefined
        this.hoverPosition = undefined
    }

    private clearWallDrag() {
        const drag = this.wallDrag
        this.wallDrag = undefined
        if (drag && this.el.hasPointerCapture(drag.pointerId)) {
            this.el.releasePointerCapture(drag.pointerId)
        }
        for (const { root } of this.wallPreviews) this.previews.remove(root)
        this.wallPreviews = []
    }

    private canBuild(positions: Position[]) {
        const type = this.player.selectedBuilding
        const blueprint = type && actorByType[type].blueprint
        return (
            !!blueprint &&
            this.game.canPlaceBuildings(
                blueprint,
                positions,
                this.player.selectedBuildingRotation,
            )
        )
    }

    private place(positions: Position[], previews: (Preview | undefined)[]) {
        const type = this.player.selectedBuilding
        if (!type) return false
        const rotation = this.player.selectedBuildingRotation
        const builder = this.player.constructionBuilder
        if (builder) {
            return (
                isConstructionType(type) &&
                this.game.placeConstructionSites(
                    this.player.constructionBuilders,
                    type,
                    positions.map((position, index) => ({
                        position,
                        seed: previews[index]?.seed,
                    })),
                    rotation,
                )
            )
        }
        if (actorByType[type].blueprint && !this.canBuild(positions)) return false
        return positions.every(
            (position, index) =>
                !!this.game.spawnActor(
                    actorByType[type].actorClass,
                    this.player,
                    position,
                    rotation,
                    previews[index]?.seed,
                ),
        )
    }

    private showPreview(preview: Preview, position: Position, valid: boolean) {
        const { root } = preview
        root.visible = !!this.game.world.hasTile(position)
        if (!root.visible) return

        const [width, height] = this.game.world.getSize()
        updateObjectPosition(
            root,
            [position[0] - width / 2, position[1] - height / 2],
            this.game.world.getTile(position).height,
        )
        if (root.userData.valid !== valid) this.colorPreview(root, valid)
    }

    private showWallLine(positions: Position[]) {
        if (!this.preview) return
        const valid = this.canBuild(positions)
        this.showPreview(this.preview, positions[0]!, valid)

        for (let i = 1; i < positions.length; i++) {
            const preview = (this.wallPreviews[i - 1] ??= this.createPreview(
                ActorType.Stakewall,
                valid,
            )!)
            this.showPreview(preview, positions[i]!, valid)
        }
        for (let i = positions.length - 1; i < this.wallPreviews.length; i++) {
            this.wallPreviews[i]!.root.visible = false
        }
    }

    private handleDown = (event: PointerEvent) => {
        if (event.pointerType === 'touch' && !event.isPrimary) return
        if (event.button !== 0 || this.wallDrag) return
        this.ignoreClick = false
        if (this.player.selectedBuilding !== ActorType.Stakewall) return

        this.ignoreClick = true
        const start = this.finder.findPositionByMouseEvent(event)
        if (!start || !this.game.world.hasTile(start)) return

        this.wallDrag = { pointerId: event.pointerId, start, end: start }
        this.el.setPointerCapture(event.pointerId)
        this.showWallLine([start])
    }

    private handleUp = (event: PointerEvent) => {
        const drag = this.wallDrag
        if (!drag || drag.pointerId !== event.pointerId || event.button !== 0) return

        const end = this.finder.findPositionByMouseEvent(event)
        if (end && this.player.selectedBuilding === ActorType.Stakewall) {
            const positions = snapWallLine(drag.start, end)
            if (this.place(positions, [this.preview, ...this.wallPreviews])) {
                this.setPlaceholder(ActorType.Stakewall)
            }
        }
        this.clearWallDrag()
        this.updateHover(end)
    }

    private handleCancel = (event: PointerEvent) => {
        if (this.wallDrag?.pointerId !== event.pointerId) return
        this.clearWallDrag()
        this.updateHover(undefined)
    }

    private cancelForCameraGesture = () => {
        this.ignoreClick = true
        this.clearWallDrag()
        this.updateHover(undefined)
    }

    private handleClick = (event: MouseEvent) => {
        event.preventDefault()
        if (event.button !== 0) return

        if (this.ignoreClick) {
            this.ignoreClick = false
            return
        }

        if (this.player.removingBuildings) {
            const building = this.finder
                .findActorsByMouseEvent(event)
                .find(isBuildingActor)
            if (building) this.game.removeActor(building)
            return
        }

        const selectedBuilding = this.player.selectedBuilding
        if (!selectedBuilding) return

        const position = this.finder.findPositionByMouseEvent(event)
        if (!position || !this.game.world.hasTile(position)) return

        if (this.place([position], [this.preview])) {
            if (this.player.singleBuildingPlacement) this.player.unselectBuilding()
            else if (selectedBuilding === ActorType.Stakewall) {
                this.setPlaceholder(selectedBuilding)
            }
        }
        this.updateHover(position)
    }

    private updateHover(position?: Position) {
        this.hoverPosition = position
        if (!this.preview) return
        if (position) this.showPreview(this.preview, position, this.canBuild([position]))
        else this.preview.root.visible = false
    }

    private handleMove = (event: PointerEvent) => {
        if (event.pointerType === 'touch' && this.renderer.rtsCamera.isTouchGesturing)
            return
        if (!this.preview) return
        const drag = this.wallDrag
        if (drag && drag.pointerId !== event.pointerId) return

        const position = this.finder.findPositionByMouseEvent(event)
        if (drag) {
            if (!position || (position[0] === drag.end[0] && position[1] === drag.end[1]))
                return
            drag.end = position
            this.showWallLine(snapWallLine(drag.start, position))
        } else {
            this.updateHover(position)
        }
    }

    private handleContextmenu = (event: MouseEvent) => {
        event.preventDefault()
        this.clearWallDrag()
        this.player.setBuildingRemoval(false)
        this.player.unselectBuilding()
    }
}
