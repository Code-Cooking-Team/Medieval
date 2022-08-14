import { actorByType } from '+game/actors'
import { Game } from '+game/Game'
import { HumanPlayer } from '+game/player/HumanPlayer'
import { Renderer } from '+game/Renderer'
import { ActorType, Position } from '+game/types'
import { rotationIndexToDeg, updateObjectPosition } from '+helpers'

import { UnsubscribeFn } from 'emittery'
import { Group, LOD, Mesh, MeshBasicMaterial, Object3D } from 'three'

import { RaycastFinder } from './lib/RaycastFinder'

export class BuildInteractions {
    private finder: RaycastFinder
    private placeholder = new Object3D()
    private placeholderModel?: LOD | Group
    private el: HTMLCanvasElement
    private placeHolderMaterial = new MeshBasicMaterial({
        color: 0x5eff64,
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

    public rotatePlaceholder = (rotateNumber: number) => {
        this.placeholder.rotation.y = rotationIndexToDeg(rotateNumber)
    }

    private subscriptions: UnsubscribeFn[] = []

    public enable() {
        if (this.player.selectedBuilding) {
            this.setPlaceholder(this.player.selectedBuilding)
        }

        this.subscriptions = [
            this.player.emitter.on('selectBuilding', this.setPlaceholder),
            this.player.emitter.on('unselectBuilding', this.removePlaceholder),
            this.player.emitter.on('rotateBuilding', this.rotatePlaceholder),
        ]

        this.el.addEventListener('click', this.handleClick)
        this.el.addEventListener('pointermove', this.handleMove)
        this.el.addEventListener('contextmenu', this.handleContextmenu)
        this.renderer.scene.add(this.placeholder)
    }

    public disable() {
        this.subscriptions.forEach((unsubscribe) => unsubscribe())

        this.el.removeEventListener('click', this.handleClick)
        this.el.removeEventListener('pointermove', this.handleMove)
        this.el.removeEventListener('contextmenu', this.handleContextmenu)
        this.renderer.scene.remove(this.placeholder)
    }

    private setPlaceholder = (type: ActorType) => {
        this.removePlaceholder()
        const actorModel = actorByType[type].model
        if (!actorModel) return
        this.placeholderModel = actorModel.getModel()
        this.placeholderModel.traverse((child) => {
            if (child instanceof Mesh) {
                child.castShadow = false
                child.receiveShadow = false
                child.material = this.placeHolderMaterial
            }
        })
        this.placeholder.add(this.placeholderModel)
    }

    private removePlaceholder = () => {
        if (!this.placeholderModel) return
        this.placeholder.remove(this.placeholderModel)
        this.placeholderModel = undefined
    }

    private handleClick = (event: MouseEvent) => {
        event.preventDefault()

        const selectedBuilding = this.player.selectedBuilding
        if (!selectedBuilding) return

        const position = this.finder.findPositionByMouseEvent(event)
        if (!position) return

        const ActorClass = actorByType[selectedBuilding].actorClass

        this.game.spawnActor(
            ActorClass,
            this.player,
            position,
            this.player.selectedBuildingRotation,
        )
    }

    private handleMove = (event: PointerEvent) => {
        if (!this.placeholderModel) return

        const position = this.finder.findPositionByMouseEvent(event)

        if (!position) return

        const currTail = this.game.world.getTile(position)
        const worldSize = this.game.world.getSize()

        const placeholderPosition: Position = [
            position[0] - worldSize[0] / 2,
            position[1] - worldSize[1] / 2,
        ]

        updateObjectPosition(this.placeholder, placeholderPosition, currTail.height)

        this.placeHolderMaterial.color.setHex(!currTail.canBuild ? 0xff0000 : 0x5eff64)
    }

    private handleContextmenu = (event: MouseEvent) => {
        event.preventDefault()
        this.player.unselectBuilding()
    }
}
