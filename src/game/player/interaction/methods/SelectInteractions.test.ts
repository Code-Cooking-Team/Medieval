import { ConstructionSiteActor } from '+game/actors/buildings/construction/ConstructionSiteActor'
import { WoodCampActor } from '+game/actors/buildings/woodCamp/WoodCampActor'
import { HumanActor } from '+game/actors/units/human/HumanActor'
import type { Game } from '+game/Game'
import { HumanPlayer } from '+game/player/HumanPlayer'
import type { ControlHints } from '+game/player/interaction/ControlHints'
import type { Renderer } from '+game/Renderer'

import { expect, test } from 'bun:test'
import { BoxGeometry, Mesh, PerspectiveCamera } from 'three'

import { SelectInteractions } from './SelectInteractions'

const centerX = window.innerWidth / 2
const centerY = window.innerHeight / 2

function withSelectionCanvas(
    check: (
        canvas: HTMLCanvasElement,
        player: HumanPlayer,
        unit: HumanActor,
        hints: () => ControlHints | undefined,
    ) => void,
    Building: typeof WoodCampActor | typeof ConstructionSiteActor = WoodCampActor,
) {
    const canvas = document.createElement('canvas')
    document.body.appendChild(canvas)
    const game = {
        world: { getRealSize: () => [100, 100] },
        getActorById: (id: string) => (building.id === id ? building : undefined),
    } as Game
    const player = new HumanPlayer()
    const unit = new HumanActor(game, player)
    const target = new Mesh(new BoxGeometry())
    target.position.z = -10
    target.userData.actor = unit
    const building = new Building(game, player)
    const buildingTarget = new Mesh(new BoxGeometry())
    buildingTarget.position.set(2, 0, -10)
    buildingTarget.userData.actor = building
    const renderer = {
        webGLRenderer: { domElement: canvas },
        rtsCamera: {
            camera: new PerspectiveCamera(60, window.innerWidth / window.innerHeight),
        },
        getInteractionObjectList: () => [target, buildingTarget],
        pickStandingSurfaceMarker: () => undefined,
        getStandingSurfaceHit: () => undefined,
        groundDistance: () => 20,
    } as unknown as Renderer
    let hints: ControlHints | undefined
    const interactions = new SelectInteractions(game, renderer, player, (value) => {
        hints = value
    })
    interactions.enable()

    try {
        check(canvas, player, unit, () => hints)
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

test.each([
    [WoodCampActor, 'Assign as Woodcutter'],
    [ConstructionSiteActor, 'Assign as Builder'],
] as const)(
    'shows the assignment hint for %p only with a worker selected',
    (Building, label) => {
        withSelectionCanvas((canvas, player, unit, hints) => {
            const buildingX = centerX + centerY * (2 / (10 * Math.tan(Math.PI / 6)))

            pointer(canvas, 'pointermove', centerX, centerY)
            expect(hints()).toEqual({ mode: 'idle', left: 'Select unit' })

            pointer(canvas, 'pointermove', buildingX, centerY)
            expect(hints()).toEqual({ mode: 'idle' })

            player.selectActors([unit])
            pointer(canvas, 'pointermove', buildingX, centerY)
            expect(hints()).toEqual({ mode: 'selection', right: label })
            expect(unit.profession).toBeUndefined()

            pointer(canvas, 'pointermove', centerX, centerY)
            expect(hints()).toEqual({ mode: 'selection' })

            pointer(canvas, 'pointermove', centerX - 80, centerY)
            expect(hints()).toEqual({
                mode: 'selection',
                left: 'Deselect',
                right: 'Move',
            })
        }, Building)
    },
)

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
