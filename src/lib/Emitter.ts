import Emittery from 'emittery'

export class Emitter<TEvents> extends Emittery<TEvents> {
    constructor(name: string, debug = false, logEventData = false, filter = '') {
        super({
            debug: {
                name,
                enabled: debug,
                logger: emitLogger(logEventData, filter) as any,
            },
        })
    }
}

export const emitLogger =
    (logEventData = false, filter?: string) =>
    (type: string, debugName: string, eventName?: string, eventData?: any) => {
        if (typeof eventName === 'symbol') {
            eventName = (eventName as Symbol).toString()
        }

        const currentTime = new Date()
        const hh = currentTime.getHours()
        const mm = currentTime.getMinutes().toString().padEnd(2, '0')
        const ss = currentTime.getSeconds().toString().padEnd(2, '0')
        const ms = currentTime.getMilliseconds().toString().padEnd(3, '0')
        const t = type !== 'emit' ? `(${type})` : ''

        const message = `${hh}:${mm}:${ss}.${ms} [${debugName}:${eventName}] ${t}`

        if (filter && !eventName?.includes(filter)) return

        if (logEventData && eventData) {
            console.log(message, eventData)
        } else {
            console.log(message)
        }
    }
