// Глобальный шпион за выполняющимся эффектом
let activeEffect: (() => void) | null = null;

// 1. Объявляем константу как unique symbol. Это критически важно для TS!
export const ANGULAR_INPUT_SET: unique symbol = Symbol.for('angular.input.set') as any;

export interface Signal<T> {
    (): T;
}

export interface WritableSignal<T> extends Signal<T> {
    set(newValue: T): void;
    update(updateFn: (value: T) => T): void;
}

// Публичный интерфейс (только чтение)
export interface InputSignal<T> {
    (): T;
}

// Технический интерфейс (расширенный, знает про наш Symbol)
export interface TechnicalInputSignal<T> extends InputSignal<T> {
    [ANGULAR_INPUT_SET](newValue: T): void;
}

export interface ModelSignal<T> extends WritableSignal<T> {
    subscribeToEmit(callback: (value: T) => void): void;
}

/**
 * РЕАЛИЗАЦИЯ ДВИЖКА
 */
export function signal<T>(initialValue: T): WritableSignal<T> {
    let value = initialValue;
    const subscribers = new Set<() => void>();

    const signalFn = function (): T {
        if (activeEffect) {
            subscribers.add(activeEffect);
        }
        return value;
    } as WritableSignal<T>;

    signalFn.set = function (newValue: T): void {
        if (value !== newValue) {
            value = newValue;
            subscribers.forEach((effect) => effect());
        }
    };

    signalFn.update = function (updateFn: (value: T) => T): void {
        signalFn.set(updateFn(value));
    };

    return signalFn;
}

export function effect(fn: () => void): void {
    const effectFn = () => {
        activeEffect = effectFn;
        try {
            fn();
        } finally {
            activeEffect = null;
        }
    };
    effectFn();
}

export function computed<T>(fn: () => T): Signal<T> {
    let cachedValue: T;
    let isDirty = true;
    const subscribers = new Set<() => void>();

    const internalEffect = () => {
        isDirty = true;
        subscribers.forEach((sub) => sub());
    };

    return function (): T {
        if (activeEffect) {
            subscribers.add(activeEffect);
        }
        if (isDirty) {
            const prevActive = activeEffect;
            activeEffect = internalEffect;
            try {
                cachedValue = fn();
                isDirty = false;
            } finally {
                activeEffect = prevActive;
            }
        }
        return cachedValue;
    };
}

export function input<T>(initialValue: T): InputSignal<T> {
    const internalSignal = signal(initialValue);

    const inputFn = function (): T {
        return internalSignal();
    } as TechnicalInputSignal<T>;

    // Внутри функции это легально, так как inputFn типизирован как TechnicalInputSignal
    inputFn[ANGULAR_INPUT_SET] = function (newValue: T): void {
        internalSignal.set(newValue);
    };

    return inputFn;
}

export function model<T>(initialValue: T): ModelSignal<T> {
    const internalSignal = signal(initialValue);
    let emitCallback: ((value: T) => void) | null = null;

    const modelFn = function (): T {
        return internalSignal();
    } as ModelSignal<T>;

    modelFn.set = function (newValue: T): void {
        internalSignal.set(newValue);
        if (emitCallback) {
            emitCallback(newValue);
        }
    };

    modelFn.update = function (updateFn: (value: T) => T): void {
        modelFn.set(updateFn(internalSignal()));
    };

    modelFn.subscribeToEmit = function (callback: (value: T) => void): void {
        emitCallback = callback;
    };

    return modelFn;
}
