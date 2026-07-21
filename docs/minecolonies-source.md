# MineColonies source integration

The planner uses the MineColonies source checkout in `minecolonies/` as an
authoritative build-time input. It does not load or execute the Java mod in the
browser.

The generated catalogues are pinned to MineColonies commit
`b2fa2b6232ca33944d1489827e95ea5b40328325` for Minecraft 1.20.1. Provenance
and the relevant upstream file paths are embedded in
`src/data/generated/minecolonies-1.20.1.json`.

Build-tool ordering is matched to MineColonies' exact Structurize dependency,
`v1.20.1-1.0.806-snapshot` at commit
`8f6cad27f311eec2d8aee8b7c7bd58aa52edcd84`. Structurize sorts categories by
their subpath and blueprints by filename; the generated `categoryOrder`,
`categoryPath`, and `gameOrder` fields preserve that traversal.

## Regenerating

Place the MineColonies checkout at `minecolonies/`, or provide its location in
`MINECOLONIES_SOURCE`, and run:

```bash
pnpm minecolonies:extract
```

The extractor uses only Node.js built-ins. It reads the gzip-compressed NBT
blueprints directly and derives each footprint from `size_x`, `size_y`,
`size_z`, and Structurize's `primary_offset`. It decodes Structurize's packed
block palette in its source-defined Y/Z/X order to generate a compact top-down
image from the highest visible block in every column. The hut block's facing
property supplies the blueprint front marker when present. It currently
captures:

- all 9,445 blueprints across the 23 bundled MineColonies style packs, grouped
  into 3,423 selectable variants;
- each pack's nine in-game categories, nested subcategories, authors,
  description, and build-tool display order;
- exact dimensions, anchors, relative bounds, level, source path, top-down
  block image, and hut/front direction;
- colony configuration defaults;
- the exact registered colony-building types that can expand claims;
- generic, Town Hall, Guard Tower, Gate House, Barracks, and Barracks Tower
  claim radii by building level;
- Guard Tower patrol radii by building level, kept distinct from the square
  guard range shown on MineColonies' colony map.

The generated JSON is committed so normal app builds do not require the large
MineColonies checkout. Each style has its own generated module so the published
site can download it only when selected instead of shipping every catalogue on
the first visit. The browser turns the compact material/height cells into a
deterministic pixel-textured overhead image with height and edge shading, both
in the inspector and directly on the planning map. Re-run the extractor
intentionally when updating the pinned upstream source, then review the
generated diff and update its parity tests.

MineColonies is GPL-3.0 licensed. The generated document retains upstream
project, revision, source-path, and license provenance. Avoid copying Java
implementation code into the planner without first making a deliberate
licensing decision.
