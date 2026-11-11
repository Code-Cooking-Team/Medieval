import { type Position } from '+game/types'

import { type BuildingActor } from './BuildingActor'
import { type StandingSurface } from './StandingSurfaces'

export interface BuildingSurface {
    offset: Position
    height: number
    exits?: Position[]
    joins?: Position[]
    links: number[]
    group?: string
}

export function buildingSurfaces(actor: BuildingActor): StandingSurface[] {
    const layout = actor.blueprint.standingSurfaces
    if (!layout) return []
    const base = actor.game.world.getTile(actor.position).height
    const transform = ([x, y]: Position): Position => {
        const [dx, dy] = (
            [
                [x, y],
                [-y, x],
                [-x, -y],
                [y, -x],
            ] as Position[]
        )[actor.rotation]!
        return [actor.position[0] + dx, actor.position[1] + dy]
    }
    const id = (index: number) => `building:${actor.id}:${index}`
    return layout.flatMap(({ offset, height, exits, joins, links, group }, index) => {
        const position = transform(offset)
        return actor.game.world.hasTile(position)
            ? [
                  {
                      id: id(index),
                      position,
                      height: base + height,
                      ground: (exits ?? []).map(transform),
                      links: links.map(id),
                      joins: joins?.map(transform),
                      group: group && `${actor.id}:${group}`,
                  },
              ]
            : []
    })
}
