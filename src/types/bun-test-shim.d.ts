/**
 * Minimal ambient types for Bun's built-in test runner (`bun:test`).
 *
 * WHY THIS EXISTS: `@types/bun` cannot be installed (the npm registry is
 * blocked in this sandbox), yet `tsc --noEmit` typechecks our `*.test.ts`
 * files. This declares just the test API surface we use so the typecheck
 * stays green offline. Bun provides the real implementation at runtime.
 */
declare module 'bun:test' {
  export function describe(label: string, fn: () => void): void;
  export function test(label: string, fn: () => void | Promise<void>): void;
  export function it(label: string, fn: () => void | Promise<void>): void;
  export function beforeAll(fn: () => void | Promise<void>): void;
  export function afterAll(fn: () => void | Promise<void>): void;
  export function beforeEach(fn: () => void | Promise<void>): void;
  export function afterEach(fn: () => void | Promise<void>): void;

  export interface AsyncMatchers {
    toBe(expected: unknown): Promise<void>;
    toEqual(expected: unknown): Promise<void>;
    toContain(expected: unknown): Promise<void>;
    toThrow(expected?: unknown): Promise<void>;
    readonly not: AsyncMatchers;
  }

  export interface Matchers {
    toBe(expected: unknown): void;
    toEqual(expected: unknown): void;
    toBeDefined(): void;
    toBeUndefined(): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toContain(expected: unknown): void;
    toBeGreaterThan(expected: number): void;
    toBeGreaterThanOrEqual(expected: number): void;
    toBeLessThan(expected: number): void;
    toBeLessThanOrEqual(expected: number): void;
    toThrow(expected?: unknown): void;
    readonly rejects: AsyncMatchers;
    readonly resolves: AsyncMatchers;
    readonly not: Matchers;
  }

  export function expect(actual: unknown): Matchers;
}
