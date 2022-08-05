import { actorByType } from '+game/actors'
import { Game } from '+game/Game'
import { HumanPlayer } from '+game/player/HumanPlayer'
import { Renderer } from '+game/Renderer'

import { Mesh, MeshBasicMaterial, Object3D } from 'three'

import { RaycastFinder } from './lib/RaycastFinder'

export class BuildInteractions {
    private finder: RaycastFinder
    private placeholder = new Object3D()
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

    public addEventListeners() {
        this.el.addEventListener('click', this.handleClick)
        this.el.addEventListener('pointermove', this.handleMove)
        this.el.addEventListener('contextmenu', this.handleContextmenu)
        this.renderer.scene.add(this.placeholder)
    }

    public removeEventListeners() {
        this.el.removeEventListener('click', this.handleClick)
        this.el.removeEventListener('pointermove', this.handleMove)
        this.el.removeEventListener('contextmenu', this.handleContextmenu)
        this.renderer.scene.remove(this.placeholder)
    }

    private handleClick = (event: MouseEvent) => {
        event.preventDefault()

        const selectedBuilding = this.player.selectedBuilding
        if (!selectedBuilding) return

        const position = this.finder.findPositionByMouseEvent(event)
        if (!position) return

        const ActorClass = actorByType[selectedBuilding]

        this.game.spawnActor(ActorClass, this.player, position)
    }

    private handleMove = (event: PointerEvent) => {
        const selectedBuilding = this.player.selectedBuilding
        if (!selectedBuilding) return
        const ActorClass = actorByType[selectedBuilding]

        const placeholderModel = this.player.selectedBuildingModel
        if (!placeholderModel) return

        const position = this.finder.findPositionByMouseEvent(event)
        if (!position) {
            if (this.placeholder.children.length > 0) {
                this.placeholder.remove(placeholderModel)
            }
            return
        }

        const currTail = this.game.world.getTile(position)
        const worldSize = this.game.world.getSize()
        this.placeholder.position.x = position[0] - worldSize[0] / 2
        this.placeholder.position.y = currTail.height
        this.placeholder.position.z = position[1] - worldSize[1] / 2

        this.placeHolderMaterial.color.setHex(!currTail.canBuild ? 0xff0000 : 0x5eff64)

        // console.log('selectedBuilding', placeholderModel, this.placeholder)
        if (this.placeholder.children.length === 0) {
            placeholderModel.traverse((child: Object3D) => {
                const mesh = child as Mesh
                if (!child || !mesh.material) return
                mesh.castShadow = false
                mesh.receiveShadow = false
                mesh.material = this.placeHolderMaterial
            })
            this.placeholder.add(placeholderModel)
        }
    }

    private handleContextmenu = (event: MouseEvent) => {
        event.preventDefault()
        this.player.unselectBuilding()
    }
}
