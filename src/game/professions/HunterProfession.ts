import type { HunterHutActor } from '+game/actors/buildings/hunterHut/HunterHutActor'
import { Actor } from '+game/core/Actor'
import { ActorType, Path, Position } from '+game/types'
import { distanceBetweenPoints, isSamePosition } from '+helpers'

import { Profession, ProfessionJSON } from './Profession'
import { ProfessionType } from './types'

const attackRange = 2.4
const retryTicks = 8
const meatYield = { [ActorType.Deer]: 20, [ActorType.Boar]: 30 }

type Route = { targetId: string; destination: Position; path: Path; revision: number }

export class HunterProfession extends Profession {
    public type = ProfessionType.Hunter
    public readonly defaultHeldItem = 'spear'
    public readonly controlsCombat = true
    public hutId?: string
    public preyId?: string
    public carriedMeat = 0
    private route?: Route
    private retryIn = 0

    public setHut(hut: HunterHutActor) {
        this.hutId = hut.id
        this.preyId = undefined
        this.actor.target = undefined
        this.actor.cancelPath()
        this.reset()
    }

    public reset() {
        super.reset()
        this.route = undefined
        this.retryIn = 0
    }

    public getAttackDamage() {
        return 10
    }

    public async tick() {
        super.tick()
        if (this.actor.isDead()) return

        // Retaliation interrupts both hunting and delivery without discarding meat.
        if (this.actor.target) {
            this.retryIn = 0
            const target = this.actor.target
            if (this.isLive(target)) this.pursue(target)
            else this.actor.target = undefined
            return
        }

        // Explicit movement orders take precedence over autonomous work.
        if (this.actor.isFindingPath || this.actor.hasPath()) {
            this.route = undefined
            this.preyId = undefined
            if (!this.actor.isFindingPath) {
                const next = this.actor.path[0]!
                if (this.game.pf.canStep(this.actor.position, [next.x, next.y]))
                    this.actor.move()
                else this.actor.cancelPath()
            }
            return
        }
        if (this.retryIn-- > 0) return

        if (this.carriedMeat > 0) {
            this.deliver()
            return
        }
        if (!this.huts().some((hut) => hut.getFreeMeatStorage() > 0)) {
            this.preyId = undefined
            this.route = undefined
            this.retryIn = retryTicks
            return
        }

        let prey = this.preyId ? this.game.getActorById(this.preyId) : undefined
        if (!prey || !this.isLive(prey)) {
            const route = this.game.pf.findRoute(
                this.actor.position,
                this.game
                    .findActorsByType(ActorType.Deer)
                    .filter((deer) => this.isLive(deer))
                    .map((deer) => ({ target: deer, positions: [deer.position] })),
                false,
            )
            if (!route) {
                this.preyId = undefined
                this.route = undefined
                this.retryIn = retryTicks
                return
            }
            prey = route.target
            this.preyId = prey.id
            this.setRoute(prey, prey.position, route.path)
        }
        this.pursue(prey)
    }

    private isLive(actor: Actor) {
        return !actor.isDead() && this.game.getActorById(actor.id) === actor
    }

    private huts() {
        return this.game
            .findActorsByType(ActorType.HunterHut)
            .filter(
                (actor): actor is HunterHutActor =>
                    actor.player === this.actor.player && this.isLive(actor),
            )
    }

    private pursue(target: Actor) {
        for (let step = 0; step <= 2; step++) {
            if (
                distanceBetweenPoints(this.actor.position, target.position) <= attackRange
            ) {
                this.route = undefined
                this.actor.cancelPath()
                this.actor.recordAction('attack', target)
                const damage = target.hit(this.actor.getAttackDamage(), this.actor)
                if (damage > 0 && target.isDead()) {
                    if (
                        target.type === ActorType.Deer ||
                        target.type === ActorType.Boar
                    ) {
                        this.carriedMeat += meatYield[target.type]
                    }
                    this.preyId = undefined
                    this.actor.target = undefined
                }
                return
            }
            if (step === 2) return
            if (!this.routeIsCurrent(target, target.position)) {
                const route = this.game.pf.findRoute(this.actor.position, [
                    { target, positions: [target.position] },
                ])
                if (!route) {
                    this.preyId = undefined
                    this.actor.target = undefined
                    this.route = undefined
                    this.retryIn = retryTicks
                    return
                }
                this.setRoute(target, target.position, route.path)
            }
            if (!this.moveAlongRoute()) return
        }
    }

    private deliver() {
        const huts = this.huts().filter((hut) => hut.getFreeMeatStorage() > 0)
        const assigned = huts.find((hut) => hut.id === this.hutId)
        const candidates = assigned
            ? [assigned, ...huts.filter((hut) => hut !== assigned)]
            : huts
        let hut = candidates.find((hut) => hut.id === this.route?.targetId)
        if (!hut || !this.routeIsCurrent(hut, hut.getDeliveryPosition())) {
            const route = this.game.pf.findRoute(
                this.actor.position,
                candidates.map((hut) => ({
                    target: hut,
                    positions: [hut.getDeliveryPosition()],
                })),
            )
            if (!route) {
                this.route = undefined
                this.retryIn = retryTicks
                return
            }
            hut = route.target
            this.hutId = hut.id
            this.setRoute(hut, hut.getDeliveryPosition(), route.path)
        }
        if (isSamePosition(this.actor.position, hut.getDeliveryPosition())) {
            this.carriedMeat -= hut.collectMeat(this.carriedMeat)
            this.route = undefined
        } else this.moveAlongRoute()
    }

    private setRoute(target: Actor, destination: Position, path: Path) {
        this.route = {
            targetId: target.id,
            destination: [...destination],
            path,
            revision: this.game.world.tileRevision,
        }
    }

    private routeIsCurrent(target: Actor, destination: Position) {
        const route = this.route
        return (
            route &&
            route.targetId === target.id &&
            route.revision === this.game.world.tileRevision &&
            isSamePosition(route.destination, destination)
        )
    }

    private moveAlongRoute() {
        const next = this.route?.path.shift()
        if (!next) {
            this.route = undefined
            return false
        }
        const position: Position = [next.x, next.y]
        if (!this.game.pf.canStep(this.actor.position, position)) {
            this.route = undefined
            return false
        }
        this.actor.position = position
        return true
    }

    public toJSON(): HunterProfessionJSON {
        return {
            ...super.toJSON(),
            hutId: this.hutId,
            preyId: this.preyId,
            carriedMeat: this.carriedMeat,
        }
    }

    public fromJSON({ hutId, preyId, carriedMeat, ...json }: HunterProfessionJSON) {
        super.fromJSON(json)
        this.hutId = hutId
        this.preyId = preyId
        this.carriedMeat = Math.max(0, carriedMeat ?? 0)
        this.reset()
    }
}

interface HunterProfessionJSON extends ProfessionJSON {
    hutId?: string
    preyId?: string
    carriedMeat?: number
}
