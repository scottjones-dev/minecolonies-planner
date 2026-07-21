# MineColonies Planner

[MineColonies Planner](https://github.com/scottjones-dev/minecolonies-planner)
is a publishable Next.js website and browser-based workspace for laying out a
Minecraft MineColonies settlement before committing blocks in-game. The public
landing page introduces the project; `/planner` opens the local-first planning
tool.

It provides a block grid, upgrade-aware footprints, collision and square
colony-boundary checks, residence-to-work assignments, commute warnings,
level-aware guard coverage, source-derived top-down building previews, named
local saves, seed-biome context, calibrated map-mod backgrounds, and versioned JSON
transfer.

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

Open [http://localhost:3000](http://localhost:3000) for the website or
[http://localhost:3000/planner](http://localhost:3000/planner) for the planner.
The contact form remains safely unavailable until Resend is configured.

For local email delivery, copy `.env.example` to `.env.local` and replace every
placeholder. `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, and `CONTACT_FROM_EMAIL` stay
on the server. `NEXT_PUBLIC_SITE_URL` and the optional
`NEXT_PUBLIC_CONTACT_EMAIL` are public build-time settings.

A production verification run is:

```bash
pnpm test
pnpm lint
pnpm build
```

See [`docs/deployment.md`](docs/deployment.md) for the Resend domain setup,
Vercel environment table, deployment procedure, and production smoke test.

## Project links

- Source and issues: [GitHub repository](https://github.com/scottjones-dev/minecolonies-planner)
- Creator: [Scott William Jones on GitHub](https://github.com/scottjones-dev)
- Scott's work: [Alice Systems](https://alicesystems.co.uk)

## MVP usage

1. Choose a style and drag a building from the library onto the map. The visible
   level is centred on the exact drop position even when its source anchor is
   off-centre.
2. Select a placed building to rotate it, choose current/reserved upgrade
   levels, inspect that level's top-down block image and front direction, assign
   a workplace residence, or delete it.
3. Drag the map to pan and use the mouse wheel or trackpad to zoom. Buildings snap to whole Minecraft blocks.
4. Use the map-pin button to save the world seed, Java version, dimension, and
   generator. Optionally attach a north-up PNG, JPEG, or WebP from Xaero,
   JourneyMap, VoxelMap, MapWriter, or another map tool and calibrate its
   top-left Minecraft X/Z coordinate and pixels-per-block scale.
5. Open planner settings in the header to configure the server's initial
   claim radius, commute thresholds, and overlays. Place the Town Hall first;
   later blueprints must fit completely inside land claimed earlier in the
   plan, matching MineColonies placement order.
6. Use the named-layout controls to create, rename, switch, or delete browser-local plans. Changes save automatically.
7. Use the import button for a versioned planner-layout or style-catalogue JSON file. The export menu downloads the active layout or style.

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

Named layouts and imported style catalogues are stored in browser
`localStorage`. An imported map image is stored separately in browser
IndexedDB so a large image does not exhaust layout storage. No account, server,
or external database is used. Exported JSON includes an explicit schema version
and is validated before import. The importer does not execute or parse mod JARs,
archives, schematics, or NBT data.

## Current limitations

- The built-in library contains all 9,445 blueprints from all 23 style packs in
  the pinned MineColonies 1.20.1 source revision. Custom styles can still be
  supplied as planner catalogue JSON.
- MineColonies blueprint NBT extraction is a build-time maintainer workflow;
  the browser importer intentionally does not process mod JARs, archives,
  schematics, or NBT files.
- Blueprint images use source-derived material classes, procedural pixel
  texture, height lighting, and roof-edge shading. Exact Minecraft or modpack
  textures require the corresponding user-owned resource-pack assets, which
  are not redistributed by this site.
- Map backgrounds accept north-up PNG, JPEG, and WebP images up to 100 MB. The
  layout JSON includes source/calibration metadata but not the local image blob.
- Seed previews use cubiomes for supported vanilla Java biome placement. They
  do not represent explored chunks, player builds, datapacks, or modded terrain.
- The canvas is optimized for desktop planning. Small screens can view the map and header actions, while the full building library and inspector require a large viewport.
- Plans are device/browser-local unless exported manually. Clearing site storage removes unexported layouts and imported styles.
- There is no terrain, elevation, road/pathfinding, resource-cost, worker simulation, multiplayer, or cloud synchronization.
- Imported catalogue IDs cannot replace any built-in style pack.

## Attribution

This is an unofficial fan-built tool and is not affiliated with Mojang or the
MineColonies team. Generated blueprint metadata is derived from the pinned
MineColonies and Structurize sources identified in
[`docs/minecolonies-source.md`](docs/minecolonies-source.md) and retains its
GPL-3.0 source attribution.

Vanilla Java biome previews use the MIT-licensed
[cubiomes](https://github.com/Cubitect/cubiomes); the pinned revision and
license are recorded in [`third_party/cubiomes`](third_party/cubiomes).
