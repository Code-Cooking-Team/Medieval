// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
    '@@xstate/typegen': true
    eventsCausingActions: {
        'move': 'TICK'
    }
    internalEvents: {
        'error.platform.goToCamp': { type: 'error.platform.goToCamp'; data: unknown }
        'error.platform.putWood': { type: 'error.platform.putWood'; data: unknown }
        'xstate.after(2000)#woodcutter.Waiting': {
            type: 'xstate.after(2000)#woodcutter.Waiting'
        }
        'xstate.init': { type: 'xstate.init' }
        'done.invoke.findTree': {
            type: 'done.invoke.findTree'
            data: unknown
            __tip: 'See the XState TS docs to learn how to strongly type this.'
        }
        'error.platform.findTree': { type: 'error.platform.findTree'; data: unknown }
        'done.invoke.chopTree': {
            type: 'done.invoke.chopTree'
            data: unknown
            __tip: 'See the XState TS docs to learn how to strongly type this.'
        }
        'error.platform.chopTree': { type: 'error.platform.chopTree'; data: unknown }
        'done.invoke.goToCamp': {
            type: 'done.invoke.goToCamp'
            data: unknown
            __tip: 'See the XState TS docs to learn how to strongly type this.'
        }
        'done.invoke.putWood': {
            type: 'done.invoke.putWood'
            data: unknown
            __tip: 'See the XState TS docs to learn how to strongly type this.'
        }
    }
    invokeSrcNameMap: {
        'findTree': 'done.invoke.findTree'
        'chopTree': 'done.invoke.chopTree'
        'goToCamp': 'done.invoke.goToCamp'
        'putWood': 'done.invoke.putWood'
    }
    missingImplementations: {
        actions: 'move'
        services: 'findTree' | 'chopTree' | 'goToCamp' | 'putWood'
        guards: 'reachedTree' | 'hasPath' | 'hasSpace' | 'reachedCamp' | 'hasWood'
        delays: never
    }
    eventsCausingServices: {
        'findTree': 'xstate.after(2000)#woodcutter.Waiting'
        'chopTree': 'TICK'
        'goToCamp': 'TICK'
        'putWood': 'TICK'
    }
    eventsCausingGuards: {
        'reachedTree': 'TICK'
        'hasPath': 'TICK'
        'hasSpace': 'TICK'
        'reachedCamp': 'TICK'
        'hasWood': 'TICK'
    }
    eventsCausingDelays: {}
    matchesStates:
        | 'Idle'
        | 'GoingToATree'
        | 'GoingToATree.Finding'
        | 'GoingToATree.Going'
        | 'GoingToATree.IFeelATreeOMG'
        | 'ChoppingTree'
        | 'ChoppingTree.ChopChop'
        | 'ChoppingTree.ChoppedTree'
        | 'Waiting'
        | 'GoingToCamp'
        | 'GoingToCamp.SettingPath'
        | 'GoingToCamp.Going'
        | 'GatheringWood'
        | 'GatheringWood.PuttingWood'
        | 'GatheringWood.Putted'
        | 'WhereIsMyCabin'
        | 'Done'
        | {
              'GoingToATree'?: 'Finding' | 'Going' | 'IFeelATreeOMG'
              'ChoppingTree'?: 'ChopChop' | 'ChoppedTree'
              'GoingToCamp'?: 'SettingPath' | 'Going'
              'GatheringWood'?: 'PuttingWood' | 'Putted'
          }
    tags: never
}
