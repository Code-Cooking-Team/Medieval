# Development workflow

Use Node.js 24 LTS and the Bun version pinned in [package.json](../package.json). Install with `bun install --frozen-lockfile`. The browser needs WebGL 2.

| Goal | Command |
| --- | --- |
| Local game | `bun run dev`, then open `http://localhost:3333/Medieval/` |
| Lint | `bun run lint` |
| Type check | `bun run ts` |
| Unit tests, one run | `bun run test` |
| Focused test | `bun run test src/game/algorithm/squareFloodFill.test.ts` |
| Build and serve production assets locally | `bun run build`, then `bun run preview` |

Tests live beside the code. [Bun test setup](../test/setup.ts) supplies Happy DOM and stand-in model groups. Browser checks exercise the real GLTF assets. The [pre-commit hook](../.husky/pre-commit) runs lint, the type check, and the unit tests. `bun run format` rewrites the full TS/TSX tree; for a focused change, use `bunx --no-install prettier --write <changed files>`.

Use the browser for WebGL, camera, pointer input, and model loading changes. The **Spawn** tab gives you actors to exercise selection, movement, and placement. **Stop** pauses simulation ticks; **Tick** advances one step while stopped. The console exposes `window.game` and `window.logStats()` for inspecting live state and renderer counts. Save and config values persist across reloads; use a fresh browser profile if you need clean defaults without deleting local state.

Drag with two fingers on the game canvas to pan, or pinch to zoom. A single tap still selects or places actors. The `bokehAutofocus` setting in **Config → postProcessing** controls whether gameplay depth of field follows the terrain and actors at the center of the view.

[Vite](../vite.config.ts) serves under `/Medieval/` and treats `.gltf` and `.hdr` as assets. For changes to model imports or asset paths, check the production preview as well as dev. The [Pages workflow](../.github/workflows/deploy.yml) installs from the Bun lockfile and runs lint, type checks, and tests before publishing `dist/` to `gh-pages` on pushes to `main`.
