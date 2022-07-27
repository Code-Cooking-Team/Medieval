import { Game } from '+game/Game'
import { HumanPlayer } from '+game/player/HumanPlayer'
import { Renderer } from '+game/Renderer'

export class KeyboardInteractions {
    // TODO move selection when holding space bar
    public isHoldingSpaceBar = false

    constructor(
        public game: Game,
        public renderer: Renderer,
        public player: HumanPlayer,
    ) {}

    public addEventListeners() {
        window.addEventListener('keyup', this.handleKeyUp)
        window.addEventListener('keydown', this.handleKeyDown)
    }

    public removeEventListeners() {
        window.removeEventListener('keyup', this.handleKeyUp)
        window.removeEventListener('keydown', this.handleKeyDown)
    }

    private handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === ' ') {
            this.isHoldingSpaceBar = true
        }
    }

    private handleKeyUp = (event: KeyboardEvent) => {
        if (event.key === ' ') {
            this.isHoldingSpaceBar = false
        }
        if (event.key === 'Escape') {
            this.player.unselectActor()
            this.player.unselectBuilding()
        }
    }
}
