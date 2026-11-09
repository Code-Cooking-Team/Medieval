import { Game } from '+game/Game'
import { Renderer } from '+game/Renderer'

import { HumanPlayer } from '../HumanPlayer'
import { BuildInteractions } from './methods/BuildInteractions'
import { KeyboardInteractions } from './methods/KeyboardInteractions'
import { SelectInteractions } from './methods/SelectInteractions'

export class InteractionsManager {
    private keyboard: KeyboardInteractions
    private select: SelectInteractions
    private build: BuildInteractions
    private menuOpen = false

    constructor(
        public game: Game,
        public renderer: Renderer,
        public player: HumanPlayer,
    ) {
        this.keyboard = new KeyboardInteractions(game, renderer, player)
        this.select = new SelectInteractions(game, renderer, player)
        this.build = new BuildInteractions(game, renderer, player)
        this.keyboard.menuOpen = this.menuOpen

        this.player.emitter.on('selectBuilding', this.updateMode)
        this.player.emitter.on('removalModeChanged', this.updateMode)
        this.player.emitter.on('unselectBuilding', this.updateMode)
    }

    public init() {
        this.keyboard.enable()
        this.updateMode()
    }

    public destroy() {
        this.keyboard.disable()
        this.build.disable()
        this.select.disable()

        this.player.emitter.off('selectBuilding', this.updateMode)
        this.player.emitter.off('removalModeChanged', this.updateMode)
        this.player.emitter.off('unselectBuilding', this.updateMode)
    }

    private updateMode = () => {
        this.keyboard.menuOpen = this.menuOpen
        if (this.menuOpen) {
            this.build.disable()
            this.select.disable()
            return
        }
        if (this.player.selectedBuilding || this.player.removingBuildings) {
            this.select.disable()
            this.build.enable()
        } else {
            this.build.disable()
            this.select.enable()
        }
    }

    public setMenuOpen(isOpen: boolean) {
        this.menuOpen = isOpen
        this.keyboard.menuOpen = isOpen
        this.updateMode()
    }
}
