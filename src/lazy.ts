export class Lazy<T> {
	private readonly getValue: () => T;

	private isInitialized = false;
	private value: T | undefined;

	constructor(getValue: () => T) {
		this.getValue = getValue;
	}

	public get(): T {
		if (!this.isInitialized) {
			this.isInitialized = true;
			this.value = this.getValue();
		}

		return this.value as T;
	}

	public set(value: T): void {
		this.isInitialized = true;
		this.value = value;
	}
}
