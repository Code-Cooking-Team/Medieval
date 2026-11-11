import { type PathStep, type Position } from '+game/types'
import { type World } from '+game/world/World'

export const TIMBER_GALLERY_HEIGHT = 3.3
export const MAX_STEP_HEIGHT = 1.1

export interface StandingSurface {
    id: string
    position: Position
    height: number
    ground: Position[]
    links: string[]
    joins?: Position[]
    group?: string
    halfWidth?: number
}

export class StandingSurfaces {
    private readonly byOwner = new Map<string, StandingSurface[]>()
    private readonly byId = new Map<string, StandingSurface>()
    private readonly entrances = new Map<string, StandingSurface[]>()

    private readonly joinPoints = new Map<string, Set<StandingSurface>>()
    public revision = 0

    constructor(private readonly world: World) {}

    public replace(owner: string, surfaces: StandingSurface[]) {
        const previous = this.byOwner.get(owner)
        if (!previous && !surfaces.length) return
        this.revision++
        for (const surface of previous ?? []) {
            this.byId.delete(surface.id)
            if (surface.joins?.length) {
                const key = surface.position.join(',')
                const points = this.joinPoints.get(key)
                points?.delete(surface)
                if (!points?.size) this.joinPoints.delete(key)
            }
            for (const position of surface.ground) {
                const key = position.join(',')
                const remaining = this.entrances
                    .get(key)
                    ?.filter((item) => item !== surface)
                if (remaining?.length) this.entrances.set(key, remaining)
                else this.entrances.delete(key)
            }
        }
        if (surfaces.length) this.byOwner.set(owner, surfaces)
        else this.byOwner.delete(owner)
        for (const surface of surfaces) {
            this.byId.set(surface.id, surface)
            if (surface.joins?.length) {
                const key = surface.position.join(',')
                const points = this.joinPoints.get(key) ?? new Set<StandingSurface>()
                points.add(surface)
                this.joinPoints.set(key, points)
            }
            for (const position of surface.ground) {
                const key = position.join(',')
                const entries = this.entrances.get(key)
                if (entries) entries.push(surface)
                else this.entrances.set(key, [surface])
            }
        }
    }

    public get(id: string) {
        return this.byId.get(id)
    }

    public all() {
        return this.byId.values()
    }

    public height(step: PathStep) {
        const surface = step.surface && this.get(step.surface)
        if (step.surface) {
            if (
                surface &&
                surface.position[0] === step.x &&
                surface.position[1] === step.y
            )
                return surface.height
            return
        }
        return this.world.hasTile([step.x, step.y])?.height
    }

    public canStep(from: PathStep, to: PathStep) {
        const dx = Math.abs(from.x - to.x)
        const dy = Math.abs(from.y - to.y)
        if (dx + dy > 1) return false
        const fromHeight = this.height(from)
        const toHeight = this.height(to)
        if (
            fromHeight === undefined ||
            toHeight === undefined ||
            Math.abs(fromHeight - toHeight) > MAX_STEP_HEIGHT
        )
            return false

        if (from.surface && to.surface) {
            const first = this.get(from.surface)!
            const second = this.get(to.surface)!
            return (
                (first.links.includes(second.id) && second.links.includes(first.id)) ||
                (dx + dy === 1 &&
                    this.joinsAt(first, second.position) &&
                    this.joinsAt(second, first.position))
            )
        }
        const raised = this.get((from.surface ?? to.surface)!)
        const ground = from.surface ? to : from
        return (
            !!this.world.hasTile([ground.x, ground.y])?.canWalk &&
            !!raised?.ground.some(([x, y]) => x === ground.x && y === ground.y)
        )
    }

    private joinsAt(surface: StandingSurface, [x, y]: Position) {
        return !!surface.joins?.some(([joinX, joinY]) => x === joinX && y === joinY)
    }

    public *neighbors(step: PathStep): Iterable<PathStep> {
        if (!step.surface) {
            for (const entry of this.entrances.get(`${step.x},${step.y}`) ?? [])
                yield toStep(entry)
            return
        }
        const surface = this.get(step.surface)
        if (!surface) return
        for (const [x, y] of surface.ground) yield { x, y }
        for (const join of surface.joins ?? []) {
            for (const neighbor of this.joinPoints.get(join.join(',')) ?? []) {
                if (this.joinsAt(neighbor, surface.position)) yield toStep(neighbor)
            }
        }
        for (const id of surface.links) {
            const next = this.get(id)
            if (next) yield toStep(next)
        }
    }
}

export const toStep = ({ position: [x, y], id }: StandingSurface): PathStep => ({
    x,
    y,
    surface: id,
})
