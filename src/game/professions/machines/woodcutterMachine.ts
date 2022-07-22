import { createMachine } from '+game/core/Machine'

export const woodcutterMachine =
    /** @xstate-layout N4IgpgJg5mDOIC5QHcD2qIGMCuAXXYATgHQCSEANmAMQAqpAwgNKKgAOqsAlrl6gHasQAD0QAOAJwB2YmIAsARgUBmAExSJANgkAGZQBoQAT0QBaBRLnEJ0zVLlSpO9XLsBfN4bQYc+IsQYAC1Q2Ni5+KFpCMBp6ZiEObl4BIVEEBVUAVis9V01NVR0NTKkxQxMEczExYm0xTQVnCQVM6olMjy90LDwCEgB1AEMKAGtwqDpGFiQQRJ4+QRm07IVrTIlqjMzGqUyDYzNlMR1rMUzVI515MTU9j08Qfgw4IW8evxJyKgTOeZSlxASVSaWrVZRKcGSOTZcqHPbEC4qOTQsFSBRyTogN6+PoBYKhcZRGI-JILVKIDI6VbgwoKTTKRxyIFSWHpZTEHTOZSac7OXmNZSY7G9fxDUbjEl-RagNINVbSVqObSK1ys8yqKyaMT2VQKSQqTnAoXdHFESXJaUiRDbGTtDZiLY7PZq6HsjbncFyNSFZH3NxAA */
    createMachine({
        'id': 'woodcutter',
        'initial': 'Idle',
        'states': {
            'Idle': {
                'on': {
                    'TICK': [
                        {
                            'cond': 'hasPath',
                            'target': 'Walking',
                        },
                        {
                            'actions': 'findCamp',
                            'cond': 'isFull',
                            'target': 'Walking',
                        },
                        {
                            'actions': 'chopTree',
                            'cond': 'nearTree',
                            'target': 'ChoppingTree',
                        },
                        {
                            'actions': 'findTree',
                        },
                    ],
                },
            },
            'ChoppingTree': {
                'on': {
                    'TICK': {
                        'target': 'Idle',
                    },
                },
            },
            'Walking': {
                'on': {
                    'TICK': [
                        {
                            'actions': 'move',
                            'cond': 'hasPath',
                        },
                        {
                            'target': 'Idle',
                        },
                    ],
                },
            },
        },
    })
