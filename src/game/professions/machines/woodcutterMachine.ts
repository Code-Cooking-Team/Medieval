import { createMachine } from '+game/core/machine/createMachine'

export const woodcutterMachine =
    /** @xstate-layout N4IgpgJg5mDOIC5QHcD2qIGMCuAXXYATgHQCSEANmAMQAqpAwgNKKgAOqsAlrl6gHasQAD0QBGAMwSADMQCs0gJwAWMQCZpygOzLFEtQBoQAT0QBaGROIAOOculaAbGsWO5ax44C+Xo2gw4+ETEDAAWqGxsXPxQtIRgNPTMQhzcvAJCogjWyo7EyjJyti4S1qXWRqYIymrWxIrWehLaclpyrc0+fuhYeAQkAOoAhhQA1tFQdIwsSCCpPHyCs1l2YvVyDdbqcmIOchKV5qWyDe7HOWVq+10g-r1BJAASQwBuYAM9U8mz8+lLoFkxO45PU9EpGtYPJDHIcEGZrLI1FppFcxAUdGUgTc7oF+sQPhgAHIJCCQL4zdicBYZZbiXZ1fTSORuaxadTOWFmGr1aSOIFiMqeBRiLTYnq44LEoaEBhDAC2bHJKSpf0y4g2iLsukcKg2QK0sO0JzEiiUjmayl0DTFAT6wWGPCVPxVizVCEcqnkji0tSutj2clhSOIEmRZUUHm9OtN3hu-AwcCEOLtJHIVGVaVdtIQilcxBRKK0WlZvNOnIk7WIWgk5s8ajUEj0jWUNvueLCESiMTiCQz1P+InEvLWygUOxcCnsOSDufqLkcmgaWkUClDrYlgxG4xifdV2b5VnructGgnmk57Py5vrKN25ojYnXKeIzzeBIgu6zAPVRXzqJkWz1hWMImOYajaDYK7eooYiOLYzK1E+Dz4j0xKQJAn40t+CC7FcxAmm4Ir2A244XtYdTFqOuahlRJFIXiUoyvKbCYQOgKlFo+QOB4ugaBIIqGKBCBSLI1gevsPrerynj0faQw8KxbrmgyrgIoo1bFm0sKwXUGgKB6tgGUWciyYQinZjsnErps2y7G0BxCVy+z1MUJECtI0ImT4XhAA */
    createMachine({
        'id': 'woodcutter',
        'initial': 'Idle',
        'states': {
            'Idle': {
                'on': {
                    'TICK': [
                        {
                            'cond': 'isFull',
                            'target': 'HaveWood',
                        },
                        {
                            'target': 'WoodNeeded',
                        },
                    ],
                },
            },
            'ChoppingTree': {
                'on': {
                    'TICK': [
                        {
                            'cond': 'isFull',
                            'target': 'Idle',
                        },
                        {
                            'actions': 'chopTree',
                            'target': 'WoodNeeded',
                        },
                    ],
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
            'HaveWood': {
                'on': {
                    'TICK': [
                        {
                            'cond': 'hasPath',
                            'target': 'Walking',
                        },
                        {
                            'cond': 'nearCamp',
                            'target': 'NearCamp',
                        },
                        {
                            'actions': 'findCamp',
                            'target': 'Walking',
                        },
                    ],
                },
            },
            'WoodNeeded': {
                'on': {
                    'TICK': [
                        {
                            'cond': 'hasPath',
                            'target': 'Walking',
                        },
                        {
                            'cond': 'nearTree',
                            'target': 'ChoppingTree',
                        },
                        {
                            'actions': 'findTree',
                            'target': 'Wait',
                        },
                    ],
                },
            },
            'NearCamp': {
                'on': {
                    'TICK': [
                        {
                            'cond': 'isEmpty',
                            'target': 'Idle',
                        },
                        {
                            'actions': 'gatherWood',
                            'target': 'HaveWood',
                        },
                    ],
                },
            },
            'Wait': {
                'on': {
                    'TICK': {
                        'target': 'Walking',
                    },
                },
            },
        },
    })
