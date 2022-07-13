import { createMachine } from 'xstate'

export const woodcutterMachine =
    /** @xstate-layout N4IgpgJg5mDOIC5QHcD2qIGMCuAXXYATgHQCSEANmAMQAqpAwgNKKgAOqsAlrl6gHasQAD0QBGABwBWYhLkA2eQHYALAE41SsVJUAaEAE9EAJhXHiysWJVKADBJVSlS+QGYAvu-1oMOfEWIAcVQufihaVABBWkIwMGIAMVCIUKhqCAF40IA3VABreIAzZJi4oQ5uXgEhUQQxW2N5YiUJY2cxV3lpRql9Izr5c3kpeWsG11dpV3tPb3QsPAISYNSI6Nj4pP4UsOoiQlQSNgoAQ1xCw4BbYmLt0rByzh4+QSQRRFcR4gmVCSsJ+S2DS9QyIKQyNS2RxSNTaBwuVxqKSzEA+Bb+ZYhMJre5BLFpejMR6VF41RByFTEJzGKSfepqRzyNR9D62VzEBqtYwSVzGGnyX5KFFovxLPGrKK40gJOIUdZxADyAFlAnRGCw3hVntU3rVFLZiJotGoJLCRuoJCyEIp2X9jPUxMpBvUPF5UfNRQEGAALVBsNirDbEH1+kNsdKZYg5fLxTC+tj3Yna16gWquFQGjQqMRKE2uB1SCTyK1dGTZ7SKNRdbNtYUexZe+MB7FBsNhvaEA5HU7nK7EON+xOap5VFPvBAAWkaxHUKk6ijcKkcHRB-WmMk6NPBRs+iPkdd8DZIYeb4VbTcg9zVROHJJ1qfEYnMNMm00+Vak3MtoIQ8JnfJaWwtCZHljAPdExQAdROZ5dmEWBcDOeITkKJYAApjFsLCAEpqBFI9iGg2CoCTUcyQQbMZD5BklEaSYelMK1TCGLQc1pWxlE-Ws3XwjFxWxVAGBOS42GIABlMB8FSAAFM5vQjfgsn4XICmIKBUAiISRNI0ldUfKFZCA3NaVfDorQkJQZArGwoVUMwtHAz1MQlLTRIkqSwlk3B5P2Q5iGOM4LkIa51M04S2B0+9xzMDdHUhWFOlsR1aStKxlAsWlHB5FoVC6IUePrPiVgE1z+IJdVIrHWpWgkDlJlhDicy0VpUo49lhnTawJCAp81EcgjAjkohUkg+ZiGkxYRvmBSlJU+I2DwUaMEq8jaOfYxgXsVQHFSnRKUs+o5CLewNpUfqiqGwgpowcbJrCJaIA7Lt-J7ILrgW3AHpWvS6jsQ17E+AUaTENRGmLH8OjnYh7RNax7TnHRkQKw8Lu84b7rGib-EewkNXYEddIfBBCzUZojvhexNDUVxUtoqy7G65xaOsJ9zqg70iDAUhYCVAwhIAI1Cah4MQghiBQ9CpCw2xcN49nOe53mBdCb6ianSRiEdHMbFzO0aSYswLFY6QBRNdiwORiCAgAEUya88ZALUyJ+icOjEb5qKhU0HAzPQfwzGR9VhYx81zAUi08N1+AwOAhDlgJyCoVXx0dJQLGpwHjSS8FV0QKcDW6x1WlhZKsP3S2nLKnEgy2HYSNvZNyMBSkNGUOdAJJ8H+g6A1hlGHp5wa8u5hRsVivCSUg3H5PaisbqqUspdXFozokTEK1Jlq6nnEsJqtrOiuBvxau4jIGUwDle5lUCGfEDcUmGvTPlP1hDQN6lixOj+eyugsi2R6ts5AS8oHgN2dkTQsmYqyqGXt1TuVonAZX7joSyJpBgR0PnxE8gZT5tnjLfYm0Npj2CZF1ewvx14-mGGncYbRFDUg6P-d0o9Gx+lPLiE8l4NgEPTE0Is0CLK2BhJCHMVoXCUj5BxF8GhuQhzZqw-0ODQH4zvFVPOGsXAaB7tIEG2hjAIIcByEObRtzDHIfIkgRFeBhB4RMMmbIRFIgzFWDevwqSyOmHOamsILFV0EuFcSklrFQC8t6AhApKQTFBvDLCOi-b9AcOyayqggQcWZr48eYURJlQIU+IRVI3BaE3jCOGqUnzPkkA0Nw9Q2QTAycffx2kwGE3HIMA0US+RjHsFIawYi-rJOmBtaBroAGV0GmjK6GMbpY2CV9ZpUVahmEpFLJwbI+6LiLLtJ8zQelAR6W4RQ+VRkDUutdCAt1sYEJcBCCsiJaTggzDTCGbh2RSwaLSBcT8JAZNOVMiABCMwGhWXYToIwNld3EF4nZ9RVD1A2oMEZzDAGEQ5rERWfMTiCzHE7FptQpwClkDYGFoN6jZk6GUloFhCm8iBIItwvjbaKQIa7R0HJQaKE6XYQ5qUMxp1LFCTKjp7RMPjoQZlX5CVaCAiSqEHQIWTmpoZIuiIV46AcJHdwQA */
    createMachine({
        tsTypes: {} as import('./woodcutterMachine.typegen').Typegen0,
        'id': 'woodcutter',
        'initial': 'Idle',
        'states': {
            'Idle': {
                'on': {
                    'TICK': {
                        'target': 'Waiting',
                    },
                },
            },
            'GoingToATree': {
                'initial': 'Finding',
                'states': {
                    'Finding': {
                        'invoke': {
                            'src': 'findTree',
                            'id': 'findTree',
                            'onDone': [
                                {
                                    'target': 'Going',
                                },
                            ],
                            'onError': [
                                {
                                    'target': '#woodcutter.Idle',
                                },
                            ],
                        },
                    },
                    'Going': {
                        'on': {
                            'TICK': [
                                {
                                    'cond': 'reachedTree',
                                    'target': 'IFeelATreeOMG',
                                },
                                {
                                    'actions': 'move',
                                    'cond': 'hasPath',
                                },
                                {
                                    'target': '#woodcutter.Idle',
                                },
                            ],
                        },
                    },
                    'IFeelATreeOMG': {
                        'on': {
                            'TICK': {
                                'target': '#woodcutter.ChoppingTree',
                            },
                        },
                    },
                },
            },
            'ChoppingTree': {
                'initial': 'ChopChop',
                'states': {
                    'ChopChop': {
                        'invoke': {
                            'src': 'chopTree',
                            'id': 'chopTree',
                            'onDone': [
                                {
                                    'target': 'ChoppedTree',
                                },
                            ],
                            'onError': [
                                {
                                    'target': '#woodcutter.Idle',
                                },
                            ],
                        },
                    },
                    'ChoppedTree': {
                        'on': {
                            'TICK': [
                                {
                                    'cond': 'hasSpace',
                                    'target': 'ChopChop',
                                },
                                {
                                    'target': '#woodcutter.GoingToCamp',
                                },
                            ],
                        },
                    },
                },
            },
            'Waiting': {
                'after': {
                    '2000': {
                        'target': 'GoingToATree',
                    },
                },
            },
            'GoingToCamp': {
                'initial': 'SettingPath',
                'states': {
                    'SettingPath': {
                        'invoke': {
                            'src': 'goToCamp',
                            'id': 'goToCamp',
                            'onDone': [
                                {
                                    'target': 'Going',
                                },
                            ],
                            'onError': [
                                {
                                    'target': '#woodcutter.WhereIsMyCabin',
                                },
                            ],
                        },
                    },
                    'Going': {
                        'on': {
                            'TICK': [
                                {
                                    'cond': 'reachedCamp',
                                    'target': '#woodcutter.GatheringWood',
                                },
                                {
                                    'actions': 'move',
                                    'cond': 'hasPath',
                                },
                                {
                                    'target': '#woodcutter.WhereIsMyCabin',
                                },
                            ],
                        },
                    },
                },
            },
            'GatheringWood': {
                'initial': 'PuttingWood',
                'states': {
                    'PuttingWood': {
                        'invoke': {
                            'src': 'putWood',
                            'id': 'putWood',
                            'onDone': [
                                {
                                    'target': 'Putted',
                                },
                            ],
                            'onError': [
                                {
                                    'target': '#woodcutter.WhereIsMyCabin',
                                },
                            ],
                        },
                    },
                    'Putted': {
                        'on': {
                            'TICK': [
                                {
                                    'cond': 'hasWood',
                                    'target': 'PuttingWood',
                                },
                                {
                                    'target': '#woodcutter.Done',
                                },
                            ],
                        },
                    },
                },
            },
            'WhereIsMyCabin': {
                'after': {
                    '5000': {
                        'target': 'Idle',
                    },
                },
            },
            'Done': {
                'on': {
                    'TICK': {
                        'target': 'Idle',
                    },
                },
            },
        },
    })
