# MineColonies Planner

A browser-based planning tool for laying out a Minecraft MineColonies settlement before committing blocks in-game. The MVP provides a block grid, upgrade-aware footprints, collision and colony-boundary checks, residence-to-work assignments, commute warnings, Guard Tower coverage, named local saves, and versioned JSON transfer.

The repository also includes a reproducible build-time extractor for
source-backed MineColonies rules and blueprint geometry. See
[`docs/minecolonies-source.md`](docs/minecolonies-source.md).

All 23 bundled MineColonies style packs mirror the in-game Build Tool's nine
categories, nested subcategories, and blueprint ordering from the pinned
Structurize version. Catalogues load on demand to keep the first visit fast.

## Requirements

- Node.js 20 or newer
- pnpm 11

## Setup

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). A production verification run is:

```bash
pnpm test
pnpm build
```

## MVP usage

1. Choose a style and drag a building from the library onto the map.
2. Select a placed building to rotate it, choose current/reserved upgrade levels, assign a workplace residence, or delete it.
3. Drag the map to pan and use the mouse wheel or trackpad to zoom. Buildings snap to whole Minecraft blocks.
4. Open planner settings in the header to configure the server's initial
   claim radius, commute thresholds, and overlays. Place the Town Hall first;
   later blueprints must fit completely inside land claimed earlier in the
   plan, matching MineColonies placement order.
5. Use the named-layout controls to create, rename, switch, or delete browser-local plans. Changes save automatically.
6. Use the import button for a versioned planner-layout or style-catalogue JSON file. The export menu downloads the active layout or style.

Press `?` in the app for keyboard help. With a building selected, press `R` to rotate or `Delete`/`Backspace` to remove it.

Integer X/Z coordinates are rendered at the center of their block square.
Regular grid lines mark block edges, and heavier lines remain exact 16×16
chunk boundaries.

## Validation colors

- Red: invalid collision, boundary violation, commute, or missing required coverage.
- Amber: warning or uncovered anchor.
- Green: preferred commute.
- Chunk-aligned amber/red tiles: MineColonies square claim areas.
- Blue dashed square: the same level-based Guard Tower/Barracks range shown on
  MineColonies' colony map. Patrol-target distance is listed separately in the
  building inspector.

## Data and privacy

Named layouts and imported style catalogues are stored in browser `localStorage`. No account, server, or external database is used. Exported JSON includes an explicit schema version and is validated before import. The importer does not execute or parse mod JARs, archives, schematics, or NBT data.

## Known MVP limitations

- The built-in library contains all 9,445 blueprints from all 23 style packs in
  the pinned MineColonies 1.20.1 source revision. Custom styles can still be
  supplied as planner catalogue JSON.
- MineColonies blueprint NBT extraction is a build-time maintainer workflow;
  the browser importer intentionally does not process mod JARs, archives,
  schematics, or NBT files.
- The canvas is optimized for desktop planning. Small screens can view the map and header actions, while the full building library and inspector require a large viewport.
- Plans are device/browser-local unless exported manually. Clearing site storage removes unexported layouts and imported styles.
- There is no terrain, elevation, road/pathfinding, resource-cost, worker simulation, multiplayer, or cloud synchronization.
- Imported catalogue IDs cannot replace the built-in Fortress fallback.
