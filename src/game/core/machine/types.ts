export interface Machine {
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
export interface MachineActions {
    [action: string]: () => void | Promise<any>
}
export interface MachineConditions {
    [condition: string]: () => boolean
}
