import { asArray } from '+helpers'

import { Machine, MachineActions, MachineConditions } from './types'

export class MachineInterpreter {
    public currentState: string

    constructor(
        private machine: Machine,
        private actions: MachineActions = {},
        private conditions: MachineConditions = {},
    ) {
        this.currentState = machine.initial
    }

    public async send(event: string) {
        const state = this.machine.states[this.currentState]
        if (!state) throw new Error(`[Machine] State ${this.currentState} not found`)
        const transitions = state.on?.[event]

        const transitionArray = asArray(transitions)

        for (const transition of transitionArray) {
            if (transition.cond && !this.callCondition(transition.cond)) continue

            const actionsArray = asArray(transition.actions)

            for (const actionName of actionsArray) {
                await this.callAction(actionName)
            }

            if (transition.target) {
                this.currentState = transition.target
                return
            }

            break
        }
    }

    public callAction(actionName: string) {
        const action = this.actions[actionName]
        if (!action) throw new Error(`[Machine] Action ${actionName} not found`)
        return action()
    }

    public callCondition(conditionName: string) {
        const cond = this.conditions[conditionName]
        if (!cond) throw new Error(`[Machine] Condition ${conditionName} not found`)
        return cond()
    }
}
