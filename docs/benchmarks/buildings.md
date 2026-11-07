# Building renderer benchmark (#9)

Run with Node.js 24 and a fresh Chrome profile. Start Vite in one terminal and run the fixture in another.

```sh
pnpm dev
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  node benchmarks/run-buildings.mjs docs/benchmarks/buildings 24
```

Set `BENCHMARK_URL` to the fixture URL if Vite starts on a different port. The default URL is `http://localhost:3333/Medieval/benchmarks/buildings.html`. The browser runner executes the interaction checks, captures screenshots, and writes raw results as JSON. Pass `0` as the sample count to run only the interaction checks.

## Setup

- Chrome 149.0.7827.103 headless with ANGLE SwiftShader on an Apple M1 Pro MacBook Pro, 16 GB RAM, macOS 26.5.2. Viewport 800 × 600, device pixel ratio 1.
- Paused simulation on flat terrain. Each populated scene has 100 buildings in a 10 × 10 grid at tile positions `[26 + 12 × column, 26 + 12 × row]`, with rotation `index % 4` and seed `93291 + index`. Mixed layout alternates Houses and Stakewalls.
- Each camera view pans horizontally by `0.2 × sin(frame × 0.25)` world units. House uses its authored near, middle, and far levels at 0, 100, and 160 tiles, with a 10% hysteresis band when moving closer.
- The clone baseline renders one object hierarchy per actor using the same authored LODs and deterministic variant seeds. This normalizes the old per-actor cloning approach for an equivalent-geometry comparison. In particular, it corrects the old House level order and gives both modes the same Stakewall variant distribution.
- Both modes use the same ambient and directional lighting, 1024 × 1024 directional shadow map, and Three.js composer with RenderPass, OutlinePass, and OutputPass. Timing uses an empty selection. Bloom, Bokeh, and FXAA are outside this fixture.
- Counters reset before each composer frame with `renderer.info.autoReset = false`. Scene calls and triangles include color, shadow, and fullscreen output submissions. Subtract the empty scene at the same view to isolate building submissions. Timing measures render preparation, submission, and a synchronous one-pixel readback to wait for the rendered frame. Each case warms up for 8 frames and reports median and nearest-rank p95 over 24 measured frames. This measures the software fixture, including readback overhead.

## Results

All counts are per-frame means. Call and triangle pairs read clone → instance. Building-only triangle counts are each scene total minus 3.

| Layout | View | Scene calls | Building calls | Scene triangles | Clone ms median / p95 | Instance ms median / p95 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Empty | near | 2 → 2 | 0 → 0 | 3 → 3 | 25.20 / 30.20 | 24.40 / 27.90 |
| Empty | mixed | 2 → 2 | 0 → 0 | 3 → 3 | 24.50 / 29.30 | 21.10 / 29.50 |
| Empty | far | 2 → 2 | 0 → 0 | 3 → 3 | 25.20 / 64.30 | 27.60 / 45.30 |
| House | near | 802 → 10 | 800 → 8 | 631,603 → 631,603 | 151.30 / 247.70 | 190.10 / 220.70 |
| House | mixed | 634.17 → 22 | 632.17 → 20 | 213,505.50 → 213,505.50 | 107.60 / 152.70 | 98.80 / 109.70 |
| House | far | 602 → 8 | 600 → 6 | 7,603 → 7,603 | 44.40 / 52.20 | 42.30 / 47.70 |
| Stakewall | near | 2,512.62 → 50 | 2,510.62 → 48 | 28,419.25 → 28,435 | 98.40 / 182.20 | 77.80 / 144.40 |
| Stakewall | mixed | 2,514 → 50 | 2,512 → 48 | 28,435 → 28,435 | 72.60 / 77.50 | 70.10 / 79.30 |
| Stakewall | far | 2,514 → 50 | 2,512 → 48 | 28,435 → 28,435 | 87.50 / 193.00 | 80.10 / 120.10 |
| Mixed | near | 1,641.21 → 58 | 1,639.21 → 56 | 329,833.83 → 329,843 | 145.80 / 185.70 | 148.40 / 217.40 |
| Mixed | mixed | 1,558.17 → 70 | 1,556.17 → 68 | 120,989.50 → 120,989.50 | 86.10 / 101.60 | 100.10 / 184.40 |
| Mixed | far | 1,542 → 56 | 1,540 → 54 | 17,843 → 17,843 | 76.00 / 309.80 | 72.00 / 132.40 |

At equivalent near LOD, House building draws fell from 800 to 8. Near Houses use four material primitives, each submitted once for color and once for shadows. Far LOD reduced House building triangles from 631,600 to 7,600, a 98.8% reduction independent of batching. Mixed-distance Houses used all three levels. Stakewall building draws fell from 2,512 to 48 in the mixed and far views.

Batch-level culling submitted slightly more triangles than per-mesh culling in the near Stakewall and mixed-layout scenes. Median frame time rose in the near House and near and mixed views of the alternating layout. p95 rose in the mixed Stakewall and near and mixed views of the alternating layout. Timing includes software rasterization and readback and varies across runs.

[Raw measurements](buildings/results.json)

## Browser checks

The fixture dispatches canvas click and box-selection events, checks that only selected instances reach the outline pass, and moves a selected House through the LODs. It rebuilds instance batches from a save and compares the restored transforms, removes and replaces actors, checks that stale proxies and primitives disappear, verifies active instance bounds, and compares the rotated Stakewall preview matrices with the committed instance matrices.

Screenshots show the instanced renderer.

- [100 Houses near](buildings/house-near.png) and [100 Houses far](buildings/house-far.png)
- [100 Stakewalls near](buildings/stakewall-near.png) and [100 Stakewalls far](buildings/stakewall-far.png)
- [Mixed distance and individual outline](buildings/mixed-mixed.png)

## Asset follow-up

The measurements above capture the state of #9. See the [#10 benchmark](buildings-lod.md) for the four additional building LODs and their measurements.
