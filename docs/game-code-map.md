# Game code map

## Start with the symptom

| Change | Start here | Follow it to |
| --- | --- | --- |
| Startup, reset, save/load | [App.tsx](../src/App.tsx) | [Game.ts](../src/game/Game.ts) owns the simulation, actor list, and snapshot. |
| Selection or orders | [SelectInteractions.ts](../src/game/player/interaction/methods/SelectInteractions.ts) | [HumanPlayer.ts](../src/game/player/HumanPlayer.ts) owns selection. Right-click tries the target actor's `interact` before assigning walkable destinations with flood fill. |
| Building placement | [BuildInteractions.ts](../src/game/player/interaction/methods/BuildInteractions.ts) | Build and Spawn share previews, raycasting, and full rotated footprint validation. Build queues Construction Sites. Spawn places finished buildings immediately. |
| Movement or walkability | [WalkableActor.ts](../src/game/core/WalkableActor.ts) | [Pathfinding.ts](../src/game/core/Pathfinding.ts) wraps EasyStar; `Game.tick` advances it. [World.ts](../src/game/world/World.ts) emits `tailUpdate` (actual spelling) on tile replacement; the running game refreshes the pathfinding grid. |
| Unit jobs | [HumanActor.ts](../src/game/actors/units/human/HumanActor.ts) | A building interaction or confirmed construction placement assigns the profession. [BuilderProfession.ts](../src/game/professions/BuilderProfession.ts) owns the Build Queue and hauled wood. For woodcutting, trace [WoodCampActor.ts](../src/game/actors/buildings/woodCamp/WoodCampActor.ts) → [WoodcutterProfession.ts](../src/game/professions/WoodcutterProfession.ts) → [woodcutterMachine.ts](../src/game/professions/machines/woodcutterMachine.ts). |
| Camera, terrain, or mesh | [Renderer.ts](../src/game/Renderer.ts) | The renderer drives frames independently of the game tick. Look in [RTSCamera.ts](../src/game/core/RTSCamera.ts) for camera behavior, [renderer/](../src/game/renderer/) for terrain and effects, and the actor's folder for its mesh and animation. |
| Sidebar or settings | [ui/modules/](../src/ui/modules/) | [config.ts](../src/config/config.ts) defines settings and defaults. [createConfig.ts](../src/config/lib/createConfig.ts) handles persistence under the browser's `config` key. |

## Cross-layer changes

- **Actors:** Start with a sibling in [actors/](../src/game/actors/). An actor holds simulation state; a building blueprint supplies the model and footprint; a renderer handles visuals. Check `ActorType` in [types.ts](../src/game/types.ts) and the class, blueprint, and renderer registrations in [actors/index.ts](../src/game/actors/index.ts). Trees use the basic renderer list. Check [SpawnList.tsx](../src/ui/modules/spawn/SpawnList.tsx) when exposing an actor in the sidebar.
- **Coordinates:** Map and world positions are `[x, y]`; the grid is indexed `tiles[y][x]`. [updateObjectPosition](../src/helpers/three.ts) maps the ground plane to Three.js X/Z and height to Three.js Y, scaled by `config.renderer.tileSize`. When changing picking, compare [RaycastFinder.ts](../src/game/player/interaction/methods/lib/RaycastFinder.ts) with the forward transform, including the map-center offset.
- **Maps:** `App.tsx` selects the default map (`de_river`) for a fresh game. [tileCodes.ts](../src/game/world/tileCodes.ts) turns the code grid into tiles; [Tile.ts](../src/game/world/Tile.ts) supplies tile defaults such as buildability and walk cost.
- **Saves:** `App.tsx` stores `GameJSON` under `saved-game2`. `Game.fromJSON` restores the world and players, then resolves actor ownership by player ID and looks up actor classes by type. When changing persisted state, check the relevant `toJSON` and `fromJSON` together and try a save/load round trip.
