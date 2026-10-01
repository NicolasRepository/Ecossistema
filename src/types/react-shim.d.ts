/**
 * Hand-written ambient type shim for the subset of the React API that this
 * project uses.
 *
 * WHY THIS EXISTS: the sandbox runs under INTEGRATIONS_ONLY, so the npm
 * registry is blocked and `@types/react` cannot be installed. React itself is
 * loaded by the BROWSER at runtime via an ESM import map (see index.html) that
 * points at a CDN. To let `tsc --noEmit` typecheck our `.tsx` files fully
 * offline, we declare just enough of the React surface here.
 *
 * This is intentionally permissive: it is a type-only shim, not a reimplementation.
 */

declare module 'react' {
  export type Key = string | number;
  export type ReactNode =
    ReactElement | string | number | boolean | null | undefined | ReactNode[];

  export interface ReactElement {
    type: unknown;
    props: unknown;
    key: Key | null;
  }

  export type FC<P = Record<string, unknown>> = (props: P) => ReactElement | null;
  export type FunctionComponent<P = Record<string, unknown>> = FC<P>;

  export type Dispatch<A> = (value: A) => void;
  export type SetStateAction<S> = S | ((prev: S) => S);

  export function useState<S>(initial: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  export function useState<S = undefined>(): [
    S | undefined,
    Dispatch<SetStateAction<S | undefined>>,
  ];

  export function useEffect(effect: () => void | (() => void), deps?: unknown[]): void;
  export function useMemo<T>(factory: () => T, deps?: unknown[]): T;
  export function useCallback<T extends (...args: never[]) => unknown>(
    callback: T,
    deps?: unknown[],
  ): T;
  export interface MutableRefObject<T> {
    current: T;
  }
  export function useRef<T>(initial: T): MutableRefObject<T>;
  export function useRef<T = undefined>(): MutableRefObject<T | undefined>;

  export interface ChangeEvent<T = Element> {
    target: T & { value: string };
    currentTarget: T & { value: string };
    preventDefault(): void;
  }

  export interface FormEvent<T = Element> {
    target: T;
    currentTarget: T;
    preventDefault(): void;
  }

  export interface MouseEvent<T = Element> {
    target: T;
    currentTarget: T;
    preventDefault(): void;
  }

  export interface CSSProperties {
    [key: string]: string | number | undefined;
  }

  const React: {
    createElement: (...args: unknown[]) => ReactElement;
    Fragment: unknown;
  };
  export default React;
}

declare module 'react/jsx-runtime' {
  import type { ReactElement, Key } from 'react';
  export function jsx(type: unknown, props: unknown, key?: Key): ReactElement;
  export function jsxs(type: unknown, props: unknown, key?: Key): ReactElement;
  export const Fragment: unknown;
}

declare module 'react/jsx-dev-runtime' {
  import type { ReactElement, Key } from 'react';
  export function jsxDEV(
    type: unknown,
    props: unknown,
    key?: Key,
    isStaticChildren?: boolean,
    source?: unknown,
    self?: unknown,
  ): ReactElement;
  export const Fragment: unknown;
}

declare module 'react-dom/client' {
  import type { ReactNode } from 'react';
  export interface Root {
    render(children: ReactNode): void;
    unmount(): void;
  }
  export function createRoot(container: Element | DocumentFragment): Root;
}

declare namespace JSX {
  interface Element {
    type: unknown;
    props: unknown;
    key: unknown;
  }
  interface ElementChildrenAttribute {
    children: Record<string, unknown>;
  }
  // Permissive intrinsic elements: any HTML tag with any props. Keeps the
  // offline typecheck green without reproducing the full DOM typings.
  interface IntrinsicElements {
    [elemName: string]: Record<string, unknown>;
  }
}
