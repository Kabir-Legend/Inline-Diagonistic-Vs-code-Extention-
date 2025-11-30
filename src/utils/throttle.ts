export class Throttle {
    private timeoutId: NodeJS.Timeout | undefined;
    private lastExecutionTime: number = 0;

    constructor(private delay: number) {}

    public execute(callback: () => void): void {
        const now = Date.now();
        const timeSinceLastExecution = now - this.lastExecutionTime;

        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }

        if (timeSinceLastExecution >= this.delay) {
            this.lastExecutionTime = now;
            callback();
        } else {
            const remainingTime = this.delay - timeSinceLastExecution;
            this.timeoutId = setTimeout(() => {
                this.lastExecutionTime = Date.now();
                callback();
            }, remainingTime);
        }
    }

    public cancel(): void {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = undefined;
        }
    }

    public setDelay(delay: number): void {
        this.delay = delay;
    }

    public dispose(): void {
        this.cancel();
    }
}

export class Debounce {
    private timeoutId: NodeJS.Timeout | undefined;

    constructor(private delay: number) {}

    public execute(callback: () => void): void {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }

        this.timeoutId = setTimeout(() => {
            callback();
            this.timeoutId = undefined;
        }, this.delay);
    }

    public cancel(): void {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = undefined;
        }
    }

    public setDelay(delay: number): void {
        this.delay = delay;
    }

    public immediate(callback: () => void): void {
        this.cancel();
        callback();
    }

    public dispose(): void {
        this.cancel();
    }
}

export function debounce<T extends (...args: unknown[]) => void>(
    func: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | undefined;

    return (...args: Parameters<T>): void => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            func(...args);
        }, delay);
    };
}

export function throttle<T extends (...args: unknown[]) => void>(
    func: T,
    delay: number
): (...args: Parameters<T>) => void {
    let lastExecutionTime = 0;
    let timeoutId: NodeJS.Timeout | undefined;

    return (...args: Parameters<T>): void => {
        const now = Date.now();
        const timeSinceLastExecution = now - lastExecutionTime;

        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        if (timeSinceLastExecution >= delay) {
            lastExecutionTime = now;
            func(...args);
        } else {
            const remainingTime = delay - timeSinceLastExecution;
            timeoutId = setTimeout(() => {
                lastExecutionTime = Date.now();
                func(...args);
            }, remainingTime);
        }
    };
}
