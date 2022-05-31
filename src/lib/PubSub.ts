type Subscriber<TType> = (type: TType, ...payload: any[]) => void

export default class PubSub<TType> {
    subscribers: Subscriber<TType>[] = []

    subscribe(subscriber: Subscriber<TType>) {
        this.subscribers = [...this.subscribers, subscriber]
        return () => this.unsubscribe(subscriber)
    }

    unsubscribe(subscriber: Subscriber<TType>) {
        this.subscribers = this.subscribers.filter((sub) => sub !== subscriber)
    }

    publish(type: TType, ...payload: any[]) {
        console.log(type)
        this.subscribers.forEach((subscriber) => subscriber(type, payload))
    }
}
