import { actorByType } from '+game/actors'
import { Game } from '+game/Game'
import { HumanPlayer } from '+game/player/HumanPlayer'
import { Renderer } from '+game/Renderer'

import { RaycastFinder } from './lib/RaycastFinder'

export class BuildInteractions {
    private finder: RaycastFinder
    private el: HTMLCanvasElement

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
        this.el.addEventListener('contextmenu', this.handleContextmenu)
    }

    public removeEventListeners() {
        this.el.removeEventListener('click', this.handleClick)
        this.el.removeEventListener('contextmenu', this.handleContextmenu)
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

    private handleContextmenu = (event: MouseEvent) => {
        event.preventDefault()
        this.player.unselectBuilding()
    }
}
