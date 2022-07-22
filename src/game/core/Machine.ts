import { asArray } from '+helpers'

interface Machine {
    id?: string
    initial: string
    states: { [state: string]: MachineState }
}

interface MachineState {
    on?: { [state: string]: MachineTransition | MachineTransition[] }
}

interface MachineTransition {
    target?: string
    actions?: string | string[]
    cond?: string
}

interface MachineActions {
    [action: string]: () => void
}

interface MachineConditions {
    [condition: string]: () => boolean
}

export const createMachine = (machine: Machine) => machine

export class MachineInterpreter {
    public currentState: string

    constructor(
        private machine: Machine,
        private actions: MachineActions = {},
        private conditions: MachineConditions = {},
    ) {
        this.currentState = machine.initial
    }

    public send(event: string) {
        const state = this.machine.states[this.currentState]
        if (!state) throw new Error(`State ${this.currentState} not found`)
        const transitions = state.on?.[event]

        const transitionArray = asArray(transitions)

        for (const transition of transitionArray) {
            if (transition.cond && !this.callCondition(transition.cond)) continue

            const actionsArray = asArray(transition.actions)

            for (const actionName of actionsArray) {
                this.callAction(actionName)
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
        if (!action) throw new Error(`Action ${actionName} not found`)
        action()
    }

    public callCondition(conditionName: string) {
        const cond = this.conditions[conditionName]
        if (!cond) throw new Error(`Condition ${conditionName} not found`)
        return cond()
    }
}
