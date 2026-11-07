import { config } from '+config'
import { WalkableActor } from '+game/core/WalkableActor'

import { Group, Vector3 } from 'three'

import { WalkableActorRenderer } from './WalkableActorRenderer'

class TestRenderer extends WalkableActorRenderer<WalkableActor> {
    public faceTarget(group: Group, position: WalkableActor['position']) {
        this.actorGroupMap.set({ position } as WalkableActor, group)
        this.updateRotation({ deltaTime: 1, elapsedTime: 1 })
    }
}

function createRenderer() {
    const game = { world: { getTile: () => ({ height: 2 }) } }
    return new TestRenderer(
        game as unknown as TestRenderer['game'],
        {} as TestRenderer['player'],
    )
}

it('faces along the ground when moving to a tile at another height', () => {
    const group = new Group()

    createRenderer().faceTarget(group, [0, 1])

    expect(group.getWorldDirection(new Vector3()).z).toBeCloseTo(1)
})

it('keeps its heading while only the rendered height is changing', () => {
    const group = new Group()
    group.position.y = config.renderer.tileSize
    group.rotation.y = Math.PI / 2

    createRenderer().faceTarget(group, [0, 0])

    expect(group.getWorldDirection(new Vector3()).x).toBeCloseTo(1)
})
