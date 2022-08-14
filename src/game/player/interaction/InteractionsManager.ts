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

    constructor(
        public game: Game,
        public renderer: Renderer,
        public player: HumanPlayer,
    ) {
        this.keyboard = new KeyboardInteractions(game, renderer, player)
        this.select = new SelectInteractions(game, renderer, player)
        this.build = new BuildInteractions(game, renderer, player)

        this.player.emitter.on('selectBuilding', this.buildMode)
        this.player.emitter.on('unselectBuilding', this.selectMode)
    }

    public init() {
        this.keyboard.enable()
        this.selectMode()
    }

    public destroy() {
        this.keyboard.disable()
        this.build.disable()
        this.select.disable()

        this.player.emitter.off('selectBuilding', this.buildMode)
        this.player.emitter.off('unselectBuilding', this.selectMode)
    }

    public selectMode = () => {
        this.select.enable()
        this.build.disable()
    }

    public buildMode = () => {
        this.select.disable()
        this.build.enable()
    }
}
