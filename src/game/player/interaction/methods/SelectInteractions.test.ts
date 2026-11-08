import { HumanActor } from '+game/actors/units/human/HumanActor'
import type { Game } from '+game/Game'
import { HumanPlayer } from '+game/player/HumanPlayer'
import type { Renderer } from '+game/Renderer'

import { BoxGeometry, Mesh, PerspectiveCamera } from 'three'

import { SelectInteractions } from './SelectInteractions'

const centerX = window.innerWidth / 2
const centerY = window.innerHeight / 2

function withSelectionCanvas(
    check: (canvas: HTMLCanvasElement, player: HumanPlayer, unit: HumanActor) => void,
) {
    const canvas = document.createElement('canvas')
    document.body.appendChild(canvas)
    const game = {} as Game
    const player = new HumanPlayer()
    const unit = new HumanActor(game, player)
    const target = new Mesh(new BoxGeometry())
    target.position.z = -10
    target.userData.actor = unit
    const renderer = {
        webGLRenderer: { domElement: canvas },
        rtsCamera: {
            camera: new PerspectiveCamera(60, window.innerWidth / window.innerHeight),
        },
        getInteractionObjectList: () => [target],
    } as unknown as Renderer
    const interactions = new SelectInteractions(game, renderer, player)
    interactions.enable()

    try {
        check(canvas, player, unit)
    } finally {
        interactions.disable()
        canvas.remove()
    }
}

function pointer(target: EventTarget, type: string, x: number, y: number) {
    target.dispatchEvent(
        new PointerEvent(type, { clientX: x, clientY: y, bubbles: true }),
    )
}

test.each([0, 1])('box-selects a unit with %i pointer moves before release', (moves) => {
    withSelectionCanvas((canvas, player, unit) => {
        pointer(canvas, 'pointerdown', centerX - 80, centerY - 80)
        if (moves) {
            pointer(document, 'pointermove', centerX + 80, centerY + 80)
            expect(document.querySelector('.selectBox')).toHaveProperty(
                'style.width',
                '160px',
            )
        }
        pointer(document, 'pointerup', centerX + 80, centerY + 80)

        expect(player.selectedActors).toEqual([unit])
    })
})

test('picks the unit under a click despite repeated small pointer moves', () => {
    withSelectionCanvas((canvas, player, unit) => {
        pointer(canvas, 'pointerdown', centerX + 2, centerY + 2)
        for (let i = 0; i < 12; i++) {
            pointer(document, 'pointermove', centerX + (i % 2), centerY + (i % 2))
        }
        pointer(document, 'pointerup', centerX + 1, centerY + 1)

        expect(player.selectedActors).toEqual([unit])
    })
})
