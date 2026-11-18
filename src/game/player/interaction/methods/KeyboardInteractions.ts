import { isWalkableActor } from '+game/actors/helpers'
import { type Game } from '+game/Game'
import { type HumanPlayer } from '+game/player/HumanPlayer'
import { type Renderer } from '+game/Renderer'
import { normalizeEventKeyName } from '+helpers/string'

export class KeyboardInteractions {
    // TODO move selection when holding space bar
    public isHoldingSpaceBar = false
    public menuOpen = false

    constructor(
        public game: Game,
        public renderer: Renderer,
        public player: HumanPlayer,
    ) {}

    public enable() {
        window.addEventListener('keyup', this.handleKeyUp)
        window.addEventListener('keydown', this.handleKeyDown)
    }

    public disable() {
        window.removeEventListener('keyup', this.handleKeyUp)
        window.removeEventListener('keydown', this.handleKeyDown)
    }

    private handleKeyDown = (event: KeyboardEvent) => {
        if (this.menuOpen) {
            if (event.key === 'Escape') event.preventDefault()
            return
        }
        if (event.key === ' ') {
            this.isHoldingSpaceBar = true
        }
    }

    private handleKeyUp = (event: KeyboardEvent) => {
        const target = event.target
        if (
            target instanceof HTMLElement &&
            target.closest('input, textarea, select, [contenteditable="true"]')
        )
            return
        const key = normalizeEventKeyName(event.key)

        if (key === 'Escape') {
            event.preventDefault()
            event.stopImmediatePropagation()
            if (this.renderer.rtsCamera.isFollowing) {
                this.renderer.rtsCamera.stopFollowing()
                return
            }
            if (this.menuOpen) {
                window.dispatchEvent(new CustomEvent('game-menu-toggle'))
                return
            }
            const hasGameAction = Boolean(
                this.player.selectedBuilding ||
                this.player.removingBuildings ||
                this.player.selectedActors.length,
            )
            this.player.setBuildingRemoval(false)
            this.player.unselectBuilding()
            if (!this.player.constructionBuilder && this.player.selectedActors.length) {
                this.player.unselectActor()
            }
            if (!hasGameAction) window.dispatchEvent(new CustomEvent('game-menu-toggle'))
            return
        }

        if (this.menuOpen) return

        if (
            event.code === 'Period' &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.altKey
        ) {
            const actor = this.player.selectedActors.find(isWalkableActor)
            if (actor) this.renderer.followActor(actor)
            return
        }

        switch (key) {
            case ' ':
                this.isHoldingSpaceBar = false
                break

            case 'r':
                this.player.rotateBuilding()
                break
        }
    }
}
