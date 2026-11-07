import type { ConstructionSiteActor } from '+game/actors/buildings/construction/ConstructionSiteActor'
import type { WoodCampActor } from '+game/actors/buildings/woodCamp/WoodCampActor'
import { isWoodCampActor } from '+game/actors/helpers'
import type { ItemId } from '+game/actors/units/human/equipment'
import { ActorType, Path } from '+game/types'

import { Profession, ProfessionJSON } from './Profession'
import { ProfessionType } from './types'

const carryCapacity = 150
const woodPerTick = 2
const retryTicks = 4

type Job = {
    site?: ConstructionSiteActor
    camp?: WoodCampActor
    path: Path
    tileRevision: number
}

export class BuilderProfession extends Profession {
    public type = ProfessionType.Builder
    public readonly defaultHeldItem: ItemId = 'hammer'
    public queue: string[] = []
    public carriedWood = 0

    private activeSiteId?: string
    private job?: Job
    private retryIn = 0

    public enqueue(siteId: string) {
        this.queue.push(siteId)
        this.retryIn = 0
        if (!this.job?.site) this.job = undefined
    }

    public removeSite(siteId: string) {
        this.queue = this.queue.filter((id) => id !== siteId)
        if (this.activeSiteId === siteId) this.activeSiteId = undefined
        if (this.job?.site?.id === siteId) this.job = undefined
        this.retryIn = 0
    }

    public isWalking() {
        return !!this.job?.path.length
    }

    public get isBuilding() {
        const job = this.job
        return !!job?.site && !job.camp && job.path.length === 0
    }

    public reset() {
        super.reset()
        this.job = undefined
        this.retryIn = 0
    }

    public async tick() {
        super.tick()

        if (this.actor.isFindingPath || this.actor.hasPath()) {
            this.job = undefined
            if (!this.actor.isFindingPath) this.actor.move()
            return
        }

        if (this.retryIn > 0) {
            this.retryIn--
            return
        }

        if (this.job && !this.isCurrent(this.job)) this.job = undefined
        const job = (this.job ??= this.planJob())
        if (!job) {
            if (this.queue.length || this.carriedWood) this.retryIn = retryTicks
            return
        }

        const step = job.path.shift()
        if (step) {
            this.actor.position = [step.x, step.y]
            return
        }

        const { site, camp } = job
        if (site && !camp) {
            const delivered = site.deliver(this, Math.min(this.carriedWood, woodPerTick))
            this.carriedWood -= delivered
            if (delivered > 0) this.actor.recordAction('build', site)
            if (!this.carriedWood) this.job = undefined
            return
        }

        this.job = undefined
        if (camp && site) {
            const amount = Math.min(carryCapacity - this.carriedWood, site.remainingWood)
            this.carriedWood += camp.withdrawWood(amount)
        } else if (camp) {
            this.carriedWood -= camp.collectTree(this.carriedWood)
        }
    }

    private planJob(): Job | undefined {
        const sites = this.queue
            .map((id) => this.game.getActorById(id))
            .filter(
                (actor): actor is ConstructionSiteActor =>
                    actor?.type === ActorType.ConstructionSite && !actor.isDead(),
            )
            .filter((site) => site.isAssignedTo(this) && site.remainingWood > 0)
        this.queue = sites.map(({ id }) => id)

        const tileRevision = this.game.world.tileRevision
        const activeSite = sites.find((site) => site.id === this.activeSiteId)
        const candidates = activeSite
            ? [activeSite, ...sites.filter((site) => site !== activeSite)]
            : sites
        const siteRoute = this.game.pf.findRoute(
            this.actor.position,
            candidates.map((site) => ({
                target: site,
                positions: this.game.getBuildingApproaches(site),
            })),
        )
        this.activeSiteId = siteRoute?.target.id
        if (siteRoute && this.carriedWood > 0) {
            return { site: siteRoute.target, path: siteRoute.path, tileRevision }
        }
        if (sites.length && !siteRoute) return
        if (!sites.length && !this.carriedWood) return

        const camps = this.game.actors
            .filter(isWoodCampActor)
            .filter(
                (camp) =>
                    camp.player === this.actor.player &&
                    !camp.isDead() &&
                    (siteRoute ? camp.woodStock > 0 : camp.getFreeWoodStorage() > 0),
            )
        const campRoute = this.game.pf.findRoute(
            this.actor.position,
            camps.map((camp) => ({
                target: camp,
                positions: [camp.getDeliveryPosition()],
            })),
            false,
        )
        if (!campRoute) return
        return {
            site: siteRoute?.target,
            camp: campRoute.target,
            path: campRoute.path,
            tileRevision,
        }
    }

    private isCurrent({ site, camp, tileRevision }: Job) {
        if (tileRevision !== this.game.world.tileRevision) return false
        if (site && (!site.isAssignedTo(this) || site.remainingWood <= 0)) {
            return false
        }
        if (!camp) return true
        return (
            this.game.getActorById(camp.id) === camp &&
            !camp.isDead() &&
            (site ? camp.woodStock > 0 : camp.getFreeWoodStorage() > 0)
        )
    }

    public toJSON(): BuilderProfessionJSON {
        return {
            ...super.toJSON(),
            queue: [...this.queue],
            carriedWood: this.carriedWood,
            activeSiteId: this.activeSiteId,
        }
    }

    public fromJSON(json: BuilderProfessionJSON) {
        super.fromJSON(json)
        this.queue = [...json.queue]
    }
}

interface BuilderProfessionJSON extends ProfessionJSON {
    queue: string[]
    carriedWood: number
    activeSiteId?: string
}
