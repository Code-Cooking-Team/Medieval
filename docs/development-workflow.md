# Development workflow

Use the pnpm version pinned in [package.json](../package.json) with a compatible Node version. Install with `pnpm install`.

| Goal | Command |
| --- | --- |
| Local game | `pnpm dev`, then open `http://localhost:3333/Medieval/` |
| Type check | `pnpm ts` |
| Unit tests, one run | `pnpm test --run` |
| Focused test | `pnpm test --run src/game/algorithm/squareFloodFill.test.ts` |
| Build and serve production assets locally | `pnpm build`, then `pnpm preview` |

Tests live beside the code. [Vitest config](../vitest.config.ts) supplies globals, Happy DOM, and TypeScript path alias support. The [pre-commit hook](../.husky/pre-commit) runs the type check and unit tests. `pnpm format` rewrites the full TS/TSX tree; for a focused change, use `pnpm exec prettier --write <changed files>`.

Use the browser for WebGL, camera, pointer input, and model loading changes. The **Spawn** tab gives you actors to exercise selection, movement, and placement. **Stop** pauses simulation ticks; **Tick** advances one step while stopped. The console exposes `window.game` and `window.logStats()` for inspecting live state and renderer counts. Save and config values persist across reloads; use a fresh browser profile if you need clean defaults without deleting local state.

[Vite](../vite.config.ts) serves under `/Medieval/` and treats `.gltf` and `.hdr` as assets. For changes to model imports or asset paths, check the production preview as well as dev. The [Pages workflow](../.github/workflows/deploy.yml) builds and publishes `dist/` on pushes to `main`.
