import type { Actor } from '+game/core/Actor'
import { HumanPlayer } from '+game/player/HumanPlayer'
import type { Renderer } from '+game/Renderer'
import { ActorType } from '+game/types'
import { theme } from '+ui/styles/theme'

import { ThemeProvider } from '@emotion/react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'

import { SelectedList } from './SelectedList'

vi.mock('+helpers/three', async (importOriginal) => {
    const actual = await importOriginal<typeof import('+helpers/three')>()
    const { Group } = await import('three')
    return {
        ...actual,
        loadGLTF: () =>
            Promise.resolve(
                new Group().add(
                    ...[
                        'lod_near',
                        'lod_far',
                        'lod_very_far',
                        'lod1',
                        'lod2',
                        'lod3',
                    ].map((name) => {
                        const node = new Group()
                        node.name = name
                        return node
                    }),
                ),
            ),
    }
})

it('removes the portrait when switching from one actor to multiple actors', async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    const player = new HumanPlayer()
    const actors = ['one', 'two'].map(
        (id) => ({ id, type: ActorType.Deer, hp: 100, maxHp: 100 }) as Actor,
    )
    const detach = vi.fn()
    const attachPortrait = vi.fn(() => detach)
    const renderer = { attachPortrait } as unknown as Renderer
    try {
        await act(async () => {
            root.render(
                <ThemeProvider theme={theme}>
                    <SelectedList humanPlayer={player} renderer={renderer} />
                </ThemeProvider>,
            )
        })
        await act(async () => {
            player.selectActors([actors[0]!])
        })
        expect(host.querySelectorAll('canvas')).toHaveLength(1)
        await act(async () => {
            player.selectActors(actors)
        })
        expect(host.textContent).toContain('Deer (2)')
        expect(host.querySelectorAll('canvas')).toHaveLength(0)
        expect(detach).toHaveBeenCalledTimes(1)
        await act(async () => {
            player.selectActors([actors[1]!])
        })
        expect(host.querySelectorAll('canvas')).toHaveLength(1)
        expect(attachPortrait).toHaveBeenCalledTimes(2)
    } finally {
        await act(async () => root.unmount())
        host.remove()
        vi.unstubAllGlobals()
    }
})
