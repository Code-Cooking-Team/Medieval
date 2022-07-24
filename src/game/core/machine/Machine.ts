import { asArray } from '+helpers'

import { Machine, MachineActions, MachineConditions } from './types'

export class MachineInterpreter {
    public currentState: string
    private locked = false

    constructor(
        private machine: Machine,
        private actions: MachineActions = {},
        private conditions: MachineConditions = {},
    ) {
        this.currentState = machine.initial
    }

    public async send(event: string) {
        if (this.locked) return

        const state = this.machine.states[this.currentState]
        if (!state) throw new Error(`[Machine] State ${this.currentState} not found`)
        const transitions = state.on?.[event]

        const transitionArray = asArray(transitions)

        for (const transition of transitionArray) {
            if (transition.cond && !this.callCondition(transition.cond)) continue

            const actionsArray = asArray(transition.actions)

            for (const actionName of actionsArray) {
                this.locked = true
                await this.callAction(actionName)
                this.locked = false
            }

            if (transition.target) {
                this.currentState = transition.target
                return
            }

            break
        }
    }

    public reset() {
        this.currentState = this.machine.initial
        this.locked = false
    }

    private callAction(actionName: string) {
        const action = this.actions[actionName]
        if (!action) throw new Error(`[Machine] Action ${actionName} not found`)
        return action()
    }

    private callCondition(conditionName: string) {
        const cond = this.conditions[conditionName]
        if (!cond) throw new Error(`[Machine] Condition ${conditionName} not found`)
        return cond()
    }
}
