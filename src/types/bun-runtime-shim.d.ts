/**
 * Minimal ambient types for the Bun runtime globals used by `dev-server.ts`.
 *
 * WHY THIS EXISTS: `@types/bun` and `@types/node` cannot be installed (the npm
 * registry is blocked in this sandbox), yet `tsc --noEmit` now typechecks
 * `dev-server.ts`. This declares just the surface that file touches
 * (`Bun.serve`, `Bun.file`, `process.env`, `import.meta.dir`) so the typecheck
 * stays green offline. Bun provides the real implementations at runtime, so the
 * signatures are intentionally loose — this is a dev-only tool.
 */

// Extends Blob so a BunFile can be passed to the DOM `Response` constructor
// (which accepts `BodyInit`); the real Bun.BunFile is Blob-compatible too.
interface BunFile extends Blob {
  exists(): Promise<boolean>;
}

interface BunServer {
  readonly port: number;
}

interface BunServeOptions {
  port?: number;
  fetch(request: Request): Response | Promise<Response>;
}

interface BunNamespace {
  serve(options: BunServeOptions): BunServer;
  file(path: string): BunFile;
}

declare const Bun: BunNamespace;

declare const process: {
  env: Record<string, string | undefined>;
};

interface ImportMeta {
  readonly dir: string;
}
