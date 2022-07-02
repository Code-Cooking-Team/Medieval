import { Game } from '+game/Game'
import { Renderer } from '+game/Renderer'

import { BuildingKey } from '../Builder'
import { BuildInteractions } from './methods/BuildInteractions'
import { KeyboardInteractions } from './methods/KeyboardInteractions'
import { SelectInteractions } from './methods/SelectInteractions'

export class InteractionsManager {
    private keyboard: KeyboardInteractions
    private select: SelectInteractions
    private building: BuildInteractions

    constructor(public game: Game, public renderer: Renderer) {
        this.keyboard = new KeyboardInteractions(game, renderer)
        this.select = new SelectInteractions(game, renderer)
        this.building = new BuildInteractions(game, renderer)

        this.game.player.emitter.on('selectBuilding', this.buildMode)
        this.game.player.emitter.on('unselectBuilding', this.selectMode)
    }

    public init() {
        this.keyboard.addEventListeners()
        this.selectMode()
    }

    public selectMode = () => {
        this.select.addEventListeners()
        this.building.removeEventListeners()
    }

    public buildMode = () => {
        this.select.removeEventListeners()
        this.building.addEventListeners()
    }
}
