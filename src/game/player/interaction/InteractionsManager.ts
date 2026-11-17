import { type Game } from '+game/Game'
import { type Renderer } from '+game/Renderer'

import { type HumanPlayer } from '../HumanPlayer'
import type { ControlHints } from './ControlHints'
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
        private onHintsChanged?: (hints?: ControlHints) => void,
    ) {
        this.keyboard = new KeyboardInteractions(game, renderer, player)
        this.select = new SelectInteractions(game, renderer, player, onHintsChanged)
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
        this.onHintsChanged?.()

        this.player.emitter.off('selectBuilding', this.updateMode)
        this.player.emitter.off('removalModeChanged', this.updateMode)
        this.player.emitter.off('unselectBuilding', this.updateMode)
    }

    private updateMode = () => {
        this.keyboard.menuOpen = this.menuOpen
        if (this.menuOpen) {
            this.build.disable()
            this.select.disable()
            this.onHintsChanged?.()
            return
        }
        if (this.player.selectedBuilding || this.player.removingBuildings) {
            this.select.disable()
            this.build.enable()
            this.onHintsChanged?.(
                this.player.removingBuildings
                    ? { mode: 'removal', left: 'Remove', right: 'Cancel' }
                    : { mode: 'build', left: 'Place', right: 'Cancel' },
            )
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
