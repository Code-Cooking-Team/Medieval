import { createMachine, MachineInterpreter } from './Machine'

const conditions = { isFalse: () => false, isTrue: () => true }

it('should make transition', () => {
    const machine = createMachine({
        initial: 'A',
        states: {
            A: {
                on: { TICK: { target: 'B' } },
            },
            B: {
                on: { TICK: { target: 'A' } },
            },
        },
    })

    const interpreter = new MachineInterpreter(machine)
    expect(interpreter.currentState).toBe('A')
    interpreter.send('TICK')
    expect(interpreter.currentState).toBe('B')
})

it('should make transition with condition', () => {
    const machine = createMachine({
        initial: 'A',
        states: {
            A: {
                on: {
                    TICK: { cond: 'isFalse', target: 'B' },
                },
            },
            B: {
                on: { TICK: { target: 'A' } },
            },
        },
    })

    const interpreterFalse = new MachineInterpreter(machine, {}, conditions)
    expect(interpreterFalse.currentState).toBe('A')
    interpreterFalse.send('TICK')
    expect(interpreterFalse.currentState).toBe('A')

    const interpreterTrue = new MachineInterpreter(machine, {}, conditions)
    expect(interpreterTrue.currentState).toBe('A')
    interpreterTrue.send('TICK')
    expect(interpreterTrue.currentState).toBe('A')
})

it('should run actions', () => {
    const machine = createMachine({
        'initial': 'A',
        'states': {
            'A': {
                'on': {
                    'TICK': {
                        'actions': 'dummy',
                        'target': 'B',
                    },
                },
            },
            'B': {
                'on': {
                    'TICK': {
                        'target': 'A',
                    },
                },
            },
        },
    })

    const dummy = vitest.fn()

    const interpreter = new MachineInterpreter(machine, { dummy })

    interpreter.send('TICK')

    expect(dummy).toHaveBeenCalled()
})
