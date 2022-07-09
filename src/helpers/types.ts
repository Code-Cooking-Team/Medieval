export interface ClassType<T, A extends any[]> extends Function {
    new (...args: A): T
}
