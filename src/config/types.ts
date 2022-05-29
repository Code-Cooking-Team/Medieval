import { ChangeableConfigDefinition } from './lib/definitions'

export interface Config {
    [key: string]: {
        [key: string]: {}
    }
}

export interface ConfigOptions {
    [key: string]: {
        [key: string]: ChangeableConfigDefinition
    }
}
