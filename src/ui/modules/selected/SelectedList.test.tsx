import { HumanActor } from '+game/actors/units/human/HumanActor'
import type { Actor } from '+game/core/Actor'
import { Game } from '+game/Game'
import { HumanPlayer } from '+game/player/HumanPlayer'
import type { Renderer } from '+game/Renderer'
import { ActorType } from '+game/types'
import { Tile } from '+game/world/Tile'
import { World } from '+game/world/World'

import { expect, it, mock } from 'bun:test'
import { act } from 'react'
import { createRoot } from 'react-dom/client'

import { SelectedList } from './SelectedList'

it('removes the portrait when switching from one actor to multiple actors', async () => {
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    const player = new HumanPlayer()
    const actors = ['one', 'two'].map(
        (id) => ({ id, type: ActorType.Deer, hp: 100, maxHp: 100 }) as Actor,
    )
    const detach = mock()
    const attachPortrait = mock(() => detach)
    const renderer = { attachPortrait } as unknown as Renderer
    try {
        await act(async () => {
            root.render(<SelectedList humanPlayer={player} renderer={renderer} />)
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
    }
})

it('offers Build for a group and passes every selected human to placement', async () => {
    const host = document.createElement('div')
    const root = createRoot(host)
    const player = new HumanPlayer()
    const game = new Game(
        new World(
            Array.from({ length: 12 }, () =>
                Array.from({ length: 12 }, () => new Tile()),
            ),
        ),
        [player],
    )
    const humans = [
        game.spawnActor(HumanActor, player, [2, 2])!,
        game.spawnActor(HumanActor, player, [3, 2])!,
    ]
    player.selectActors(humans)
    try {
        await act(async () => root.render(<SelectedList humanPlayer={player} />))
        const button = (label: string) =>
            Array.from(host.querySelectorAll('button')).find(
                (node) => (node.getAttribute('aria-label') ?? node.textContent) === label,
            )!
        expect(button('Build').querySelector('svg')).not.toBeNull()
        await act(async () => button('Build').click())
        await act(async () => button('House').click())
        expect(player.constructionBuilders).toEqual(humans)
        expect(player.selectedBuilding).toBe(ActorType.House)
        expect(humans.every((human) => !human.profession)).toBe(true)
    } finally {
        await act(async () => root.unmount())
    }
})
