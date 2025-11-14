import { describe, expect, it, vi } from "vitest";

import { Lazy } from "./lazy.js";

describe("lazy", () => {
	describe("get", () => {
		it("should call initialization function on first get", () => {
			const initFunc = vi.fn(() => "initialized value");
			const lazy = new Lazy(initFunc);

			const result = lazy.get();

			expect(initFunc).toHaveBeenCalledOnce();
			expect(result).toBe("initialized value");
		});

		it("should not call initialization function on subsequent gets", () => {
			const initFunc = vi.fn(() => "value");
			const lazy = new Lazy(initFunc);

			lazy.get();
			lazy.get();
			lazy.get();

			expect(initFunc).toHaveBeenCalledOnce();
		});

		it("should return cached value on subsequent gets", () => {
			const lazy = new Lazy(() => ({ data: "test" }));

			const first = lazy.get();
			const second = lazy.get();
			const third = lazy.get();

			// Should return same instance
			expect(first).toBe(second);
			expect(second).toBe(third);
		});

		it("should handle functions that return null", () => {
			const lazy = new Lazy(() => null);

			const result = lazy.get();

			expect(result).toBeNull();
		});

		it("should handle functions that return falsy values", () => {
			const lazyFalse = new Lazy(() => false);
			const lazyZero = new Lazy(() => 0);
			const lazyEmptyString = new Lazy(() => "");

			expect(lazyFalse.get()).toBe(false);
			expect(lazyZero.get()).toBe(0);
			expect(lazyEmptyString.get()).toBe("");
		});
	});

	describe("set", () => {
		it("should set value without calling initialization function", () => {
			const initFunc = vi.fn(() => "initialized");
			const lazy = new Lazy(initFunc);

			lazy.set("manual value");

			expect(initFunc).not.toHaveBeenCalled();
			expect(lazy.get()).toBe("manual value");
		});

		it("should override initialized value when called after get", () => {
			const lazy = new Lazy(() => "original");

			expect(lazy.get()).toBe("original");

			lazy.set("updated");

			expect(lazy.get()).toBe("updated");
		});

		it("should prevent initialization if called before get", () => {
			const initFunc = vi.fn(() => "initialized");
			const lazy = new Lazy(initFunc);

			lazy.set("preset value");
			const result = lazy.get();

			expect(initFunc).not.toHaveBeenCalled();
			expect(result).toBe("preset value");
		});

		it("should allow setting value multiple times", () => {
			const lazy = new Lazy(() => "original");

			lazy.set("first");
			expect(lazy.get()).toBe("first");

			lazy.set("second");
			expect(lazy.get()).toBe("second");

			lazy.set("third");
			expect(lazy.get()).toBe("third");
		});
	});

	describe("edge cases", () => {
		it("should handle initialization function that throws error", () => {
			const lazy = new Lazy(() => {
				throw new Error("Initialization failed");
			});

			expect(() => lazy.get()).toThrow("Initialization failed");
		});

		it("should cache error state after failed initialization", () => {
			let callCount = 0;
			const lazy = new Lazy(() => {
				callCount++;
				throw new Error("Init error");
			});

			expect(() => lazy.get()).toThrow("Init error");
			// Errors are cached to maintain consistent behavior - the
			// initialization function is only ever called once, even if it throws
			expect(callCount).toBe(1);
		});

		it("should work with complex objects", () => {
			const lazy = new Lazy(() => {
				return {
					method() {
						return "called";
					},
					nested: { value: [1, 2, 3] },
				};
			});

			const result = lazy.get();

			expect(result.nested.value).toEqual([1, 2, 3]);
			expect(result.method()).toBe("called");
		});

		it("should work with functions as values", () => {
			// eslint-disable-next-line unicorn/consistent-function-scoping -- Here for test
			function func(): string {
				return "hello";
			}

			const lazy = new Lazy(() => func);

			const result = lazy.get();

			expect(result).toBe(func);
			expect(result()).toBe("hello");
		});
	});
});
